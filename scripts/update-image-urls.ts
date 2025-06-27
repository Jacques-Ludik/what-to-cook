// scripts/update-image-urls.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import path from 'path';

// For ESM compatibility
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === THE FIX: Define the correct type for our data ===
type ImageUrlMap = Record<string, {
    id: number;
    image_url: string;
}>;

const prisma = new PrismaClient();
const inputFile = path.join(__dirname, 'new-firebase-urls-final.json');

async function updateUrls() {
  console.log('Reading new image URLs...');
  
  try {
    const data = await fs.readFile(inputFile, 'utf-8');
    // Use our new, correct type
    const newImageUrls = JSON.parse(data) as ImageUrlMap;

    console.log(`Found ${Object.keys(newImageUrls).length} URLs to update. Starting database update...`);

    let updatedCount = 0;
    // The loop logic now needs to access the nested property
    for (const recipeIdStr in newImageUrls) {
      const recipeId = parseInt(recipeIdStr, 10);
      const urlData = newImageUrls[recipeIdStr]; // This is now the { id, image_url } object
      
      // === THE FIX: Access the nested `image_url` property ===
      const newUrl = urlData?.image_url;

      if (newUrl) {
        await prisma.recipe.update({
          where: { id: recipeId },
          data: { imageUrl: newUrl }, // Now `newUrl` is correctly a string
        });
        updatedCount++;
        if (updatedCount % 50 === 0) {
            console.log(`Updated ${updatedCount} records...`);
        }
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} recipe image URLs in the database.`);

  } catch (error) {
    console.error('❌ An error occurred during the database update:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void updateUrls();




// // scripts/update-image-urls.ts
// import { PrismaClient } from '@prisma/client';
// import * as fs from 'fs/promises';
// import path from 'path';

// const prisma = new PrismaClient();
// const inputFile = path.join(__dirname, 'new-firebase-urls-final.json');

// async function updateUrls() {
//   console.log('Reading new image URLs...');
  
//   try {
//     const data = await fs.readFile(inputFile, 'utf-8');
//     const newImageUrls: Record<string, string> = JSON.parse(data);

//     console.log(`Found ${Object.keys(newImageUrls).length} URLs to update. Starting database update...`);

//     let updatedCount = 0;
//     for (const recipeIdStr in newImageUrls) {
//       const recipeId = parseInt(recipeIdStr, 10);
//       const newUrl = newImageUrls[recipeIdStr];

//       if (newUrl) {
//         await prisma.recipe.update({
//           where: { id: recipeId },
//           data: { imageUrl: newUrl },
//         });
//         updatedCount++;
//         if (updatedCount % 50 === 0) {
//             console.log(`Updated ${updatedCount} records...`);
//         }
//       }
//     }
    
//     console.log(`✅ Successfully updated ${updatedCount} recipe image URLs in the database.`);

//   } catch (error) {
//     console.error('❌ An error occurred during the database update:', error);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// void updateUrls();