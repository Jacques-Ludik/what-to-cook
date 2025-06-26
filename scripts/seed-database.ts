// scripts/seed-database.ts
import { PrismaClient } from '@prisma/client';
import { recipesToSeed } from '../recipes-data'; // Adjust the path to your data file
import chunk from 'lodash/chunk';

interface RecipeData {
    id: string;
    title: string;
    imageUrl: string;
    link: string;
    source: string;
    category: string;
    area: string;
    recipeDescription: string;
    dietType: number;
    prepTime: number;
    estimatedTime: number;
    allergens: number[];
    protein: number;
    fat: number;
    carb: number;
    calorie: number;
    ingredients: number[];
    measures: string[];
    instructions: string;
}

// Initialize Prisma Client
const db = new PrismaClient();

// The main logic for seeding
async function seed() {
    console.log('Seeding process started...');

    // Use a transaction for atomicity
    try {
        await db.$transaction(
          async (tx) => {
            console.log(`Preparing to insert ${recipesToSeed.length} recipes...`);

            // --- We will process in batches to be memory-efficient ---
            const batchSize = 100;
            const recipeChunks = chunk(recipesToSeed, batchSize);

            for (const [index, batch] of recipeChunks.entries()) {
                console.log(`Processing batch ${index + 1} of ${recipeChunks.length}...`);
                
                // STEP 1: Bulk-insert base recipes for this batch
                const recipeCreateData = batch.map((recipe: RecipeData) => ({
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
                  dietTypeId: recipe.dietType,
                }));
                
                await tx.recipe.createMany({ data: recipeCreateData, skipDuplicates: true });

                // STEP 2: Fetch the newly created recipes to get their DB IDs
                const createdRecipeTitles = batch.map((r: RecipeData) => r.title);
                const createdRecipes = await tx.recipe.findMany({
                    where: { title: { in: createdRecipeTitles } },
                    select: { id: true, title: true },
                });
                const recipeIdMap = new Map(createdRecipes.map(r => [r.title, r.id]));

                // STEP 3: Prepare and insert relational data for this batch
                const recipeIngredientsData: { recipeId: number; ingredientId: number; measure: string; }[] = [];
                const recipeAllergensData: { recipeId: number; allergenId: number; }[] = [];

                for (const recipe of batch) {
                    const recipeId = recipeIdMap.get(recipe.title);
                    if (!recipeId) continue;

                    recipe.ingredients.forEach((ingredientId: number, idx: number) => {
                        recipeIngredientsData.push({ recipeId, ingredientId, measure: recipe.measures[idx] ?? '' });
                    });
                    recipe.allergens.forEach((allergenId: number) => {
                        recipeAllergensData.push({ recipeId, allergenId });
                    });
                }
                
                if (recipeIngredientsData.length > 0) {
                    await tx.recipeIngredients.createMany({ data: recipeIngredientsData, skipDuplicates: true });
                }
                if (recipeAllergensData.length > 0) {
                    await tx.recipeAllergens.createMany({ data: recipeAllergensData, skipDuplicates: true });
                }
            }
          },
          {
            timeout: 300000, // 5 minute timeout for the whole transaction
          }
        );

        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ An error occurred during seeding:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

// Run the seed function
void seed();