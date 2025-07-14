// src/components/RecipeDetailLayout.tsx
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { ShareButton } from './shareButton';
import { type RouterOutputs } from '~/utils/api'; // Helper for getting tRPC output types

// Define a type for the recipe data this component expects
type RecipeData = NonNullable<RouterOutputs['recipe']['getRecipeDetails']>;
type FavouriteProps = {
    isFavourited: boolean;
    toggleFavourite: (id: number) => void;
};

interface RecipeDetailLayoutProps {
    recipe: RecipeData;
    favouriteProps: FavouriteProps; // Pass favourite state and actions
}

export function RecipeDetailLayout({ recipe, favouriteProps }: RecipeDetailLayoutProps) {
    return (
        <>
            {/* Header with Title and Favourite Button */}
            <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{recipe.title}</h1>
                <button
    onClick={() => favouriteProps.toggleFavourite(recipe.id)}
    // Base classes for layout, focus, and transition
    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95
        ${favouriteProps.isFavourited
            // Classes for the "Favourited" state
            ? 'bg-red-100 text-red-600 hover:bg-red-200 focus-visible:ring-red-500'
            // Classes for the "Not Favourited" state
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus-visible:ring-gray-400'
        }
    `}
    aria-label={favouriteProps.isFavourited ? 'Remove from favourites' : 'Add to favourites'}
>
    {/* Clean Heart SVG */}
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor" // The fill will inherit the text color (text-red-600 or text-gray-600)
    >
        <path
            fillRule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clipRule="evenodd"
        />
    </svg>
    
    {/* Text Label */}
    <div className="flex items-center">
        {favouriteProps.isFavourited ? 'Favourited' : 'Favourite'}
    </div>
</button>
            </div>

            {/* Main Content Area */}
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
                {/* Left Column: Image and Details */}
                <div className="md:col-span-2">
                    <Image
                        src={recipe.imageUrl ?? '/placeholder.png'}
                        alt={recipe.title}
                        width={400} height={300}
                        className="w-full rounded-lg object-cover shadow-md"
                        priority // Add priority for Largest Contentful Paint (LCP) SEO boost
                    />
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p><strong>Cuisine:</strong> {recipe.area}</p>
                        <p><strong>Category:</strong> {recipe.category}</p>
                        <p><strong>Time:</strong> {recipe.estimatedTime} minutes</p>
                    </div>
                </div>

                {/* Right Column: Ingredients and Allergens */}
                <div className="md:col-span-3">
                    <h2 className="text-xl font-semibold">Ingredients</h2>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
                        {recipe.ingredients.map((ing, i) => (
                            <li key={i}>
                                <span className="font-medium">{ing.measure}</span> {ing.name}
                            </li>
                        ))}
                    </ul>

                    {recipe.allergens.length > 0 && (
                        <>
                            <h2 className="mt-6 text-xl font-semibold">Allergens</h2>
                            <p className="mt-2 text-sm text-red-600">{recipe.allergens.join(', ')}</p>
                        </>
                    )}
                </div>
            </div>

            {/* Instructions Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold">Instructions</h2>
                {/* Use `prose` from Tailwind Typography for beautiful text formatting */}
                <div className="prose prose-green mt-4 max-w-none whitespace-pre-wrap">
                    {recipe.instructions}
                </div>
            </div>
        </>
    );
}