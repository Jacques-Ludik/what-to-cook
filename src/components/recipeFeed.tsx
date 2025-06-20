// src/components/RecipeFeed.tsx
import { useInView } from "react-intersection-observer";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/utils/api";
import Image from "next/image";

// Define the shape of the input for our query
interface RecipeFeedInput {
  dietTypeId?: number;
  estimatedTime?: number;
  highProtein?: boolean;
  lowCalorie?: boolean;
excludedAllergenIds?: number[];
interestRecipeIds?: Record<string, number>;
ingredientIds?: number[];
  favouriteRecipeIds?: number[];
}

// Define the shape of a single recipe for clarity
type Recipe = {
  id: number;
  title: string;
  imageUrl: string | null;
  protein: number | null;
  calorie: number | null;
};

interface RecipeCardProps {
  recipe: { id: number; title: string; imageUrl: string | null; protein: number | null; calorie: number | null; };
  onClick: () => void;
}

function RecipeCard({ recipe, onClick }: RecipeCardProps) {
    return (
        // Wrap the entire card in a button for better accessibility and semantics
        <button
            onClick={onClick}
            className="border rounded-lg shadow-lg overflow-hidden text-left transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
        >
            <div className="relative">
                <Image
                    src={recipe.imageUrl ?? '/placeholder.png'}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                    width={400}
                    height={192}
                />
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg truncate">{recipe.title}</h3>
                <div className="flex justify-between text-sm mt-2 text-gray-600">
                    <span>Protein: {recipe.protein ?? 'N/A'}g</span>
                    <span>Calories: {recipe.calorie ?? 'N/A'}</span>
                </div>
            </div>
        </button>
    )
}
// function RecipeCard({ recipe, onClick }: RecipeCardProps) {
//     // This would be your styled recipe card component
//     return (
//         <div className="border rounded-lg shadow-lg overflow-hidden">
//             <Image
//                 src={recipe.imageUrl ?? '/placeholder.png'}
//                 alt={recipe.title}
//                 className="w-full h-48 object-cover"
//                 width={400}
//                 height={192}
//                 objectFit="cover"
//             />
//             {/* <Image src={recipe.imageUrl ?? } alt={recipe.title} className="w-full h-48 object-cover" height={48} width={60}/> */}
//             <div className="p-4">
//                 <h3 className="font-bold text-lg truncate">{recipe.title}</h3>
//                 <div className="flex justify-between text-sm mt-2 text-gray-600">
//                     <span>Protein: {recipe.protein ?? 'N/A'}g</span>
//                     <span>Calories: {recipe.calorie ?? 'N/A'}</span>
//                 </div>
//                 {/* Add Favourite and OnClick handlers here */}
//             </div>
//         </div>
//     )
// }


export function RecipeFeed({ input, onRecipeClick }: { input: RecipeFeedInput; onRecipeClick: (recipeId: number) => void; }) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    //refetch
  } = api.recipe.getRecipeFeed.useInfiniteQuery(
    {
      ...input,
      limit: 9,},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      // === THE FIX ===
      // Tell React Query to consider the data fresh for 5 minutes.
      // It will not refetch on window focus or re-mount during this time.
      staleTime: 1000 * 60 * 60, // 1 hour in milliseconds
    },
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render logic remains largely the same, but it renders from `allRecipes`
  if (isLoading) return <div className="text-center p-4">Loading recipes...</div>;
  if (isError) return <div className="text-center p-4 text-red-500">Failed to load recipes.</div>;
  // We use `data` here to check if the first fetch returned nothing
  // if (!isLoading && !data?.pages.flatMap(p => p.recipes).length) {
  if (!isLoading && !data?.pages.flatMap(p => p.recipes).length) {
    return <div className="text-center p-4">No recipes found for your criteria.</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.pages.map((page) =>
          page.recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onRecipeClick(recipe.id)} />
          ))
        )}
      </div>

      {/* This invisible element will trigger fetching the next page */}
      <div ref={ref} className="h-10" />

      {isFetchingNextPage && <div className="text-center p-4">Loading more...</div>}
      {!hasNextPage && !isLoading && <div className="text-center p-4 text-gray-500">You've reached the end!</div>}
    </div>
  );
}