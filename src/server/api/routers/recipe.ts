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
  adminProcedure
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
  source: z.string(),
  category: z.string(),
  area: z.string(),
  recipeDescription: z.string(),
  // IMPORTANT: We accept the dietType as a string, just like in the JSON
  dietType: z.number(), 
  prepTime: z.number(),
  estimatedTime: z.number(),
  allergens: z.number().array(),
  protein: z.number(),
  fat: z.number(),
  carb: z.number(),
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
              source: recipe.source,
              category: recipe.category,
              area: recipe.area,
              recipeDescription: recipe.recipeDescription,
              instructions: recipe.instructions,
              prepTime: recipe.prepTime,
              estimatedTime: recipe.estimatedTime,
              protein: recipe.protein,
              fat: recipe.fat,
              carb: recipe.carb,
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
        seed: z.number(),
        //excludedRecipeIds: z.array(z.number()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
            const limit = input.limit ?? 9;
            const { cursor, seed } = input;
            
            const interestRecipeIds = Object.keys(input.interestRecipeIds ?? {}).map(Number);
            // const allPreviouslySeenIds = [ // Consolidate all known recipe IDs
            //     ...(input.favouriteRecipeIds ?? []),
            //     ...interestRecipeIds,
            // ];

            // Merge all IDs that should be excluded into one list
      const allExcludedIds = [
          ...(input.favouriteRecipeIds ?? []),
          ...interestRecipeIds,
         // ...(input.excludedRecipeIds ?? []), // <-- Add previously fetched IDs
      ];

            // We use a transaction to ensure setseed() is scoped to this query
      const recipes = await ctx.db.$transaction(async (tx) => {
        // Set the seed for the random number generator for this transaction
        await tx.$executeRaw`SELECT setseed(${seed})`;

        return tx.$queryRaw<
            // const recipes = await ctx.db.$queryRaw<
                { id: number; title: string; imageUrl: string; protein: number; calorie: number; relevance_score: number; }[]
            >(Prisma.sql`
                WITH UserTaste AS (
                    -- This CTE is unchanged
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
                            -- SCORE COMPONENT 1: STRICT PREFERENCE MATCHING
                            CASE WHEN
                                ${input.estimatedTime ? Prisma.sql`r."estimatedTime" <= ${input.estimatedTime}` : Prisma.sql`1=1`}
                            THEN 200 ELSE 0 END -- Lowered base score, as diet is now separat
                            +
                            CASE WHEN
                                ${input.highProtein ? Prisma.sql`r.protein >= 80` : Prisma.sql`1=1`} -- Adjusted threshold
                            THEN 300 ELSE 0 END -- Lowered base score, as diet is now separat
                            +
                            CASE WHEN
                                ${input.lowCalorie ? Prisma.sql`r.calorie <= 700` : Prisma.sql`1=1`} -- Adjusted threshold
                            THEN 200 ELSE 0 END -- Lowered base score, as diet is now separat
                            +
                            -- IMPROVEMENT 2: HEAVY DIET TYPE WEIGHTING (if not 'None')
                            CASE WHEN 
                                ${input.dietTypeId && input.dietTypeId !== 1 ? Prisma.sql`r."dietTypeId" = ${input.dietTypeId}` : Prisma.sql`1=0`}
                            THEN 1200 ELSE 0 END
                            +
                            -- SCORE COMPONENT 2: TASTE PROFILE SIMILARITY
                            (SELECT COUNT(*) FROM "RecipeIngredients" ri WHERE ri."recipeId" = r.id AND ri."ingredientId" IN (SELECT "ingredientId" FROM UserTaste)) * 15
                            +
                            (CASE WHEN r.category IN (SELECT category FROM UserTaste) THEN 10 ELSE 0 END)
                            +
                            -- SCORE COMPONENT 3: SELECTED INGREDIENTS MATCH
                            (SELECT COUNT(*) FROM "RecipeIngredients" ri WHERE ri."recipeId" = r.id AND ri."ingredientId" IN (${safeJoin(input.ingredientIds)})) * 50
                            +
                            -- SCORE COMPONENT 4: GLOBAL POPULARITY
                            COALESCE((SELECT COUNT(*) FROM "UserRecipes" ur WHERE ur."recipeId" = r.id), 0) * 2
                            +
                            (COALESCE((SELECT SUM(uri.counter) FROM "UserRecipeInterests" uri WHERE uri."recipeId" = r.id), 0) * 1)
                            +
                            -- SCORE COMPONENT 5: RANDOMNESS
                            (RANDOM() * 6)
                        ) as relevance_score
                    FROM "Recipe" r
                    WHERE
                        -- IMPROVEMENT 1: STRICT ALLERGEN EXCLUSION
                        -- This filters out recipes completely before they are even scored.
                        NOT EXISTS (
                            SELECT 1 FROM "RecipeAllergens" ra 
                            WHERE ra."recipeId" = r.id AND ra."allergenId" IN (${safeJoin(input.excludedAllergenIds)})
                        )
                        -- IMPROVEMENT: Strict Diet Type Filter
                        AND (${input.dietTypeId && input.dietTypeId !== 1 ? Prisma.sql`r."dietTypeId" = ${input.dietTypeId}` : Prisma.sql`1=1`})
                        -- Exclude recipes the user has already favourited or shown interest in
                        AND r.id NOT IN (${safeJoin(allExcludedIds)})
                )
                SELECT *
                FROM RankedRecipes
                WHERE relevance_score > 0
                AND (${cursor ? Prisma.sql`(relevance_score, id) < (${cursor.score}, ${cursor.id})` : Prisma.sql`1=1`})
                ORDER BY
                    relevance_score DESC, id DESC
                LIMIT ${limit}
            `);
      });

            // ... (nextCursor logic remains the same)
            let nextCursor: typeof cursor | undefined = undefined;
            if (recipes.length === limit) {
                const lastRecipe = recipes[recipes.length - 1]!;
                nextCursor = { id: lastRecipe.id, score: lastRecipe.relevance_score };
            }

            return {
                recipes,
                nextCursor,
            };
        }),
    // .query(async ({ ctx, input }) => {
    //   const limit = input.limit ?? 9;
    //   const { cursor } = input;
      
    //   const interestRecipeIds = Object.keys(input.interestRecipeIds ?? {}).map(Number);

    //   const recipes = await ctx.db.$queryRaw<
    //     { id: number; title: string; imageUrl: string; protein: number; calorie: number; relevance_score: number; }[]
    //   >(Prisma.sql`
    //     WITH UserTaste AS (
    //       SELECT
    //         ri."ingredientId",
    //         r.category,
    //         r.area
    //       FROM "Recipe" r
    //       LEFT JOIN "RecipeIngredients" ri ON r.id = ri."recipeId"
    //       WHERE r.id IN (${safeJoin(input.favouriteRecipeIds)})
    //         OR r.id IN (${safeJoin(interestRecipeIds)})
    //     ),
    //     RankedRecipes AS (
    //       SELECT
    //         r.id,
    //         r.title,
    //         r."imageUrl",
    //         r.protein,
    //         r.calorie,
    //         (
    //           CASE
    //             WHEN ${input.dietTypeId ? Prisma.sql`r."dietTypeId" = ${input.dietTypeId}` : Prisma.sql`1=1`}
    //               AND ${input.estimatedTime ? Prisma.sql`r."estimatedTime" <= ${input.estimatedTime}` : Prisma.sql`1=1`}
    //               AND ${input.highProtein ? Prisma.sql`r.protein >= 100` : Prisma.sql`1=1`}
    //               AND ${input.lowCalorie ? Prisma.sql`r.calorie <= 600` : Prisma.sql`1=1`}
    //               AND NOT EXISTS (
    //                 SELECT 1 FROM "RecipeAllergens" ra WHERE ra."recipeId" = r.id AND ra."allergenId" IN (${safeJoin(input.excludedAllergenIds)})
    //               )
    //             THEN 1000
    //             ELSE 0
    //           END
    //           +
    //           (SELECT COUNT(*) FROM "RecipeIngredients" ri WHERE ri."recipeId" = r.id AND ri."ingredientId" IN (SELECT "ingredientId" FROM UserTaste)) * 15
    //           +
    //           (CASE WHEN r.category IN (SELECT category FROM UserTaste) THEN 10 ELSE 0 END)
    //           +
    //           (SELECT COUNT(*) FROM "RecipeIngredients" ri WHERE ri."recipeId" = r.id AND ri."ingredientId" IN (${safeJoin(input.ingredientIds)})) * 5
    //           +
    //           COALESCE((SELECT COUNT(*) FROM "UserRecipes" ur WHERE ur."recipeId" = r.id), 0) * 2
    //           +
    //           COALESCE((SELECT SUM(uri.counter) FROM "UserRecipeInterests" uri WHERE uri."recipeId" = r.id), 0) * 1
    //          +
    //          (RANDOM() * 5)
    //         ) as relevance_score
    //       FROM
    //         "Recipe" r
    //       WHERE
    //       r.id NOT IN (${safeJoin(input.favouriteRecipeIds)})
    //         OR r.id NOT IN (${safeJoin(interestRecipeIds)})
    //     )
    //     SELECT *
    //     FROM RankedRecipes
    //     WHERE relevance_score > 0
    //       AND (${cursor ? Prisma.sql`(relevance_score, id) < (${cursor.score}, ${cursor.id})` : Prisma.sql`1=1`})
    //     ORDER BY
    //       relevance_score DESC, id DESC
    //     LIMIT ${limit}
    //   `);

    //   let nextCursor: typeof cursor | undefined = undefined;
    //   if (recipes.length === limit) {
    //     const lastRecipe = recipes[recipes.length - 1]!;
    //     // Ensure score is an integer for the cursor
    //     nextCursor = { id: lastRecipe.id, score: Math.floor(lastRecipe.relevance_score) };
    //   }

    //   return {
    //     recipes,
    //     nextCursor,
    //   };
    // }),


    // NEW: Procedure for combined search
    searchRecipesAndIngredients: publicProcedure
        .input(z.object({
            term: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const { term } = input;
            const limit = 4; // Fetch 4 of each to get up to 8 total

            // If the search term is empty, return nothing
            if (!term.trim()) {
                return [];
            }
            
            // We use Prisma.PromisePool to run these two queries in parallel
            const [recipes, ingredients] = await Promise.all([
                // Query 1: Search Recipes
                ctx.db.recipe.findMany({
                    where: {
                        title: {
                            contains: term,
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                    take: limit,
                    select: {
                        id: true,
                        title: true,
                    },
                }),
                // Query 2: Search Ingredients
                ctx.db.ingredient.findMany({
                    where: {
                        name: {
                            contains: term,
                            mode: 'insensitive',
                        },
                    },
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                    },
                }),
            ]);

            // Combine and format the results
            const formattedRecipes = recipes.map(r => ({
                id: `recipe-${r.id}`,
                name: r.title,
                type: 'Recipe' as const, // Use 'as const' for strong typing
            }));

            const formattedIngredients = ingredients.map(i => ({
                id: `ingredient-${i.id}`,
                name: i.name,
                type: 'Ingredient' as const,
            }));

            // In a real system, you might rank these more intelligently.
            // For now, we'll just interleave them.
            const combinedResults = [...formattedRecipes, ...formattedIngredients];

            // You could add more sophisticated ranking here if needed
            // For example, prioritize exact matches, etc.

            return combinedResults.slice(0, 8); // Ensure we don't exceed 8 total results
        }),


        // NEW: Get full details for a single recipe
    getRecipeDetails: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const recipe = await ctx.db.recipe.findUnique({
                where: { id: input.id },
                include: {
                    // Include the related data we want to show
                    ingredients: {
                        include: {
                            ingredient: { // Get the ingredient name
                                select: { name: true },
                            },
                        },
                    },
                    allergens: {
                        include: {
                            allergen: { // Get the allergen name
                                select: { name: true },
                            },
                        },
                    },
                },
            });

            if (!recipe) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipe not found' });
            }
            
            // Format the data cleanly for the frontend
            return {
                ...recipe,
                ingredients: recipe.ingredients.map(i => ({
                    name: i.ingredient.name,
                    measure: i.measure,
                })),
                allergens: recipe.allergens.map(a => a.allergen.name),
            };
        }),


        // NEW: Get a list of recipes by their IDs
    getRecipesByIds: publicProcedure
        .input(z.object({
            ids: z.array(z.number()),
        }))
        .query(async ({ ctx, input }) => {
            if (input.ids.length === 0) {
                return []; // Return empty if no IDs are provided
            }

            const recipes = await ctx.db.recipe.findMany({
                where: {
                    id: {
                        in: input.ids,
                    },
                },
                select: { // Select only the data needed for the list view
                    id: true,
                    title: true,
                    imageUrl: true,
                },
            });

            // Preserve the order of the original IDs if needed (optional but good practice)
            const recipeMap = new Map(recipes.map(r => [r.id, r]));
            const orderedRecipes = input.ids.map(id => recipeMap.get(id)).filter(Boolean);
            
            return orderedRecipes;
        }),



        //----------------------------For the Maintanence page-------------------------------
        // QUERY: Get a single recipe with all data needed for editing
    getFullRecipeForEdit: adminProcedure // Or protectedProcedure if it's admin-only
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const recipe = await ctx.db.recipe.findUnique({
                where: { id: input.id },
                include: {
                    ingredients: {
                        select: {
                            ingredientId: true,
                            measure: true,
                            ingredient: {
                                select: { name: true }
                            }
                        }
                    },
                    allergens: {
                        select: { allergenId: true }
                    }
                }
            });

            if (!recipe) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" });
            }
            return recipe;
        }),

    // MUTATION: Update a recipe with new data
    updateRecipe: adminProcedure // Or protectedProcedure
        .input(z.object({
            id: z.number(),
            title: z.string(),
            // imageUrl: z.string().optional(),
            // link: z.string().optional(),
            // category: z.string().optional(),
            // area: z.string().optional(),
            dietTypeId: z.number().optional(),
            instructions: z.string().optional(),
            estimatedTime: z.number().optional(),
            protein: z.number().optional(),
            calorie: z.number().optional(),
            // We'll handle ingredients and allergens specially
            ingredients: z.array(z.object({ ingredientId: z.number(), measure: z.string() })),
            allergenIds: z.array(z.number()),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ingredients, allergenIds, ...recipeData } = input;

            return ctx.db.$transaction(async (tx) => {
                // 1. Update the simple fields on the Recipe model
                await tx.recipe.update({
                    where: { id },
                    data: recipeData,
                });

                // 2. Update Ingredients (delete all existing and recreate)
                await tx.recipeIngredients.deleteMany({ where: { recipeId: id } });
                await tx.recipeIngredients.createMany({
                    data: ingredients.map(ing => ({
                        recipeId: id,
                        ingredientId: ing.ingredientId,
                        measure: ing.measure,
                    })),
                });

                // 3. Update Allergens (delete all existing and recreate)
                await tx.recipeAllergens.deleteMany({ where: { recipeId: id } });
                await tx.recipeAllergens.createMany({
                    data: allergenIds.map(allergenId => ({
                        recipeId: id,
                        allergenId,
                    })),
                });
                
                return { success: true };
            });
        }),
    
    // MUTATION: Delete a recipe
    deleteRecipe: adminProcedure // Or protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            // The `onDelete: Cascade` in your schema should handle deleting
            // all related RecipeIngredients, RecipeAllergens, etc. automatically.
            await ctx.db.recipe.delete({
                where: { id: input.id },
            });
            return { success: true };
        }),

      // MUTATION: create ingredient
      createNewIngredient: adminProcedure
        .input(z.object({ name: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.ingredient.create({
              data: {
                name: input.name,
              }
            })
        }),



        //update image url
        updateImageUrl: adminProcedure.input(z.object({ id: z.number(), url: z.string()})).mutation(async ({ ctx, input }) => {
          return ctx.db.recipe.update({
            where: {
              id: input.id
            },
            data: {
              imageUrl: input.url
            }
          })
        }),
});