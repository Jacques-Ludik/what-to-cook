// src/components/RecipeFeed.tsx
import { useInView } from "react-intersection-observer";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/utils/api";
import Image from "next/image";
import { useQueryClient } from '@tanstack/react-query';
import { RecipeFeedSkeleton } from "./recipeFeedSkeleton";
import Link from "next/link";

// Define the shape of the input for our query
interface RecipeFeedInput {
  dietTypeId?: number;
  estimatedTime?: number;
  highProtein?: boolean;
  lowCalorie?: boolean;
  strictSearch?: boolean;
excludedAllergenIds?: number[];
interestRecipeIds?: Record<string, number>;
ingredientIds?: number[];
  favouriteRecipeIds?: number[];
  seed: number;
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
        //<Link href={`/recipe/${recipe.id}`} passHref>
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
       // </Link>
    )
}



export function RecipeFeed({ input, onRecipeClick }: { input: RecipeFeedInput; onRecipeClick: (recipeId: number) => void; }) {
  const { ref, inView } = useInView();

  const queryClient = useQueryClient(); // Get the query client instance

    // We use a ref to track the last time we manually refetched on focus
    // to prevent refetching multiple times if the user focuses the window rapidly.
    const lastFocusTime = useRef(0);
    const staleTime = 1000 * 60 * 30; // 1/2 hour in milliseconds
    const queryInput = { ...input, limit: 9 };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    //refetch, // We need the refetch function from the hook
    isStale, // We can get the staleness state
  } = api.recipe.getRecipeFeed.useInfiniteQuery(
    queryInput,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: staleTime,
      // Give us manual control over refetching behavior
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      //refetchOnReconnect: false,
    },
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);


 // Effect for handling manual refetch on window focus
    useEffect(() => {
        const handleFocus = () => {
            if (isStale && Date.now() - lastFocusTime.current > 5000) {
                console.log("Window focused and data is stale. Resetting query.");
                lastFocusTime.current = Date.now();

                // === THE CORRECT FIX for older tRPC versions ===
                // Manually construct the query key array.
                // It's an array where the first element is the procedure path (as an array of strings),
                // and the second element is an object with the input and the query type.
                const queryKey = [
                    ['recipe', 'getRecipeFeed'], // The path to your tRPC procedure
                    {
                        input: queryInput,      // The exact same input object used in the hook
                        type: 'infinite',       // The type of query
                    },
                ];
                
                // Reset the query using the manually constructed key.
                void queryClient.resetQueries({ queryKey });
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [isStale, queryClient, queryInput]); // queryInput is now a stable dependency


  // Render logic remains largely the same, but it renders from `allRecipes`
  // If the query is in its very initial loading state, show the skeleton.
    if (isLoading) {
        return <RecipeFeedSkeleton />;
    }
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