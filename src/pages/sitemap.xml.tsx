// src/pages/sitemap.xml.tsx
import { type GetServerSideProps } from 'next';
import { db } from '~/server/db';

const generateSitemap = (recipes: { id: number }[]) => {
  const baseUrl = 'https://www.whattocook.food'; // Replace with your actual base URL
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${baseUrl}</loc>
     </url>
     ${recipes
       .map(({ id }) => {
         return `
           <url>
               <loc>${`${baseUrl}/?recipe=${id}`}</loc>
           </url>
         `;
       })
       .join('')}
   </urlset>
 `;
};

//<loc>${`${baseUrl}/recipe/${id}`}</loc>

const Sitemap = () => {
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const recipes = await db.recipe.findMany({
    select: { id: true },
  });

  const sitemap = generateSitemap(recipes);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default Sitemap;