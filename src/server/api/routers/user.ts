// src/server/api/routers/user.ts

import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  // QUERY to get the user's preferences
  getUserPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        dietTypeId: true,
        estimatedTime: true,
        highProtein: true,
        lowCalorie: true,
        strictSearch: true,
        UserAllergens: { // Select the related allergens
          select: {
            allergenId: true,
          },
        },
      },
    });

    if (!user) return null;

    // Transform the allergens list into a simple array of IDs
    return {
      dietTypeId: user.dietTypeId,
      estimatedTimeOption: user.estimatedTime ? String(user.estimatedTime)+" minutes" : null,
      highProtein: user.highProtein,
      lowCalorie: user.lowCalorie,
      strictSearch: user.strictSearch ?? false,
      allergensIDList: user.UserAllergens.map((a) => a.allergenId),
    };
  }),

  // MUTATION to save the user's preferences
  saveUserPreferences: protectedProcedure
    .input(z.object({
        dietTypeId: z.number(),
        estimatedTime: z.number(),
        allergensIDList: z.array(z.number()),
        highProtein: z.boolean(),
        lowCalorie: z.boolean(),
        strictSearch: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Use a transaction to update the user and their allergens atomically
      return ctx.db.$transaction(async (tx) => {
        // 1. Update the simple fields on the User model
        await tx.user.update({
          where: { id: userId },
          data: {
            dietTypeId: input.dietTypeId,
            estimatedTime: input.estimatedTime,
            highProtein: input.highProtein,
            lowCalorie: input.lowCalorie,
            strictSearch: input.strictSearch
          },
        });

        // 2. Update the many-to-many UserAllergens relation
        // First, delete all existing allergen relations for this user
        await tx.userAllergens.deleteMany({
          where: { userId: userId },
        });

        // Then, create the new ones if any were provided
        if (input.allergensIDList.length > 0) {
          await tx.userAllergens.createMany({
            data: input.allergensIDList.map((allergenId) => ({
              userId: userId,
              allergenId: allergenId,
            })),
          });
        }

        return { success: true };
      });
    }),

    // NEW: MUTATION to update ingredient usage counts for a user
  updateUserIngredientCounts: protectedProcedure
    .input(z.object({
        ingredientIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { ingredientIds } = input;

      if (ingredientIds.length === 0) {
        return { success: true, message: "No ingredients to update." };
      }

      // // Use a transaction to perform multiple operations atomically
      // return ctx.db.$transaction(async (tx) => {
      //   // We'll loop through each ingredient ID provided
      //   for (const ingredientId of ingredientIds) {
      //     // The `upsert` operation is perfect here:
      //     // - If a UserIngredients record for this user/ingredient already exists, it will run the `update` block.
      //     // - If it does not exist, it will run the `create` block.
      //     await tx.userIngredients.upsert({
      //       where: {
      //         // The unique identifier for the UserIngredients record
      //         userId_ingredientId: {
      //           userId: userId,
      //           ingredientId: ingredientId,
      //         },
      //       },
      //       // What to do if the record exists
      //       update: {
      //         counter: {
      //           increment: 1, // Increment the counter by 1
      //         },
      //       },
      //       // What to do if the record does NOT exist
      //       create: {
      //         userId: userId,
      //         ingredientId: ingredientId,
      //         counter: 1, // Start the counter at 1
      //       },
      //     });
      //   }
      //   return { success: true };
      // });

       // Use a transaction with an extended timeout just in case
        return ctx.db.$transaction(async (tx) => {
            // 1. Create an array of promises without awaiting them
            const upsertPromises = ingredientIds.map(ingredientId =>
                tx.userIngredients.upsert({
                    where: {
                        userId_ingredientId: { userId, ingredientId },
                    },
                    update: { counter: { increment: 1 } },
                    create: { userId, ingredientId, counter: 1 },
                })
            );

            // 2. Execute all the promises in parallel
            await Promise.all(upsertPromises);

            return { success: true };
        }, {
            timeout: 15000 // 15 seconds, a safe buffer
        });
    }),

    getInitialIngredients: protectedProcedure.query(({ ctx }) => {
    return ctx.db.userIngredients.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        ingredientId: true,
      },
    });
  }),


  // NEW: Mutation to increment interest count for a single recipe
    incrementRecipeInterest: protectedProcedure
        .input(z.object({ recipeId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            return ctx.db.userRecipeInterests.upsert({
                where: {
                    userId_recipeId: { userId, recipeId: input.recipeId },
                },
                update: {
                    counter: { increment: 1 },
                },
                create: {
                    userId,
                    recipeId: input.recipeId,
                    counter: 1,
                },
            });
        }),

    // NEW: Mutation to increment count for a single ingredient
    incrementIngredientCount: protectedProcedure
        .input(z.object({ ingredientId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            return ctx.db.userIngredients.upsert({
                where: {
                    userId_ingredientId: { userId, ingredientId: input.ingredientId },
                },
                update: {
                    counter: { increment: 1 },
                },
                create: {
                    userId,
                    ingredientId: input.ingredientId,
                    counter: 1,
                },
            });
        }),



      // NEW: Mutation to add a recipe to a user's favourites
    addFavourite: protectedProcedure
        .input(z.object({ recipeId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            // `create` will throw an error if the record already exists due to the @@id constraint,
            // which is what we want. We can catch this on the client if needed, but for a
            // well-behaved client, this is fine.
            return ctx.db.userRecipes.create({
                data: {
                    userId,
                    recipeId: input.recipeId,
                },
            });
        }),

    // NEW: Mutation to remove a recipe from a user's favourites
    removeFavourite: protectedProcedure
        .input(z.object({ recipeId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            
            return ctx.db.userRecipes.delete({
                where: {
                    userId_recipeId: { // Use the compound primary key
                        userId,
                        recipeId: input.recipeId,
                    },
                },
            });
        }),


    // updateUserRole: publicProcedure
    //     .input(z.object({ userId: z.string() }))
    //     .mutation(async ({ ctx, input }) => {
    //         return ctx.db.user.update({
    //           where: {
    //             id: input.userId
    //           },
    //           data: {
    //             role: "administrator"
    //           }
    //         })
    //     }),
  
});