import { TRPCError } from "@trpc/server";
import { create } from "domain";
import { link } from "fs";
import { Arapey } from "next/font/google";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

//types
// Define the shape of a single recipe coming from your JSON file
const recipeInputSchema = z.object({
  // id from json is a string, we don't need it for DB creation
  // id: z.string(), 
  title: z.string(),
  imageUrl: z.string().url(),
  link: z.string(),
  category: z.string(),
  area: z.string(),
  // IMPORTANT: We accept the dietType as a string, just like in the JSON
  dietType: z.number(), 
  estimatedTime: z.number(),
  allergens: z.number().array(),
  protein: z.number(),
  calorie: z.number(),
  ingredients: z.number().array(),
  measures: z.string().array(),
  instructions: z.string(),
});

export const recipeRouter = createTRPCRouter({

    createIngredients: publicProcedure
    .input(z.object({ name: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.ingredient.createMany({
            data: input.name.map((name) => ({ name })),
        });
        }),      

    createDietTypes: publicProcedure
    .input(z.object({ name: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.dietType.createMany({
            data: input.name.map((name) => ({ name })),
        });
    }),

    createAllergens: publicProcedure
    .input(z.object({ name: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.allergens.createMany({
            data: input.name.map((name) => ({ name })),
        });
    }),

  createManyRecipes: publicProcedure
    .input(z.object({
        recipes: z.array(recipeInputSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const { recipes } = input;

      try {
        // Use a transaction with a longer timeout just in case,
        // but this new logic should be much faster.
        const result = await ctx.db.$transaction(
          async (tx) => {
            // =================================================================
            // STEP 1: Bulk-insert all the base Recipe records
            // =================================================================
            console.log(`Starting bulk insert for ${recipes.length} recipes...`);

            const recipeCreateData = recipes.map((recipe) => ({
              title: recipe.title,
              imageUrl: recipe.imageUrl,
              link: recipe.link,
              category: recipe.category,
              area: recipe.area,
              instructions: recipe.instructions,
              estimatedTime: recipe.estimatedTime,
              protein: recipe.protein,
              calorie: recipe.calorie,
              dietTypeId: recipe.dietType, // Connect directly via ID
            }));

            // Use createMany for the main recipes. This is one SQL query.
            const createManyResult = await tx.recipe.createMany({
              data: recipeCreateData,
              skipDuplicates: true, // Optional: useful if you might re-run the seed
            });

            console.log(`Created ${createManyResult.count} base recipe records.`);

            // We need the IDs of the recipes we just created to link the relations.
            // We'll fetch them based on a unique property, like the title.
            // NOTE: This assumes recipe titles are unique in your seed file.
            // If not, you'll need another unique identifier.
            const createdRecipeTitles = recipes.map(r => r.title);
            const createdRecipes = await tx.recipe.findMany({
              where: {
                title: { in: createdRecipeTitles },
              },
              select: {
                id: true,
                title: true,
              },
            });

            // Create a lookup map for quick access: title -> db_id
            const recipeIdMap = new Map(createdRecipes.map(r => [r.title, r.id]));

            // =================================================================
            // STEP 2: Prepare data for the related records
            // =================================================================
            
            const recipeIngredientsData: { recipeId: number; ingredientId: number; measure: string | undefined; }[] = [];
            const recipeAllergensData: { recipeId: number; allergenId: number; }[] = [];

            for (const recipe of recipes) {
              const recipeId = recipeIdMap.get(recipe.title);

              if (!recipeId) {
                console.warn(`Could not find created recipe with title: ${recipe.title}. Skipping its relations.`);
                continue;
              }

              // Prepare ingredients data
              recipe.ingredients.forEach((ingredientId, index) => {
                recipeIngredientsData.push({
                  recipeId: recipeId,
                  ingredientId: ingredientId,
                  measure: recipe.measures[index] ?? undefined,
                });
              });

              // Prepare allergens data
              recipe.allergens.forEach((allergenId) => {
                recipeAllergensData.push({
                  recipeId: recipeId,
                  allergenId: allergenId,
                });
              });
            }

            // =================================================================
            // STEP 3: Bulk-insert all the related records
            // =================================================================
            console.log(`Bulk inserting ${recipeIngredientsData.length} ingredient relations...`);
            if (recipeIngredientsData.length > 0) {
              await tx.recipeIngredients.createMany({
                data: recipeIngredientsData,
                skipDuplicates: true,
              });
            }
            
            console.log(`Bulk inserting ${recipeAllergensData.length} allergen relations...`);
            if (recipeAllergensData.length > 0) {
              await tx.recipeAllergens.createMany({
                data: recipeAllergensData,
                skipDuplicates: true,
              });
            }

            return { count: createManyResult.count };
          },
          {
            // A 60-second timeout should be more than enough for this optimized approach
            timeout: 60000, 
          }
        );

        console.log(`Successfully created ${result.count} recipes and their relations.`);
        return result;

      } catch (error) {
        console.error("Failed to bulk create recipes:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during bulk creation.',
          cause: error,
        });
      }
    }),




  // // NEW: The bulk creation mutation
  // createManyRecipes: publicProcedure
  //   .input(z.object({
  //       recipes: z.array(recipeInputSchema), // We expect an array of recipes
  //   }))
  //   .mutation(async ({ ctx, input }) => {
  //     const { recipes } = input;

  //     // Use a transaction to ensure all recipes are created or none are.
  //     // This prevents a partially-seeded database if one recipe fails.
  //     try {
  //       const result = await ctx.db.$transaction(async (tx) => {
  //         let createdCount = 0;

  //         for (const recipe of recipes) {

  //           // 1. Create the recipe
  //           await tx.recipe.create({
  //             data: {
  //               title: recipe.title,
  //               imageUrl: recipe.imageUrl,
  //               link: recipe.link,
  //               category: recipe.category,
  //               area: recipe.area,
  //               instructions: recipe.instructions,
  //               estimatedTime: recipe.estimatedTime,
  //               protein: recipe.protein,
  //               calorie: recipe.calorie,
  //               // Connect to the existing DietType
  //               dietType: {
  //                 connect: { id: recipe.dietType },
  //               },
  //               // Create the join-table records for allergens
  //               allergens: {
  //                 create: recipe.allergens.map((allergenId) => ({
  //                   allergen: {
  //                     connect: { id: allergenId },
  //                   },
  //                 })),
  //               },
  //               // Create the join-table records for ingredients with their measures
  //               ingredients: {
  //                 create: recipe.ingredients.map((ingredientId, index) => ({
  //                   measure: recipe.measures[index],
  //                   ingredient: {
  //                     connect: { id: ingredientId },
  //                   },
  //                 })),
  //               },
  //             },
  //           });
  //           createdCount++;
  //         }

  //         return { count: createdCount };
  //       },{
  //     // Increase timeout to 30 seconds (30000 milliseconds)
  //     timeout: 1800000, 
  //   });
        
  //       console.log(`Successfully created ${result.count} recipes.`);
  //       return result;

  //     } catch (error) {
  //       console.error("Failed to create recipes in transaction:", error);
        
  //       // Re-throw the error so tRPC can handle it and send it to the client
  //       if (error instanceof TRPCError) {
  //         throw error;
  //       }
        
  //       throw new TRPCError({
  //         code: 'INTERNAL_SERVER_ERROR',
  //         message: 'An unexpected error occurred while creating recipes.',
  //         cause: error,
  //       });
  //     }
  //   }),


    //get ingredients
    getAllIngredients: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.ingredient.findMany({
            orderBy: { id: "asc" },
        });
    }),
    //get diet types
    getAllDietTypes: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.dietType.findMany({
            orderBy: { id: "asc" },
        });
    }),
    //get allergens
    getAllAllergens: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.allergens.findMany({
            orderBy: { id: "asc" },
        });
    }),

    //get top 18 ingredients
    getTopIngredients: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.ingredient.findMany({
            where: {
                id: {
                    lte: 18,
                }
            }
        })
    }),




    // getRecipes: publicProcedure.query(async ({ ctx }) => {
