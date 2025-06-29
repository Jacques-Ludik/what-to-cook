// scripts/get-all-ingredients.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- Import the necessary function

// === THE FIX IS HERE ===
// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now the rest of your code works perfectly
const outputFile = path.join(__dirname, 'ingredients.json');

const prisma = new PrismaClient();

async function extractIngredients() {
  console.log('Connecting to database to fetch ingredients...');

  try {
    const ingredients = await prisma.ingredient.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    await fs.writeFile(outputFile, JSON.stringify(ingredients, null, 2));
    console.log(`✅ Successfully extracted ${ingredients.length} ingredients to ${outputFile}`);
  } catch (error) {
    console.error('❌ Failed to extract ingredients:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void extractIngredients();