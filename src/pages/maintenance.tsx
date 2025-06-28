// src/pages/maintenance.tsx
import { useState, useEffect, useMemo } from 'react';
import { type NextPage } from 'next';
import { api } from '~/utils/api';
import { useSearch } from '~/hooks/useSearch'; // Reusing our search hook
import { Dropdown, type DropdownOption } from '~/components/ui/dropDown';
import { MultiSelectDropdown } from '~/components/ui/multiSelectDropDown';
import { FiX, FiPlus } from 'react-icons/fi';
import { ConfirmationModal } from '~/components/confirmationModal';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// Define the shape of our editable recipe state
// Define a fallback type for EditableRecipe in case the tRPC type cannot be inferred
type FallbackRecipe = {
    id: number;
    title: string;
    imageUrl: string | null;
    // link: string | null;
    // category: string | null;
    // area: string | null;
    dietTypeId: number | null;
    instructions: string | null;
    estimatedTime: number | null;
    protein: number | null;
    calorie: number | null;
    ingredients: { ingredientId: number; measure: string | null; ingredient: { name: string } }[];
    allergens: { allergenId: number }[];
};

type EditableRecipe = NonNullable<
    Awaited<ReturnType<typeof api.recipe.getFullRecipeForEdit.useQuery>['data']>
> extends infer T
    ? T extends { ingredients: unknown[] }
        ? T
        : FallbackRecipe
    : FallbackRecipe;

type EditableIngredient = EditableRecipe['ingredients'][number];

