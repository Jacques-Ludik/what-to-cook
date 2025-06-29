// scripts/seed-ingredient-groups.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import path from 'path';

// For ESM compatibility
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const inputFile = path.join(__dirname, 'ingredient-group.json');

// Define a type for our JSON data for better type safety
type IngredientGroupData = Record<string, { id: number; name: string }[]>;

async function seedGroups() {
  console.log('Starting to seed ingredient groups...');

  try {
    // 1. Read and parse the JSON file
    const data = await fs.readFile(inputFile, 'utf-8');
    const ingredientGroups = JSON.parse(data) as IngredientGroupData;
    console.log(`Found ${Object.keys(ingredientGroups).length} groups to process.`);

    let totalIngredientsUpdated = 0;

    // 2. Loop through each group in the JSON file
    for (const groupName in ingredientGroups) {
      if (Object.prototype.hasOwnProperty.call(ingredientGroups, groupName)) {
        console.log(`\nProcessing group: "${groupName}"`);

        const ingredientsInGroup = ingredientGroups[groupName];
        if (!ingredientsInGroup || ingredientsInGroup.length === 0) {
          console.log(`  -> Skipping group "${groupName}" as it has no ingredients.`);
          continue;
        }

        // 3. Use `upsert` to create or find the group. This is idempotent.
        const group = await prisma.ingredientGroup.upsert({
          where: { name: groupName },
          update: {}, // Nothing to update if it exists
          create: { name: groupName },
        });
        console.log(`  -> Group "${group.name}" has ID: ${group.id}`);

        // 4. Collect all ingredient IDs that belong to this group
        const ingredientIds = ingredientsInGroup.map(ing => ing.id);

        // 5. Perform a single, efficient `updateMany` for all ingredients in this group
        const updateResult = await prisma.ingredient.updateMany({
          where: {
            id: {
              in: ingredientIds,
            },
          },
          data: {
            ingredientGroupId: group.id,
          },
        });

        console.log(`  -> Linked ${updateResult.count} ingredients to this group.`);
        totalIngredientsUpdated += updateResult.count;
      }
    }

    console.log(`\n✅ Seeding complete! Total ingredients updated: ${totalIngredientsUpdated}`);

  } catch (error) {
    console.error('❌ An error occurred during group seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void seedGroups();