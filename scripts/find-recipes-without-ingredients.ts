// scripts/find-recipes-without-ingredients.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import path from 'path';

// For ESM compatibility
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const outputFile = path.join(__dirname, 'recipes-missing-ingredients.json');

async function findRecipes() {
  console.log('Searching for recipes with no ingredients...');

  try {
    // This is the core Prisma query.
    const recipesWithoutIngredients = await prisma.recipe.findMany({
      where: {
        // The 'ingredients' relation is the one defined in your Prisma schema.
        // The `none: {}` filter finds all records where the related table
        // has no entries linked to the parent record.
        ingredients: {
          none: {},
        },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        id: 'asc', // Optional: order the results by ID
      },
    });

    if (recipesWithoutIngredients.length === 0) {
      console.log('✅ No recipes found without ingredients. Your data is clean!');
    } else {
      // Save the results to a JSON file for review.
      await fs.writeFile(outputFile, JSON.stringify(recipesWithoutIngredients, null, 2));
      console.log(`✅ Found ${recipesWithoutIngredients.length} recipes without ingredients.`);
      console.log(`Results have been saved to: ${outputFile}`);
    }

  } catch (error) {
    console.error('❌ An error occurred while searching for recipes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void findRecipes();