const MaintenancePage: NextPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

     // --- State Management ---
    const [recipeIdInput, setRecipeIdInput] = useState('');
    const [recipeToEdit, setRecipeToEdit] = useState<EditableRecipe | null>(null);
    const [showPrettyInstructions, setShowPrettyInstructions] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmationState, setConfirmationState] = useState({
        title: '',
        message: '',
        action: () => {return},
        isDestructive: false,
    });
    const [newIngredientName, setNewIngredientName] = useState('');

    // tRPC hooks
    //const getRecipeQuery = api.recipe.getFullRecipeForEdit.useMutation(); // Use mutation for imperative fetching
     // Use `useQuery` but keep it disabled initially.
    const { 
        data: fetchedRecipeData, 
        refetch: fetchRecipe, // We get a refetch function
        isLoading: isFetchingRecipe, // Use the loading state from this hook
        isError,
        error,
    } = api.recipe.getFullRecipeForEdit.useQuery(
        { id: parseInt(recipeIdInput, 10) || 0 }, // Pass the ID here
        { 
            enabled: false, // <-- IMPORTANT: Do not run on component mount
            retry: false,   // Optional: prevent retrying if a recipe ID is not found
        }
    );
    const updateRecipeMutation = api.recipe.updateRecipe.useMutation();
    const deleteRecipeMutation = api.recipe.deleteRecipe.useMutation();
    const createNewIngredient = api.recipe.createNewIngredient.useMutation();
    const { searchTerm: ingredientSearchTerm, setSearchTerm: setIngredientSearchTerm, searchResults: ingredientSearchResults } = useSearch();




    // === Handlers ===

    // const handleUpdateUser = () => {
    //     updateUserRole.mutate({
    //         userId: "cmc5g6rn60002l1041z7auqsj"
    //     })
    // }

    // === NEW: A centralized function to reset the form state ===
    const resetForm = () => {
        setRecipeIdInput('');
        setRecipeToEdit(null);
        setIngredientSearchTerm(''); // Also clear the ingredient search
        setIsConfirmModalOpen(false); // Ensure the modal is closed
    };
    
    // Effect to update our local state when the manual fetch is successful
    useEffect(() => {
        if (fetchedRecipeData) {
            setRecipeToEdit(fetchedRecipeData);
        }
    }, [fetchedRecipeData]);
    
    // Effect to show an error message
    useEffect(() => {
        if (isError) {
            alert(`Error: ${error?.message ?? 'Recipe not found'}`);
            setRecipeToEdit(null);
        }
    }, [isError, error]);

    // === Updated Handler ===
    const handleFetchRecipe = () => {
        const id = parseInt(recipeIdInput, 10);
        if (!isNaN(id)) {
            // STEP 1: Immediately clear the old recipe data from the form
            setRecipeToEdit(null); 
            // STEP 2: Call the refetch function to trigger the new query
            void fetchRecipe();
        }
    };

    const handleFieldChange = (field: keyof EditableRecipe, value: unknown) => {
        if (!recipeToEdit) return;
        setRecipeToEdit(prev => prev ? { ...prev, [field]: value } : null);
    };
    
    const handleIngredientChange = (index: number, measure: string) => {
        if (!recipeToEdit) return;
        const newIngredients = [...recipeToEdit.ingredients];
        newIngredients[index]!.measure = measure;
        setRecipeToEdit(prev => prev ? { ...prev, ingredients: newIngredients } : null);
    };

    const handleRemoveIngredient = (index: number) => {
        if (!recipeToEdit) return;
        const newIngredients = recipeToEdit.ingredients.filter((_, i) => i !== index);
        setRecipeToEdit(prev => prev ? { ...prev, ingredients: newIngredients } : null);
    };

    const handleAddIngredient = (ingredient: { id: string; name: string }) => {
        if (!recipeToEdit) return;
        const ingredientId = parseInt(ingredient.id.split('-')[1] ?? '0');
        if (ingredientId && !recipeToEdit.ingredients.some(i => i.ingredientId === ingredientId)) {
            const newIngredient: EditableIngredient = {
                ingredientId,
                measure: '', // Default empty measure
                ingredient: { name: ingredient.name },
            };
            setRecipeToEdit(prev => prev ? { ...prev, ingredients: [newIngredient, ...prev.ingredients] } : null);
            setIngredientSearchTerm(''); // Clear search
        }
    };

    // The actual mutation calls are now separate
    const executeSave = () => {
        console.log("RecipeToEdit: ", recipeToEdit);
        // return;
        if (!recipeToEdit) return;
        updateRecipeMutation.mutate({
             id: recipeToEdit.id,
            title: recipeToEdit.title,
            // imageUrl: recipeToEdit.imageUrl ?? undefined,
            // link: recipeToEdit.link ?? undefined,
            // category: recipeToEdit.category ?? undefined,
            // area: recipeToEdit.area ?? undefined,
            dietTypeId: recipeToEdit.dietTypeId ?? undefined,
            instructions: recipeToEdit.instructions ?? undefined,
            estimatedTime: recipeToEdit.estimatedTime ?? undefined,
            protein: recipeToEdit.protein ?? undefined,
            calorie: recipeToEdit.calorie ?? undefined,
            ingredients: recipeToEdit.ingredients.map(i => ({ ingredientId: i.ingredientId, measure: i.measure ?? '' })),
            allergenIds: recipeToEdit.allergens.map(a => a.allergenId),
        }, {
            onSuccess: () => {
                alert('Recipe saved successfully!');
                resetForm(); // <-- Use the reset function
            },
            onError: (error) => alert(`Save failed: ${error.message}`),
            onSettled: () => setIsConfirmModalOpen(false),
        });
    };

    const executeDelete = () => {
        return;
        // if (!recipeToEdit) return;
        // deleteRecipeMutation.mutate({ id: recipeToEdit.id }, {
        //     onSuccess: () => {
        //         alert('Recipe deleted successfully!');
        //         resetForm(); // <-- Use the reset function
        //     },
        //     onError: (error) => alert(`Delete failed: ${error.message}`),
        //     onSettled: () => setIsConfirmModalOpen(false),
        // });
    };

        const createNewIngredient_ = () => {
        createNewIngredient.mutate({ name: newIngredientName }, {
            onSuccess: () => {
                alert('Ingredient created successfully!');
                //resetForm(); // <-- Use the reset function
            },
            onError: (error) => alert(`Creation failed: ${error.message}`),
            onSettled: () => setIsConfirmModalOpen(false),
        });
    }

    // The button handlers now just open the modal
    const handleSaveClick = () => {
        setConfirmationState({
            title: 'Confirm Changes',
            message: 'Are you sure you want to save the changes to this recipe?',
            action: executeSave,
            isDestructive: false,
        });
        setIsConfirmModalOpen(true);
    };

    const handleDeleteClick = () => {
        setConfirmationState({
            title: 'Delete Recipe',
            message: `This action cannot be undone. Are you sure you want to permanently delete "${recipeToEdit?.title ?? 'this recipe'}"?`,
            action: executeDelete,
            isDestructive: true,
        });
        setIsConfirmModalOpen(true);
    };

      const handleCreateNewIngredientName = () => {
        if (newIngredientName === ""){
            setConfirmationState({
            title: 'Invalid Ingredient Name',
            message: 'Enter Ingredient Name',
            action: ()=>{return},
            isDestructive: false,
        });
        } else {
        setConfirmationState({
            title: 'Create New Ingredient',
            message: 'Are you sure you want to create this new ingredient?',
            action: createNewIngredient_,
            isDestructive: false,
        });
    }
        setIsConfirmModalOpen(true);
    };

    // --- Data for Dropdowns ---
    const dietTypeOptions: DropdownOption[] = [{ id: 1, label: 'None' }, {id:2, label: 'Pescatarian'}, {id:3, label:'Pollotarian'}, {id:4, label:'Vegetarian'}, {id:5, label:'Vegan'}, {id:6, label:'Halal'}, {id:7, label:'Keto'}];
    const selectedDietType = useMemo(() => dietTypeOptions.find(d => d.id === recipeToEdit?.dietTypeId), [recipeToEdit]);

    const allergenOptions = [{ id: 1, label: 'Wheat'}, {id:2, label:'Milk'}, { id: 3, label: 'Eggs'}, { id: 4, label: 'Sulfur Dioxide'}, { id: 5, label: 'Celery'}, { id: 6, label: 'Soybeans'}, { id: 7, label: 'Fish'}, { id: 8, label: 'Tree Nuts'}, { id: 9, label: 'Mustard'}, { id: 10, label: 'Sesame'}, { id: 11, label: 'Crustacean Shellfish'}, { id: 12, label: 'Peanuts'}, { id: 13, label: 'Molluscs'}, { id: 14, label: "Lupin"}];
    const allergenOptionsWithState = useMemo(() => {
        const currentAllergenIds = new Set(recipeToEdit?.allergens.map(a => a.allergenId));
        return allergenOptions.map(opt => ({
            ...opt,
            checked: currentAllergenIds.has(opt.id),
        }));
    }, [recipeToEdit]);


        //const updateUserRole = api.user.updateUserRole.useMutation();
