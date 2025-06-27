// scripts/extract-titles.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- Import the necessary function

// === THE FIX IS HERE ===
// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now the rest of your code works perfectly
const outputFile = path.join(__dirname, 'recipes-to-find-images-for.json');

const prisma = new PrismaClient();

async function extractTitles() {
  console.log('Connecting to database to fetch recipe titles...');

  try {
    const recipes = await prisma.recipe.findMany({
      where: {
        id: {
          gte: 745,
        },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    await fs.writeFile(outputFile, JSON.stringify(recipes, null, 2));
    console.log(`✅ Successfully extracted ${recipes.length} recipes to ${outputFile}`);
  } catch (error) {
    console.error('❌ Failed to extract titles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void extractTitles();






// // scripts/extract-titles.ts
// import { PrismaClient } from '@prisma/client';
// import * as fs from 'fs/promises';
// import path from 'path';

// const prisma = new PrismaClient();
// const outputFile = path.join(__dirname, 'recipes-to-find-images-for.json');

// async function extractTitles() {
//   console.log('Connecting to database to fetch recipe titles...');

//   try {
//     const recipes = await prisma.recipe.findMany({
//       where: {
//         id: {
//           gte: 745, // Starting from recipe ID 745 as requested
//         },
//       },
//       select: {
//         id: true,
//         title: true,
//       },
//       orderBy: {
//         id: 'asc',
//       },
//     });

//     await fs.writeFile(outputFile, JSON.stringify(recipes, null, 2));
//     console.log(`✅ Successfully extracted ${recipes.length} recipes to ${outputFile}`);
//   } catch (error) {
//     console.error('❌ Failed to extract titles:', error);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// void extractTitles();