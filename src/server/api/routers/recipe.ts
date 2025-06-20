import { Prisma } from "@prisma/client";
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

// Helper function to safely handle empty arrays for Prisma.join
const safeJoin = (arr: unknown[] | undefined | null) => {
  return Prisma.join(arr && arr.length > 0 ? arr : [-1]);
};

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

    // NEW: Procedure for LOGGED-IN users
  getPersonalizedTopIngredients: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const ingredientsLimit = 18;

    // 1. Fetch the user's top ingredients, ordered by their usage counter
    const userTopIngredients = await ctx.db.userIngredients.findMany({
      where: {
        userId: userId,
        ingredientId: {
          notIn: [155, 157]  //Do not retrieve Water and Salt (assume user has it)
        }
      },
      orderBy: { counter: 'desc' },
      select: {
        ingredient: { // Select the related ingredient details
          select: {
            id: true,
            name: true,
          }
        }
      },
    });
    // Flatten the result to match the Ingredient type
    const personalizedList = userTopIngredients.map(ui => ui.ingredient);

    // 2. Fetch globally popular ingredients to fill the rest of the list
    const globallyPopularIngredients = await ctx.db.recipeIngredients.groupBy({
      by: ['ingredientId'],
      _count: {
        ingredientId: true,
      },
      orderBy: {
        _count: {
          ingredientId: 'desc',
        },
      },
      where: {
        ingredientId: {
          notIn: [155, 157]  //Do not retrieve Water and Salt (assume user has it)
        }
      },
      // Fetch a bit more than we need to account for overlap with user's list
      take: ingredientsLimit + personalizedList.length, 
    });

    // 3. Get the details for the globally popular ingredients
    const popularIngredientIds = globallyPopularIngredients.map(item => item.ingredientId);
    const popularIngredientDetails = await ctx.db.ingredient.findMany({
        where: { id: { in: popularIngredientIds } },
    });
    
    // Create a map for quick lookups to preserve the popularity order
    const popularDetailsMap = new Map(popularIngredientDetails.map(ing => [ing.id, ing]));
    const globalList = popularIngredientIds.map(id => popularDetailsMap.get(id)).filter(Boolean);

    // 4. Combine the lists, ensuring uniqueness and preserving order
    const combinedList = [...personalizedList];
    const userIngredientIds = new Set(personalizedList.map(i => i.id));

    for (const ingredient of globalList) {
        if (combinedList.length >= ingredientsLimit) break;
        if (ingredient?.id !== undefined && !userIngredientIds.has(ingredient.id)) {
            combinedList.push(ingredient);
        }
    }

    return combinedList;
  }),

  // REFACTORED: Procedure for ANONYMOUS users, now with input