// -------------------------- Page Level Security Check -------------------------------------
    // This effect runs when the session status changes
    useEffect(() => {
        // If the session is still loading, do nothing yet.
        if (status === 'loading') {
            return;
        }

        // If the user is not authenticated OR they are not an admin, redirect them.
        if (status === 'unauthenticated' || session?.user?.role !== 'administrator') {
            // Redirect to the home page
            void router.push('/');
        }
    }, [session, status, router]);

    // Show a loading screen while we verify the session.
    // This prevents a "flash" of the admin content for non-admin users.
    if (status === 'loading' || session?.user?.role !== 'administrator') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <p className="text-lg text-gray-600">Verifying access...</p>
            </div>
        );
    }
//--------------------------------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800">Recipe Maintenance</h1>
                
                 {/* --- Fetch Section --- */}
                <div className="mt-6 flex items-center gap-4 p-4 bg-white rounded-lg shadow">
                    <input
                        type="number"
                        placeholder="Enter Recipe ID"
                        value={recipeIdInput}
                        onChange={(e) => setRecipeIdInput(e.target.value)}
                        className="p-2 border rounded-md w-48"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchRecipe()} // Optional: Allow pressing Enter
                    />
                    {/* <button className="px-4 py-2 bg-green-800 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-500" onClick={handleUpdateUser}>Update user role</button> */}
                    <button
                        onClick={handleFetchRecipe}
                        disabled={isFetchingRecipe} // <-- Use the correct loading state
                        className="px-4 py-2 bg-green-800 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-500"
                    >
                        {isFetchingRecipe ? 'Fetching...' : 'Get Recipe'} 
                    </button>
                </div>

                {/* --- Edit Form --- */}
                {recipeToEdit && (
                    <div className="mt-8 p-6 bg-white rounded-lg shadow space-y-6">
                        <div className="md:w-1/2">
                                                                        <Image
                                                                            src={recipeToEdit.imageUrl ?? '/placeholder.png'}
                                                                            alt={recipeToEdit.title}
                                                                            width={600} height={450}
                                                                            className="rounded-lg object-cover"
                                                                        />
                                                                    </div>
                        {/* Title */}
                        <div>
                            <label className="block font-medium text-gray-700">Title</label>
                            <input type="text" value={recipeToEdit.title} onChange={e => handleFieldChange('title', e.target.value)} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>

                        {/* Basic Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ... Add inputs for imageUrl, link, category, area here ... */}
                            <div>
                                <label className="block font-medium text-gray-700">Diet Type</label>
                                <Dropdown options={dietTypeOptions} selectedValue={selectedDietType} onChange={opt => handleFieldChange('dietTypeId', opt.id)} />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700">Exclude Allergens</label>
                                <MultiSelectDropdown 
                                    label="Select..."
                                    options={allergenOptionsWithState}
                                    onSelectAll={() => handleFieldChange('allergens', allergenOptions.map(o => ({ allergenId: o.id })))}
                                    onClearAll={() => handleFieldChange('allergens', [])}
                                    onOptionChange={(id, checked) => {
                                        const currentAllergens = recipeToEdit.allergens.map(a => a.allergenId);
                                        const newAllergens = checked ? [...currentAllergens, id] : currentAllergens.filter(aId => aId !== id);
                                        handleFieldChange('allergens', newAllergens.map(aId => ({ allergenId: aId })));
                                    }}
                                />
                            </div>
                        </div>

                        {/* Ingredients Section */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Ingredients</h3>
                            <div className="space-y-2">
                                {recipeToEdit.ingredients.map((ing, index) => (
                                    <div key={ing.ingredientId} className="flex items-center gap-2">
                                        <span className="font-semibold w-1/3">{ing.ingredient.name}</span>
                                        <input type="text" value={ing.measure ?? ''} onChange={e => handleIngredientChange(index, e.target.value)} className="flex-grow p-1 border rounded-md" placeholder="e.g., 1 cup"/>
                                        <button onClick={() => handleRemoveIngredient(index)} className="p-1 border-2 rounded-xl  text-red-700 hover:text-red-600 hover:bg-red-300"><FiX size={20}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="relative mt-4">
                                <input type="text" value={ingredientSearchTerm} onChange={e => setIngredientSearchTerm(e.target.value)} placeholder="Search to add ingredient..." className="w-full p-2 border rounded-md" />
                                {ingredientSearchTerm && ingredientSearchResults && ingredientSearchResults.filter((ing) => ing !== undefined).length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                        {ingredientSearchResults.filter(r => r !== undefined).filter(r => r.type === 'Ingredient').map(ing => (
                                            <li key={ing.id} onClick={() => handleAddIngredient(ing)} className="p-2 hover:bg-gray-100 cursor-pointer">{ing.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className='mt-4'>
                            <label className=" text-gray-700">Create New Ingredient</label>
                            <div className="flex justify-between gap-4 max-h-12 items-center">
                            <input type="text" value={newIngredientName} onChange={e => setNewIngredientName(e.target.value)} className="mt-1 w-2/3 p-2 border rounded-md" />
                            <button
                                onClick={handleCreateNewIngredientName}
                                disabled={createNewIngredient.isPending}
                                className="px-6 py-2 w-1/3 bg-green-800 text-white rounded-md hover:bg-green-700 disabled:bg-green-500"
                            >
                                Create Ingredient
                            </button>
                            </div>
                        </div>
                        </div>
                        
                        {/* Instructions Section */}
                        <div>
                             <h3 className="text-lg font-medium text-gray-800 mb-2">Instructions</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <textarea value={recipeToEdit.instructions ?? ''} onChange={e => handleFieldChange('instructions', e.target.value)} rows={10} className="w-full p-2 border rounded-md font-mono text-sm"></textarea>
                                <div className="p-4 border rounded-md bg-gray-50 prose prose-sm">
                                    <p className="whitespace-pre-wrap">{recipeToEdit.instructions}</p>
                                </div>
                             </div>
                        </div>

                        {/* --- Numeric Fields (Now with Protein and Calorie) --- */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="block font-medium text-gray-700">Time (mins)</label>
                                <input type="number" value={recipeToEdit.estimatedTime ?? ''} onChange={e => handleFieldChange('estimatedTime', e.target.valueAsNumber)} className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700">Protein (g)</label>
                                <input type="number" value={recipeToEdit.protein ?? ''} onChange={e => handleFieldChange('protein', e.target.valueAsNumber)} className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700">Calories (kcal)</label>
                                <input type="number" value={recipeToEdit.calorie ?? ''} onChange={e => handleFieldChange('calorie', e.target.valueAsNumber)} className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                        </div>

                        {/* --- Action Buttons (Now trigger the modal) --- */}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <button
                                onClick={handleDeleteClick} // <-- Updated handler
                                disabled={deleteRecipeMutation.isPending}
                                className="px-4 py-2 bg-red-700 text-white font-semibold rounded-md hover:bg-red-600 disabled:bg-red-500"
                            >
                                Delete Recipe
                            </button>
                            <button
                                onClick={handleSaveClick} // <-- Updated handler
                                disabled={updateRecipeMutation.isPending}
                                className="px-6 py-2 bg-green-800 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-500"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* --- Render the Confirmation Modal --- */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmationState.action}
                title={confirmationState.title}
                isDestructive={confirmationState.isDestructive}
            >
                {confirmationState.message}
            </ConfirmationModal>
        </div>
    );
};

export default MaintenancePage;