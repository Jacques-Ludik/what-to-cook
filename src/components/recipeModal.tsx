// src/components/RecipeModal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { api } from '~/utils/api';
import Image from 'next/image';
import { ShareButton } from './shareButton';

interface RecipeModalProps {
    recipeId: number;
    isOpen: boolean;
    closeModal: () => void;
    isFavourited: boolean;
    toggleFavourite: (id: number) => void;
}

export function RecipeModal({ recipeId, isOpen, closeModal, isFavourited, toggleFavourite  }: RecipeModalProps) {
    const { data: recipe, isLoading, error } = api.recipe.getRecipeDetails.useQuery(
        { id: recipeId },
        {
            enabled: isOpen, // Only fetch the data when the modal is open
            staleTime: 1000 * 60 * 60, // Cache for 1 hour
        }
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-30" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                {isLoading && <p>Loading recipe...</p>}
                                {error && <p>Error: {error.message}</p>}
                                {recipe && (
                                    <>
                                        <Dialog.Title as="h3" className="text-2xl font-bold flex leading-6 justify-between text-gray-900">
                                            {recipe.title}
                                                                                    {/* === NEW & IMPROVED FAVOURITE BUTTON === */}
<button
    onClick={() => toggleFavourite(recipeId)}
    // Base classes for layout, focus, and transition
    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95
        ${isFavourited
            // Classes for the "Favourited" state
            ? 'bg-red-100 text-red-600 hover:bg-red-200 focus-visible:ring-red-500'
            // Classes for the "Not Favourited" state
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus-visible:ring-gray-400'
        }
    `}
    aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
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
    <span>
        {isFavourited ? 'Favourited' : 'Favourite'}
    </span>
</button>
                                        </Dialog.Title>
                                        
                                        <div className="mt-4 flex flex-col md:flex-row gap-6">
                                            <div className="md:w-1/2">
                                                <Image
                                                    src={recipe.imageUrl ?? '/placeholder.png'}
                                                    alt={recipe.title}
                                                    width={400} height={300}
                                                    className="rounded-lg object-cover"
                                                />
                                            </div>
                                            <div className="md:w-1/2">
                                                <h4 className="font-semibold text-lg">Ingredients</h4>
                                                <ul className="list-disc list-inside mt-2 text-sm">
                                                    {recipe.ingredients.map((ing, i) => (
                                                        <li key={i}>{ing.measure} {ing.name}</li>
                                                    ))}
                                                </ul>
                                                {recipe.allergens.length > 0 && (
                                                    <>
                                                        <h4 className="font-semibold text-lg mt-4">Allergens</h4>
                                                        <p className="text-sm text-red-600">{recipe.allergens.join(', ')}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-lg">Instructions</h4>
                                            <p className="text-sm whitespace-pre-wrap mt-2">{recipe.instructions}</p>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                        <button type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                                                onClick={closeModal}
                                            >
                                                Got it, thanks!
                                            </button>
                        
                        <ShareButton
                            title={recipe.title}
                            text={`Check out this delicious recipe for ${recipe.title}!`}
                            // === THE KEY CHANGE IS HERE ===
                            // Construct the URL with a query parameter instead of a path.
                            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/?recipe=${recipe.id}`}
                        />
                    </div>
                                        {/* <div className="mt-6">
                                            <button type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                                                onClick={closeModal}
                                            >
                                                Got it, thanks!
                                            </button>
                                        </div> */}
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}