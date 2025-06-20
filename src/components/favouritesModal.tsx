// src/components/FavouritesModal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { api } from '~/utils/api';
import Image from 'next/image';

interface FavouritesModalProps {
    favouriteIds: number[];
    isOpen: boolean;
    closeModal: () => void;
    onRecipeClick: (recipeId: number) => void;
}

export function FavouritesModal({ favouriteIds, isOpen, closeModal, onRecipeClick }: FavouritesModalProps) {
    const { data: recipes, isLoading } = api.recipe.getRecipesByIds.useQuery(
        { ids: favouriteIds },
        {
            enabled: isOpen && favouriteIds.length > 0, // Only fetch if the modal is open and there are favourites
            staleTime: 1000 * 60, // Cache for 1 minute
        }
    );

    const handleRecipeSelect = (recipeId: number) => {
        closeModal(); // Close this modal
        onRecipeClick(recipeId); // Trigger the main recipe modal
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40" onClose={closeModal}>
                {/* ... (Overlay and centering styles - same as RecipeModal) ... */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                    Your Favourites
                                </Dialog.Title>
                                
                                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                    {isLoading && <p>Loading favourites...</p>}
                                    {!isLoading && (!recipes || recipes.length === 0) && (
                                        <p className="text-gray-500">You haven't added any favourites yet.</p>
                                    )}
                                    {recipes?.length && (<ul className="space-y-3">
                                        {recipes?.map(recipe => (
                                            <li
                                                key={recipe?.id}
                                                onClick={() => handleRecipeSelect(recipe?.id ?? 0)}
                                                className="flex items-center gap-4 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <Image
                                                    src={recipe?.imageUrl ?? '/placeholder.png'}
                                                    alt={recipe?.title ?? ""}
                                                    width={64} height={64}
                                                    className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                                                />
                                                <span className="font-semibold text-gray-800">{recipe?.title}</span>
                                            </li>
                                        ))}
                                    </ul>)}
                                </div>

                                <div className="mt-6">
                                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2" onClick={closeModal}>
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}