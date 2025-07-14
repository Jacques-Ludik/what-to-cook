// src/pages/recipe/[id].tsx
import { type GetServerSideProps, type NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { db } from '~/server/db';
import { type Recipe } from '@prisma/client';
import { useFavourites } from '~/hooks/useFavourites';
import { RecipeDetailLayout } from '~/components/recipeDetailLayout'; // Import the new layout
import { ShareButton } from '~/components/shareButton';
import { FiArrowLeft } from 'react-icons/fi';

// Define the shape of the data we expect, including relations
type RecipePageProps = {
    recipe: (Recipe & {
        ingredients: { ingredient: { name: string }, measure: string | null }[];
        allergens: { allergen: { name: string } }[];
        dietType: { name: string } | null;
        isFavourited?: boolean; // Optional, if you want to show if it's favourited
    }) | null;
};

const RecipePage: NextPage<RecipePageProps> = ({ recipe }) => {
    
    const { favouriteIds, toggleFavourite } = useFavourites();

    if (!recipe) {
        return <div>Recipe not found.</div>;
    }

    return (
        <>
            <Head>
                {/* Dynamic Title and Description - CRITICAL for SEO */}
                <title>{recipe.title} - What to Cook</title>
                <meta name="description" content={`Learn how to make ${recipe.title}. A delicious ${recipe.category} recipe ready in ${recipe.estimatedTime} minutes. Full ingredients and instructions.`} />
                {/* Add Open Graph tags for social media sharing */}
                <meta property="og:title" content={recipe.title} />
                <meta property="og:description" content={`Full recipe for ${recipe.title}.`} />
                <meta property="og:image" content={recipe.imageUrl ?? '/placeholder.png'} />
                <meta property="og:url" content={`https://www.whattocook.food/recipe/${recipe.id}`} />
<meta property="og:type" content="article.recipe" /> 
{/* Inside RecipePage's <Head> component */}
<script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": recipe.title,
        "image": [recipe.imageUrl],
        "author": {
            "@type": "Organization",
            "name": "What to Cook"
        },
        "datePublished": new Date(recipe.createdAt).toISOString(),
        "description": recipe.recipeDescription,
        "prepTime": `PT${recipe.prepTime}M`, // ISO 8601 duration format
        "cookTime": `PT${(recipe?.estimatedTime ?? 0) - (recipe?.prepTime ?? 0)}M`,
        "totalTime": `PT${recipe.estimatedTime}M`,
        "keywords": `${recipe.category}, ${recipe.area}`,
        "recipeYield": "4 servings", // You might need to add this to your DB
        "recipeCategory": recipe.category,
        "recipeCuisine": recipe.area,
        "nutrition": {
            "@type": "NutritionInformation",
            "calories": `${recipe.calorie} calories`,
            "proteinContent": `${recipe.protein} g`,
            "fatContent": `${recipe.fat} g`,
            "carbohydrateContent": `${recipe.carb} g`
        },
        "recipeIngredient": recipe.ingredients.map(ing => `${ing.measure} ${ing.ingredient.name}`),
        "recipeInstructions": recipe?.instructions?.split('\n').map((step, index) => ({
            "@type": "HowToStep",
            "text": step
        })),
    })}}
/>
            </Head>

           {/* Main container with background color */}
            <div className="min-h-screen bg-gray-50">
                {/* Page Header with Back Button */}
                <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-md shadow-sm">
                    <div className="container mx-auto flex items-center justify-between p-4">
                        <Link href="/" passHref>
                            <div className="flex items-center gap-2 rounded-lg p-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                                <FiArrowLeft />
                                Back to All Recipes
                            </div>
                        </Link>
                        <ShareButton
                            title={recipe.title}
                            text={`Check out this recipe for ${recipe.title}!`}
                            url={`https://www.yourwebsite.com/recipe/${recipe.id}`}
                        />
                    </div>
                </header>

                {/* Main content area */}
                <main className="container mx-auto max-w-4xl p-4 sm:p-8">
                    <RecipeDetailLayout 
                        recipe={{
                            ...recipe,
                            ingredients: recipe.ingredients.map(ing => ({
                                name: ing.ingredient.name,
                                measure: ing.measure,
                            })),
                            allergens: recipe.allergens.map(a => a.allergen.name),
                        }} 
                        favouriteProps={{
                            isFavourited: favouriteIds.has(recipe.id),
                            toggleFavourite: toggleFavourite as () => void
                        }} 
                    />
                </main>
            </div>
        </>
    );
};


// This function runs on the server for every request to this page
export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.id;
    
    if (typeof id !== 'string') {
        return { notFound: true }; // Return a 404 page if ID is missing
    }

    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) {
        return { notFound: true }; // Return 404 if ID is not a number
    }

    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        include: {
            // Fetch all the related data needed to display the page
            ingredients: { include: { ingredient: { select: { name: true } } } },
            allergens: { include: { allergen: { select: { name: true } } } },
            dietType: { select: { name: true } }
        }
    });

    if (!recipe) {
        return { notFound: true };
    }

    return {
        props: {
            recipe: JSON.parse(JSON.stringify(recipe)) as RecipePageProps['recipe'], // Serialize data to pass to the page
        },
    };
};

export default RecipePage;