getAnonymousTopIngredients: publicProcedure
  .input(
    z.object({
      // An object with ingredient IDs as keys (string) and counts as values (number)
      counts: z.record(z.number()), 
    })
  )
  .query(async ({ ctx, input }) => {
    const ingredientsLimit = 18;

    // 1. Construct the user's "personal" list from the localStorage counts
    const sortedLocalIds = Object.keys(input.counts)
      .map(Number)
      .sort((a, b) => (input.counts[b] ?? 0) - (input.counts[a] ?? 0));
    
    // Fetch details for these local top ingredients
    const localTopIngredientDetails = await ctx.db.ingredient.findMany({
      where: { id: { in: sortedLocalIds } },
      select: {id: true, name: true}
    });
    // Create a map to re-apply the correct order
    const localDetailsMap = new Map(localTopIngredientDetails.map(ing => [ing.id, ing]));
    const localTopIngredients = sortedLocalIds
      .map(id => localDetailsMap.get(id))
      .filter((item): item is {id: number; name: string} => !!item);


    // 2. Fetch globally popular ingredients (same logic as personalized query)
    const globallyPopularIngredients = await ctx.db.recipeIngredients.groupBy({
      by: ['ingredientId'],
      _count: { ingredientId: true },
      orderBy: { _count: { ingredientId: 'desc' } },
      where: { ingredientId: { notIn: [155, 157] } }, // Exclude Water/Salt
      take: ingredientsLimit + localTopIngredients.length,
    });
    
    const popularIngredientIds = globallyPopularIngredients.map(item => item.ingredientId);
    const popularIngredientDetails = await ctx.db.ingredient.findMany({
      where: { id: { in: popularIngredientIds } },
      select: {id: true, name: true}
    });
    const popularDetailsMap = new Map(popularIngredientDetails.map(ing => [ing.id, ing]));
    const globalList = popularIngredientIds
        .map(id => popularDetailsMap.get(id))
        .filter((item): item is {id: number; name: string} => !!item);


    // 3. Combine the lists (identical logic to personalized query)
    const combinedList = [...localTopIngredients];
    const localIngredientIds = new Set(localTopIngredients.map(i => i.id));

    for (const ingredient of globalList) {
      if (combinedList.length >= ingredientsLimit) break;
      if (!localIngredientIds.has(ingredient.id)) {
        combinedList.push(ingredient);
      }
    }

    return combinedList;
  }),

  // // NEW: Procedure for ANONYMOUS users
  // getAnonymousTopIngredients: publicProcedure.query(async ({ ctx }) => {
  //   const ingredientsLimit = 18;

  //   // 1. Find the most frequent ingredientId's in the join table
  //   const topIngredients = await ctx.db.recipeIngredients.groupBy({
  //     by: ['ingredientId'],
  //     _count: {
  //       ingredientId: true,
  //     },
  //     orderBy: {
  //       _count: {
  //         ingredientId: 'desc',
  //       },
  //     },
  //     where: {
  //       ingredientId: {
  //         notIn: [155, 157]  //Do not retrieve Water and Salt (assume user has it)
  //       }
  //     },
  //     take: ingredientsLimit,
  //   });

  //   // 2. Get the full details for those ingredient IDs
  //   const ingredientIds = topIngredients.map((item) => item.ingredientId);
  //   const ingredients = await ctx.db.ingredient.findMany({
  //     where: {
  //       id: {
  //         in: ingredientIds,
  //       },
  //     },
  //     select: {
  //       name: true,
  //       id: true
  //     }
  //   });
    
  //   // 3. Order the final list according to popularity
  //   // Create a map for quick lookups
  //   const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]));
  //   // Map over the ordered IDs from the groupBy query
  //   const sortedIngredients = ingredientIds.map(id => ingredientMap.get(id)).filter(Boolean); // filter(Boolean) removes any potential nulls

  //   return sortedIngredients;
  // }),


  getRecipeFeed: publicProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.object({ id: z.number(), score: z.number() }).nullish(), // cursor for pagination
        // User Preferences (from DB or localStorage)
        dietTypeId: z.number().optional(),
        estimatedTime: z.number().optional(),
        highProtein: z.boolean().optional(),
        lowCalorie: z.boolean().optional(),
        excludedAllergenIds: z.array(z.number()).optional(),
        // User Taste Profile (from DB or localStorage)
        favouriteRecipeIds: z.array(z.number()).optional(),
        interestRecipeIds: z.record(z.number()).optional(), // { recipeId: count }
        ingredientIds: z.array(z.number()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 9;
      const { cursor } = input;
      
      const interestRecipeIds = Object.keys(input.interestRecipeIds ?? {}).map(Number);

      const recipes = await ctx.db.$queryRaw<
        { id: number; title: string; imageUrl: string; protein: number; calorie: number; relevance_score: number; }[]
      >(Prisma.sql`
        WITH UserTaste AS (
          SELECT
            ri."ingredientId",
            r.category,
            r.area
          FROM "Recipe" r
          LEFT JOIN "RecipeIngredients" ri ON r.id = ri."recipeId"
          WHERE r.id IN (${safeJoin(input.favouriteRecipeIds)})
            OR r.id IN (${safeJoin(interestRecipeIds)})
        ),
        RankedRecipes AS (
          SELECT
            r.id,
            r.title,
            r."imageUrl",
            r.protein,
            r.calorie,
            (
              CASE
                WHEN ${input.dietTypeId ? Prisma.sql`r."dietTypeId" = ${input.dietTypeId}` : Prisma.sql`1=1`}
                  AND ${input.estimatedTime ? Prisma.sql`r."estimatedTime" <= ${input.estimatedTime}` : Prisma.sql`1=1`}
                  AND ${input.highProtein ? Prisma.sql`r.protein >= 30` : Prisma.sql`1=1`}
                  AND ${input.lowCalorie ? Prisma.sql`r.calorie <= 500` : Prisma.sql`1=1`}
                  AND NOT EXISTS (
                    SELECT 1 FROM "RecipeAllergens" ra WHERE ra."recipeId" = r.id AND ra."allergenId" IN (${safeJoin(input.excludedAllergenIds)})
                  )
                THEN 1000
                ELSE 0
              END
              +
              (SELECT COUNT(*) FROM "RecipeIngredients" ri WHERE ri."recipeId" = r.id AND ri."ingredientId" IN (SELECT "ingredientId" FROM UserTaste)) * 15
              +
              (CASE WHEN r.category IN (SELECT category FROM UserTaste) THEN 10 ELSE 0 END)
              +
              (SELECT COUNT(*) FROM "RecipeIngredients" ri WHERE ri."recipeId" = r.id AND ri."ingredientId" IN (${safeJoin(input.ingredientIds)})) * 5
              +
              COALESCE((SELECT COUNT(*) FROM "UserRecipes" ur WHERE ur."recipeId" = r.id), 0) * 2
              +
              COALESCE((SELECT SUM(uri.counter) FROM "UserRecipeInterests" uri WHERE uri."recipeId" = r.id), 0) * 1
              +
              (RANDOM() * 5)
            ) as relevance_score
          FROM
            "Recipe" r
          WHERE
            r.id NOT IN (${safeJoin(input.favouriteRecipeIds)})
            AND r.id NOT IN (${safeJoin(interestRecipeIds)})
        )
        SELECT *
        FROM RankedRecipes
        WHERE relevance_score > 0
          AND (${cursor ? Prisma.sql`(relevance_score, id) < (${cursor.score}, ${cursor.id})` : Prisma.sql`1=1`})
        ORDER BY
          relevance_score DESC, id DESC
        LIMIT ${limit}
      `);

      let nextCursor: typeof cursor | undefined = undefined;
      if (recipes.length === limit) {
        const lastRecipe = recipes[recipes.length - 1]!;
        // Ensure score is an integer for the cursor
        nextCursor = { id: lastRecipe.id, score: Math.floor(lastRecipe.relevance_score) };
      }

      return {
        recipes,
        nextCursor,
      };
    }),
});