//     return ctx.db.recipe.findMany({
//       include: {
//         ingredients: true,
//         dietType: true,
//         allergens: true,
//         RecipeIngredient: true,
//       },
//       orderBy: { title: "asc" },
//     });
//   }),
//   getRecipeById: publicProcedure
//     .input(z.object({ id: z.number() }))
//     .query(async ({ ctx, input }) => {
//       return ctx.db.recipe.findUnique({
//         where: { id: input.id },
//         include: {
//           ingredients: true,
//           dietType: true,
//           allergens: true,
//           RecipeIngredient: true,
//         },
//       });
//     }),

    





//   hello: publicProcedure
//     .input(z.object({ text: z.string() }))
//     .query(({ input }) => {
//       return {
//         greeting: `Hello ${input.text}`,
//       };
//     }),

//   create: protectedProcedure
//     .input(z.object({ name: z.string().min(1) }))
//     .mutation(async ({ ctx, input }) => {
//       return ctx.db.post.create({
//         data: {
//           name: input.name,
//           createdBy: { connect: { id: ctx.session.user.id } },
//         },
//       });
//     }),

//   getLatest: protectedProcedure.query(async ({ ctx }) => {
//     const post = await ctx.db.post.findFirst({
//       orderBy: { createdAt: "desc" },
//       where: { createdBy: { id: ctx.session.user.id } },
//     });

//     return post ?? null;
//   }),

//   getSecretMessage: protectedProcedure.query(() => {
//     return "you can now see this secret message!";
//   }),
});