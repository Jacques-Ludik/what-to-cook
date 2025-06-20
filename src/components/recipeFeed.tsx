// src/components/RecipeFeed.tsx
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
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

interface RecipeCardProps {
  recipe: { id: number; title: string; imageUrl: string | null; protein: number | null; calorie: number | null; };
}

function RecipeCard({ recipe }: RecipeCardProps) {
    // This would be your styled recipe card component
    return (
        <div className="border rounded-lg shadow-lg overflow-hidden">
            <Image
                src={recipe.imageUrl ?? '/placeholder.png'}
                alt={recipe.title}
                className="w-full h-48 object-cover"
                width={400}
                height={192}
                objectFit="cover"
                unoptimized={recipe.imageUrl == null}
            />
            {/* <Image src={recipe.imageUrl ?? } alt={recipe.title} className="w-full h-48 object-cover" height={48} width={60}/> */}
            <div className="p-4">
                <h3 className="font-bold text-lg truncate">{recipe.title}</h3>
                <div className="flex justify-between text-sm mt-2 text-gray-600">
                    <span>Protein: {recipe.protein ?? 'N/A'}g</span>
                    <span>Calories: {recipe.calorie ?? 'N/A'}</span>
                </div>
                {/* Add Favourite and OnClick handlers here */}
            </div>
        </div>
    )
}


export function RecipeFeed({ input }: { input: RecipeFeedInput }) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = api.recipe.getRecipeFeed.useInfiniteQuery(
    { ...input, limit: 9 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading recipes...</div>;
  if (!data) return <div>No recipes found.</div>;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.pages.map((page) =>
          page.recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
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