import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { recipesToSeed } from "recipes-data"; // Import the data
import { api } from "~/utils/api";
import { AuthShowcase } from "~/components/AuthShowcase";
import { useIngredients } from "~/hooks/useIngredients";
import { useUserPreferences } from "~/hooks/useUserPreferences";
import { useIngredientSelection } from "~/hooks/useIngredientSelection";
import { useFavourites } from "~/hooks/useFavourites";
import { useSearch } from '~/hooks/useSearch'; // <-- Import the new hook
import { RecipeModal } from '~/components/recipeModal'; // <-- Import the modal
// import { useInterests } from "~/hooks/useInterests"; // a hook you would create
import { RecipeFeed } from "~/components/recipeFeed";
import { useInterests } from "~/hooks/useInterests";
import { FavouritesModal } from '~/components/favouritesModal';
import { ScrollToTopButton } from '~/components/scrollToTopButton';
import { useRouter } from 'next/router';
import { Dropdown, type DropdownOption } from '~/components/ui/dropDown';
import { MultiSelectDropdown } from '~/components/ui/multiSelectDropDown';
import { IngredientsSkeleton } from '~/components/ingredientsSkeleton';
import { useModalRouter } from '~/hooks/useModalRouter';

// Types
 type AllergensOptions = {
    id: number;
    allergen: string;
    state: boolean;
  };

  type Allergens = {
    id: number;
    allergen: string;
  };

  type AllergensSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  type DietType = {
    id: number;
    type: string;
  };

// Define a type for preferences to avoid 'any'
type Preferences = {
    dietTypeId: number;
    estimatedTimeOption: string;
    highProtein: boolean;
    lowCalorie: boolean;
    allergensIDList: number[];
};

// A helper function to create the input object for the query
const createFeedInput = (
    prefs: Preferences,
    ingredients: { selectedIds: Iterable<number> | ArrayLike<number>; },
    favourites: { favouriteIds: Iterable<number> | ArrayLike<number>; },
    seed: number
) => {
    return {
        dietTypeId: prefs.dietTypeId,
        estimatedTime: parseInt(prefs.estimatedTimeOption.split(" ")[0] ?? "0"),
        highProtein: prefs.highProtein,
        lowCalorie: prefs.lowCalorie,
        excludedAllergenIds: prefs.allergensIDList,
        favouriteRecipeIds: Array.from(favourites.favouriteIds),
        ingredientIds: Array.from(ingredients.selectedIds),
        seed: seed
    };
};

export default function Home() {

  const router = useRouter(); //initialise the router

  // === NEW EFFECT: Handle incoming share links ===
    useEffect(() => {
        // This effect runs when the component mounts and the router is ready.
        // `router.isReady` is important for ensuring query params are available.
        if (router.isReady) {
            const recipeIdFromUrl = router.query.recipe;

            if (typeof recipeIdFromUrl === 'string') {
                const recipeId = parseInt(recipeIdFromUrl, 10);
                if (!isNaN(recipeId)) {
                    // We found a valid recipe ID in the URL.
                    // Open the modal for that recipe.
                    console.log(`Opening recipe modal for ID: ${recipeId} from URL.`);
                    setViewingRecipeId(recipeId);
                }
            }
        }
    }, [router.isReady, router.query]); // Re-run if the query params change

  // Step 1: Create a ref for the recommendations section
    const recommendationsRef = useRef<HTMLHeadingElement>(null);

  //Hooks
  // Use the custom hook to get ingredients. It handles all the logic!
  const { ingredients, isLoading: ingredientsLoading, addIngredientToList } = useIngredients();
  // These hooks manage the "live" state as the user clicks things
  const prefs = useUserPreferences();
  const { selectedIds, toggleIngredient, saveSelection, addAndPersistSelection } = useIngredientSelection();
    const { favouriteIds, toggleFavourite } = useFavourites();
    const { addInterest } = useInterests();
  // const { interestData } = useInterests();

  // === The "Staged" Input State ===
    // This state holds the input that is sent to the query.
    // It's ONLY updated when the "Let's Cook" button is clicked.
    // We store the seed in state. It only changes when a new search is initiated.
    const [searchSeed, setSearchSeed] = useState(() => Math.random());
    type FeedInput = ReturnType<typeof createFeedInput>;
    const [stagedFeedInput, setStagedFeedInput] = useState<FeedInput | null>(null);

    // This effect runs ONLY when the initial preferences are loaded.
    // It sets the initial state for the recipe feed.
    useEffect(() => {
        if (!prefs.isLoading && stagedFeedInput === null) {
            setStagedFeedInput(createFeedInput(prefs, { selectedIds }, { favouriteIds }, searchSeed));
        }
    }, [prefs.isLoading]);

    const handleLetsCook = () => {
        // 1. Persist the current selections
        prefs.savePreferencesToDb();
        saveSelection();

        // Generate a NEW seed for the new search
        const newSeed = Math.random();
        setSearchSeed(newSeed);

        // 2. Update the staged input to trigger a new feed fetch
        const newFeedInput = createFeedInput(prefs, { selectedIds }, { favouriteIds }, newSeed);
        console.log("New Feed Input: ", newFeedInput);
        setStagedFeedInput(newFeedInput);

        // 3. Trigger the scroll after a short delay
        // We use a timeout to ensure the DOM has had a chance to update
        // after the state change, making the scroll target available.
        setTimeout(() => {
            recommendationsRef.current?.scrollIntoView({
                behavior: 'smooth', // Makes the scroll animated instead of an instant jump
                block: 'start',    // Vertically aligns the element to the center of the viewport
            });
        }, 100); // 100ms is usually enough time
    };

    //Search
    const { searchTerm, setSearchTerm, searchResults, isLoading: isSearchLoading } = useSearch();

    // State to manage if the results dropdown is open
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Effect to close the dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsResultsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (e.target.value.length > 1) {
            setIsResultsOpen(true);
        } else {
            setIsResultsOpen(false);
        }
    };

    //Click on search results
    // === State for the Recipe Modal ===
    const [viewingRecipeId, setViewingRecipeId] = useModalRouter<number>('recipe');

    // ... search dropdown state and handlers ...
    const handleSearchResultClick = (result: { id: string; name: string; type: 'Recipe' | 'Ingredient' }) => {
        const entityId = parseInt(result.id.split('-')[1] ?? '0');

        if (result.type === 'Recipe') {
            setViewingRecipeId(entityId);
            // Immediately track this interaction
            addInterest(entityId);
        } else { // It's an ingredient
            // Add to the visual list, providing the current `selectedIds` for the removal logic
            addIngredientToList({ id: entityId, name: result.name }, selectedIds);
            
            // Select it and update its count in DB/localStorage
            addAndPersistSelection(entityId);
        }
        // Close the search results dropdown
        setIsResultsOpen(false);
    };

    //Favourites
    const [isFavouritesModalOpen, setIsFavouritesModalOpen] = useModalRouter<boolean>('show_favourites');

    // This function will now be used by BOTH the FavouritesModal and the RecipeFeed
    const openRecipeModal = (recipeId: number) => {
        // If the favourites modal is open, close it first.
        if(isFavouritesModalOpen) {
            setIsFavouritesModalOpen(null);
        }
        setViewingRecipeId(recipeId);
    };
    // // This function will now be used by BOTH the FavouritesModal and the RecipeFeed
    // const openRecipeModal = (recipeId: number) => {
    //     setViewingRecipeId(recipeId);
    // };

  //-----------------------------------------------------DropDowns-----------------------------------------------------------------


 // DIET TYPE
    const dietTypeOptions: DropdownOption[] = [{ id: 1, label: 'None' }, {id:2, label: 'Pescatarian'}, {id:3, label:'Pollotarian'}, {id:4, label:'Vegetarian'}, {id:5, label:'Vegan'}, {id:6, label:'Halal'}, {id:7, label:'Keto'}];
    const selectedDietType = useMemo(() => dietTypeOptions.find(opt => opt.id === prefs.dietTypeId), [prefs.dietTypeId]);
    const handleDietTypeChange = (option: DropdownOption) => {
        prefs.setDietTypeId(option.id as number);
    };

    // ESTIMATED TIME
    const timeOptions: DropdownOption[] = ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '75 minutes', '90 minutes', '120 minutes'].map(t => ({ id: t, label: t }));
    const selectedTime = useMemo(() => timeOptions.find(opt => opt.id === prefs.estimatedTimeOption), [prefs.estimatedTimeOption]);
    const handleTimeChange = (option: DropdownOption) => {
        prefs.setEstimatedTimeOption(option.id as string);
    };

    // ALLERGENS
    const allergenOptions = [{ id: 1, label: 'Wheat'}, {id:2, label:'Milk'}, { id: 3, label: 'Eggs'}, { id: 4, label: 'Sulfur Dioxide'}, { id: 5, label: 'Celery'}, { id: 6, label: 'Soybeans'}, { id: 7, label: 'Fish'}, { id: 8, label: 'Tree Nuts'}, { id: 9, label: 'Mustard'}, { id: 10, label: 'Sesame'}, { id: 11, label: 'Crustacean Shellfish'}, { id: 12, label: 'Peanuts'}, { id: 13, label: 'Molluscs'}, { id: 14, label: "Lupin"}];
    const allergenOptionsWithState = useMemo(() => {
        return allergenOptions.map(opt => ({
            ...opt,
            checked: prefs.allergensIDList.includes(opt.id),
        }));
    }, [prefs.allergensIDList]);
    
    const handleAllergenChange = (id: number, checked: boolean) => {
        prefs.setAllergensIDList(prev => 
            checked ? [...prev, id] : prev.filter(pId => pId !== id)
        );
    };
    const handleSelectAllAllergens = () => prefs.setAllergensIDList(allergenOptions.map(opt => opt.id));
    const handleClearAllAllergens = () => prefs.setAllergensIDList([]);





// //old code
//   const dietTypeRef = useRef<HTMLDivElement>(null);
//   const btnDietTypeRef = useRef<HTMLButtonElement>(null);
//   const [estimatedTime, setEstimatedTime] = useState(false);
//   //const [estimatedTimeOption, setEstimatedTimeOption] = useState("30 minutes");
//   const estimatedTimeRef = useRef<HTMLDivElement>(null);
//   const btnEstimatedTimeRef = useRef<HTMLButtonElement>(null);
//   const [allergens, setAllergens] = useState(false);
//   const [allergensOption, setAllergensOption] = useState("None");
//   const allergensRef = useRef<HTMLDivElement>(null);
//   const btnAllergensRef = useRef<HTMLButtonElement>(null);
// //------------------ DIET TYPE --------------------
// const dietTypeOptions = [{ id: 1, type: 'None' }, {id:2, type: 'Pescatarian'}, {id:3, type:'Pollotarian'}, {id:4, type:'Vegetarian'}, {id:5, type:'Vegan'}, {id:6, type:'Halal'}, {id:7, type:'Keto'}];
// const [dietType, setDietType] = useState(false);
// const [dietTypeOption, setDietTypeOption] = useState<DietType>(dietTypeOptions.find((dietType) => dietType.id === prefs.dietTypeId) ?? { id: 1, type: 'None'});
// const handleToggleDietType = () => {
//     setDietType(!dietType);
//   };
//   const handleDietTypeOption = (option: SetStateAction<string>, id: number) => {
//     const dietType_ =  dietTypeOptions.find((diet) => diet.id === id);
//     if (!dietType_) return;
//     setDietTypeOption(dietType_);
//     //added
//     prefs.setDietTypeId(id);
//     setDietType(false);
//   }
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dietTypeRef.current &&
//         !dietTypeRef.current.contains(event.target as Node) &&
//         btnDietTypeRef.current &&
//         !btnDietTypeRef.current.contains(event.target as Node)
//       ) {
//         setDietType(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);
//   //set diettype to returned diettype from db
//   useEffect(() =>{
//     const dietType_ = dietTypeOptions.find((dietType) => dietType.id == prefs.dietTypeId);
//     setDietTypeOption(dietType_ ?? { id: 1, type: 'None' });
//   }, [prefs.dietTypeId]);
  

//   //------------------ ESTIMATED TIME --------------------
// const estimatedTimeOptions = ['15 minutes', '30 minutes', '45 minutes', '60 minutes', '75 minutes', '90 minutes',  '120 minutes'];
// const handleToggleEstimatedTime = () => {
//     setEstimatedTime(!estimatedTime);
//   };
//   const handleEstimatedTimeOption = (option: SetStateAction<string>) => {
//     prefs.setEstimatedTimeOption(option);
//     setEstimatedTime(false);
//   };
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         estimatedTimeRef.current &&
//         !estimatedTimeRef.current.contains(event.target as Node) &&
//         btnEstimatedTimeRef.current &&
//         !btnEstimatedTimeRef.current.contains(event.target as Node)
//       ) {
//         setEstimatedTime(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   //------------------ ALLERGENS --------------------
// const handleToggleAllergens = () => {
//     setAllergens(!allergens);
//   };
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         allergensRef.current &&
//         !allergensRef.current.contains(event.target as Node) &&
//         btnAllergensRef.current &&
//         !btnAllergensRef.current.contains(event.target as Node)
//       ) {
//         setAllergens(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const [allergensListOptions, setAllergensListOptions] = useState<AllergensOptions[]>([]);
//   const [allergensSelection, setAllergensSelection] = useState<AllergensSelect>();
//   const [allergensList, setAllergensList] = useState<Allergens[]>([]);

//   const handleAllergens = (id: number, option: SetStateAction<string>, state: boolean, selectionAllergens: string) => {
//     if (selectionAllergens === "allSelected") {
//       setAllergensOption("Select All");
//       setAllergensSelection({ allSelected: state, clear: false });
//       const allergens_ = allergensListOptions.map((allergen) => ({
//         id: allergen.id,
//         allergen: allergen.allergen,
//       }));
//       setAllergensList(allergens_.sort((a, b) => a.id - b.id));
//       setAllergensListOptions(allergensListOptions.map((allergen) => ({ ...allergen, state: true })));
//       //added
//       prefs.setAllergensIDList(allergensListOptions.map((allergen) => allergen.id));
//     } else if (selectionAllergens === "clear") {
//       setAllergensOption("Clear All");
//       setAllergensSelection({ allSelected: false, clear: state });
//       setAllergensList([]);
//       setAllergensListOptions(allergensListOptions.map((allergen) => ({ ...allergen, state: false })));
//       //added
//       prefs.setAllergensIDList([]);
//     } else if (selectionAllergens === "normal") {
//       setAllergensOption(option);
//       setAllergensSelection({ allSelected: false, clear: false });
//       if (state) {
//         const allergen_: Allergens = {
//           id: id,
//           allergen: String(option),
//         };
//         const allergensIDList_ = allergensList.map((allergen) => allergen.id);
//         if (!allergensIDList_.includes(id)) {
//           setAllergensList([...allergensList, allergen_]);
//           //added
//           prefs.setAllergensIDList([...allergensIDList_, allergen_.id]);
//         }
//         setAllergensListOptions(allergensListOptions.map((allergen) => (allergen.id === id ? { ...allergen, state: true } : allergen)));
//       } else {
//         const updatedAllergensList = allergensList.filter((allergen) => allergen.id !== id);
//         setAllergensList(updatedAllergensList.sort((a, b) => a.id - b.id));
//         setAllergensListOptions(allergensListOptions.map((allergen) => (allergen.id === id ? { ...allergen, state: false } : allergen)));
//         //added
//         prefs.setAllergensIDList(updatedAllergensList.map((allergen) => allergen.id).filter((allergen) => allergen != id));
//       }
//     }
//   }
//   useEffect(() => {
//       //set allergens options
//     const allergensOptions = [{ id: 1, name: 'Wheat'}, {id:2, name:'Milk'}, { id: 3, name: 'Eggs'}, { id: 4, name: 'Sulfur Dioxide'}, { id: 5, name: 'Celery'}, { id: 6, name: 'Soybeans'}, { id: 7, name: 'Fish'}, { id: 8, name: 'Tree Nuts'}, { id: 9, name: 'Mustard'}, { id: 10, name: 'Sesame'}, { id: 11, name: 'Crustacean Shellfish'}, { id: 12, name: 'Peanuts'}, { id: 13, name: 'Molluscs'}, { id: 14, name: "Lupin"}];
//     console.log("Allergens List should be here: ", prefs.allergensIDList);

//       const initialAllergensListOptions = prefs.allergensIDList.length > 0 ? allergensOptions.map((allergen, index) => ({
//       id: index + 1,
//       allergen: allergen.name,
//       state: prefs.allergensIDList.includes(allergen.id),
//     })) : allergensOptions.map((allergen, index) => ({
//       id: index + 1,
//       allergen: allergen.name,
//       state: false,
//     }));

//     setAllergensListOptions(initialAllergensListOptions);
//     setAllergensList(initialAllergensListOptions.filter((allergen) => allergen.state === true).map((allergen) => ({allergen: allergen.allergen, id: allergen.id})));
//     },[prefs.allergensIDList]);
// //---------------------------------------------------------------------------------------------------------------------------------------------------

// === DERIVED STATE: Is any modal currently open? ===
    // This variable will be true if either the favourites modal is open
    // OR a recipe is being viewed in the recipe modal.
    const isAnyModalOpen = !!isFavouritesModalOpen || viewingRecipeId !== null;
    // const isAnyModalOpen = isFavouritesModalOpen || viewingRecipeId !== null;
  return (
    <>
      <Head>
        <title>What to Cook</title>
        <meta name="description" content="Select ingredients you have available to get mouth watering recipes or just browse through delicious recipe ideas" />
        <link rel="icon" href="/whattocook-logo.png" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-[#faebd7] px-4 py-6">
  {/* Header: Adjusted for responsiveness */}
  <header className="relative flex w-full max-w-7xl items-center justify-center py-2">
    {/* --- FAVOURITES BUTTON (TOP-LEFT) --- */}
    <div className="absolute left-0 top-1/2 -translate-y-1/2">
      <button
        onClick={() => setIsFavouritesModalOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-green-800 p-2 text-white shadow-md transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
        aria-label="View your favourite recipes"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        {/* Text is hidden on mobile, appears on small screens and up */}
        <span className="hidden font-semibold sm:inline">Favourites</span>
      </button>
    </div>

    {/* --- TITLE --- */}
    <div className="text-center">
      {/* Responsive font sizes */}
      <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl md:text-5xl">
        What to <span className="text-green-800">Cook</span>
      </h1>
    </div>

    {/* --- AUTH BUTTON (TOP-RIGHT) --- */}
    <div className="absolute right-0 top-1/2 -translate-y-1/2">
      {/* The AuthShowcase component itself can also be made responsive */}
      <AuthShowcase />
    </div>
  </header>
        {/* --- SEARCH BAR AND RESULTS --- */}
                <div className="relative mt-6 w-full max-w-lg" ref={searchContainerRef}>
                    <input
                        type="text"
                        placeholder="Search for ingredients/recipes..."
                        className="mt-2 w-full rounded-lg border border-gray-900 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-800"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => { if (searchTerm.length > 1) setIsResultsOpen(true); }}
                    />
                    
                    {isResultsOpen && (
                        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                            {isSearchLoading && <div className="p-2 text-gray-500">Searching...</div>}

                            {!isSearchLoading && searchResults && searchResults.length > 0 && (
                                <ul className="max-h-60 overflow-auto">
                                    {searchResults.map((result) => (
                                        <li
                                            key={result.id}
                                            className="cursor-pointer p-2 hover:bg-green-100"
                                            // You would add an onClick handler here to navigate
                                            // to the recipe page or add the ingredient
                                            // onClick={() => {
                                            //     console.log('Selected:', result);
                                            //     setIsResultsOpen(false);
                                            // }}
                                            onClick={() => handleSearchResultClick(result)}
                                        >
                                            {result.name}
                                            <span className="ml-2 text-xs text-gray-500">({result.type})</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {!isSearchLoading && searchResults && searchResults.length === 0 && searchTerm.length > 1 && (
                                <div className="p-2 text-gray-500">No results found.</div>
                            )}
                        </div>
                    )}
                </div>
                {/* --- END SEARCH BAR --- */}


{/* --- FILTERS CONTAINER --- */}
{/* On large screens, use `grid` and `grid-cols-2` for perfect alignment and equal height. */}
<div className="mt-8 grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">

  {/* --- INGREDIENTS BOX --- */}
  {/* The `h-full` class is important for stretching inside a grid cell if needed, though grid usually handles this. */}
  <div className="flex h-full w-full flex-col gap-2 rounded-2xl border-2 border-green-900 p-4">
    <p className="text-center text-lg font-bold text-black">Ingredients</p>
    <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 pt-2">
      {ingredientsLoading ? (
                        <IngredientsSkeleton />
                    ) : (ingredients.map((ingredient, index) => (
                      <div className="flex gap-1" key={index}><input type="checkbox" id={"Ingredient"+String(index)} checked={selectedIds.has(ingredient.id)} onChange={() => toggleIngredient(ingredient.id)} className="accent-green-800"/><label htmlFor={"Ingredient"+String(index)} className=" text-black">{ingredient.name}</label></div>
                    )))}
    </div>
  </div>

  {/* === REFACTORED PREFERENCES BOX === */}
  <div className="flex h-full w-full flex-col gap-4 rounded-2xl border-2 border-green-900 p-4">
    <p className="text-center text-lg font-bold text-black">Preferences</p>
    {/* Use `space-y-4` for consistent vertical spacing */}
    <div className="flex flex-col space-y-4">
    
      {/* Diet Type */}
      {/* Use `justify-start` and `gap-4` to bring the label and dropdown closer */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-bold text-black">Diet Type</span>
        <Dropdown options={dietTypeOptions} selectedValue={selectedDietType} onChange={handleDietTypeChange} />
      </div>

      {/* Estimated Time */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-bold text-black">Time</span>
        <Dropdown options={timeOptions} selectedValue={selectedTime} onChange={handleTimeChange} />
      </div>

      {/* Allergens */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-bold text-black">Exclude Allergens</span>
        <MultiSelectDropdown
          label="Select..."
          options={allergenOptionsWithState}
          onSelectAll={handleSelectAllAllergens}
          onClearAll={handleClearAllAllergens}
          onOptionChange={handleAllergenChange}
        />
      </div>

      {/* High Protein / Low Calorie Checkboxes */}
      {/* Use `border-t` for a clean visual separator */}
      <div className="flex items-center gap-4 border-t border-green-900/20 pt-4 sm:justify-center sm:gap-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input id="highProtein" type="checkbox" checked={prefs.highProtein} onChange={(e) => prefs.setHighProtein(e.target.checked)} className="h-4 w-4 accent-green-800" />
          <span className="text-black">High Protein</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input id="lowCalorie" type="checkbox" checked={prefs.lowCalorie} onChange={(e) => prefs.setLowCalorie(e.target.checked)} className="h-4 w-4 accent-green-800" />
          <span className="text-black">Low Calorie</span>
        </label>
      </div>

    </div>
  </div>
</div>

            {/* --- LET'S COOK BUTTON --- */}
  <div className="my-8">
    <button
      className="rounded-xl bg-green-800 px-10 py-3 text-lg font-bold text-white no-underline shadow-lg transition hover:bg-green-700 active:scale-95 sm:text-xl"
              onClick={() => handleLetsCook()} disabled={prefs.isLoading || ingredientsLoading}> Let&apos;s Cook!</button>   
</div>

{/* --- RECIPE FEED --- */}
  <div className="w-full max-w-7xl">
    <h2 className="text-center text-3xl font-bold mb-6" ref={recommendationsRef}>Recommended For You</h2>
            {stagedFeedInput && <RecipeFeed
            // By changing the key, we tell React to unmount the old component and
          // mount a brand new one, completely resetting the infinite query state.
          key={`${JSON.stringify(stagedFeedInput)}-${searchSeed}`}
          input={stagedFeedInput}
          onRecipeClick={openRecipeModal}
            />}
        </div>

      </main>
      {/* === Render the Modals === */}
      <FavouritesModal
                isOpen={!!isFavouritesModalOpen}
                closeModal={() => setIsFavouritesModalOpen(null)}
                favouriteIds={Array.from(favouriteIds)}
                onRecipeClick={openRecipeModal}
            />

            {viewingRecipeId !== null && (
                <RecipeModal
                    isOpen={viewingRecipeId !== null}
                    recipeId={viewingRecipeId}
                    closeModal={() => setViewingRecipeId(null)}
                    isFavourited={favouriteIds.has(viewingRecipeId)}
                    toggleFavourite={toggleFavourite}
                />
            )}
            {/* <FavouritesModal
                isOpen={isFavouritesModalOpen}
                closeModal={() => setIsFavouritesModalOpen(false)}
                favouriteIds={Array.from(favouriteIds)}
                onRecipeClick={openRecipeModal}
            />
            {viewingRecipeId !== null && (
                <RecipeModal
                    isOpen={viewingRecipeId !== null}
                    recipeId={viewingRecipeId}
                    closeModal={() => {
                        setViewingRecipeId(null);
                        // Optional: Clean up the URL when the modal is closed
                        void router.push('/', undefined, { shallow: true });
                    }}
                    isFavourited={favouriteIds.has(viewingRecipeId)}
                    toggleFavourite={toggleFavourite}
                />
            )} */}
            <ScrollToTopButton isExternallyHidden={isAnyModalOpen} />
    </>
  );
}



//old ingredient and preferences
//           {/* --- FILTERS CONTAINER --- */}
//   {/* This container will stack its children vertically on mobile and horizontally on larger screens */}
//   <div className="mt-8 flex w-full max-w-7xl flex-col items-center justify-center gap-6 lg:flex-row lg:items-start">
    
//     {/* --- INGREDIENTS BOX --- */}
//     {/* On mobile, it takes full width. On large screens, it takes roughly half the width. */}
//     <div className="flex w-full flex-col gap-2 rounded-2xl border-2 border-green-900 p-4 lg:w-1/2">
//       <p className="text-center text-lg font-bold text-black">Ingredients</p>
//       <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
//                   {ingredientsLoading ? (
//                         <p className="text-black">Loading ingredients...</p>
//                     ) : (ingredients.map((ingredient, index) => (
//                       <div className="flex gap-1" key={index}><input type="checkbox" id={"Ingredient"+String(index)} checked={selectedIds.has(ingredient.id)} onChange={() => toggleIngredient(ingredient.id)} className="accent-green-800"/><label htmlFor={"Ingredient"+String(index)} className=" text-black">{ingredient.name}</label></div>
//                     )))}
//             </div> 
// </div>

// {/* === REFACTORED PREFERENCES BOX === */}
//             <div className="flex w-full flex-col gap-4 rounded-2xl border-2 border-green-900 p-4 lg:w-1/2">
//                 <p className="text-center text-lg font-bold text-black">Preferences</p>
//                 <div className="grid grid-cols-1 items-center gap-y-6 sm:grid-cols-2 sm:gap-x-4">
//                     {/* Diet Type */}
//                     <div className="flex items-center justify-between">
//                         <span className="font-bold text-black">Diet Type</span>
//                         <Dropdown options={dietTypeOptions} selectedValue={selectedDietType} onChange={handleDietTypeChange} />
//                     </div>

//                     {/* Estimated Time */}
//                     <div className="flex items-center justify-between">
//                         <span className="font-bold text-black">Time</span>
//                         <Dropdown options={timeOptions} selectedValue={selectedTime} onChange={handleTimeChange} />
//                     </div>

//                     {/* Allergens */}
//                     <div className="flex items-center justify-between sm:col-span-2">
//                         <span className="font-bold text-black">Exclude Allergens</span>
//                         <MultiSelectDropdown 
//                             label="Select..."
//                             options={allergenOptionsWithState}
//                             onSelectAll={handleSelectAllAllergens}
//                             onClearAll={handleClearAllAllergens}
//                             onOptionChange={handleAllergenChange}
//                         />
//                     </div>
                    
//                     {/* High Protein / Low Calorie Checkboxes */}
//                     <div className="flex flex-col items-start gap-2 sm:col-span-2 sm:flex-row sm:justify-center sm:gap-8">
//                         <label className="flex items-center gap-2 cursor-pointer">
//                             <input id="highProtein" type="checkbox" checked={prefs.highProtein} onChange={(e) => prefs.setHighProtein(e.target.checked)} className="h-4 w-4 accent-green-800"/>
//                             <span className="text-black">High Protein</span>
//                         </label>
//                         <label className="flex items-center gap-2 cursor-pointer">
//                             <input id="lowCalorie" type="checkbox" checked={prefs.lowCalorie} onChange={(e) => prefs.setLowCalorie(e.target.checked)} className="h-4 w-4 accent-green-800"/>
//                             <span className="text-black">Low Calorie</span>
//                         </label>
//                     </div>
//                 </div>
//             </div>
//             </div>













//Old preference box code:
// {/* --- PREFERENCES BOX --- */}
//     {/* Same responsive width logic as the ingredients box */}
//     <div className="flex w-full flex-col gap-3 rounded-2xl border-2 border-green-900 p-4 lg:w-1/2">
//       <p className="text-center text-lg font-bold text-black">Preferences</p>
//       {/* This grid will stack items and then become a 2-column grid on medium screens */}
//       <div className="grid grid-cols-1 items-center justify-items-center gap-4 md:grid-cols-2">
//         {/* Individual preference item */}
//         <div className="flex w-full items-center justify-between md:justify-start md:gap-4">
//           <label htmlFor="dietType" className="font-bold text-black">Diet Type</label>
//           <div className="relative">
//                       <button
//                         ref={btnDietTypeRef}
//                         className=" inline-flex items-center rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
//                         type="button"
//                         onClick={handleToggleDietType}
//                       >
//                         {dietTypeOption.type + " "}
//                         <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
//                           <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
//                         </svg>
//                       </button>
//                       {dietType && (
//                         <div ref={dietTypeRef} className="absolute top-11 z-10 w-32 divide-y divide-gray-100 rounded-lg bg-white shadow">
//                           <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
//                             {dietTypeOptions.map((option) => (
//                               <li key={option.id} onClick={() => handleDietTypeOption(option.type, option.id)}>
//                                 <button className="block px-4 py-2 hover:bg-gray-100">{option.type}</button>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//               {/* Individual preference item */}
//         <div className="flex w-full items-center justify-between md:justify-start md:gap-4">
//           <label htmlFor="estimatedTime" className="font-bold text-black">Time</label>
//           <div className="relative">
//                       <button
//                         ref={btnEstimatedTimeRef}
//                         className=" inline-flex items-center rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
//                         type="button"
//                         onClick={handleToggleEstimatedTime}
//                       >
//                         {prefs.estimatedTimeOption + " "}
//                         <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
//                           <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
//                         </svg>
//                       </button>
//                       {estimatedTime && (
//                         <div ref={estimatedTimeRef} className="absolute top-11 z-10 w-36 divide-y divide-gray-100 rounded-lg bg-white shadow">
//                           <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
//                             {estimatedTimeOptions.map((option) => (
//                               <li key={option} onClick={() => handleEstimatedTimeOption(option)}>
//                                 <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                       {/* Individual preference item */}
//         <div className="flex w-full items-center justify-between md:justify-start md:gap-4">
//           <label htmlFor="allergens" className="font-bold text-black">Allergens</label>
//           <div className="relative">
//                       <button
//                         ref={btnAllergensRef}
//                         className=" inline-flex items-center rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
//                         type="button"
//                         onClick={handleToggleAllergens}
//                       >
//                         {allergensOption + " "}
//                         <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">   
//                           <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
//                         </svg>
//                       </button>
//                       {allergens && (
//                         <div ref={allergensRef} className="absolute top-11 z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">

//                         <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
//                             <li key={1}>
//                               <div className="flex items-center px-2">
//                                 <input
//                                   id="1"
//                                   type="checkbox"
//                                   checked={allergensSelection?.allSelected}
//                                   onChange={(e) => handleAllergens(0, "", e.target.checked, "allSelected")}
//                                   className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-green-800 focus:ring-2"
//                                 />
//                                 <label htmlFor="1" className="ms-2 text-sm font-bold text-gray-900">
//                                   Select All
//                                 </label>
//                               </div>
//                             </li>
//                             <li key={2}>
//                               <div className="flex items-center px-2">
//                                 <input
//                                   id="2"
//                                   type="checkbox"
//                                   checked={allergensSelection?.clear}
//                                   onChange={(e) => handleAllergens(0, "", e.target.checked, "clear")}
//                                   className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-green-800 focus:ring-2"
//                                 />
//                                 <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
//                                   Clear All
//                                 </label>
//                               </div>
//                             </li>
//                             {allergensListOptions?.map((option) => (
//                               <li key={option.allergen}>
//                                 <div className="flex items-center px-2">
//                                   <input
//                                     id={String(option.allergen)}
//                                     type="checkbox"
//                                     checked={option.state}
//                                     onChange={(e) => handleAllergens(option.id, option.allergen, e.target.checked, "normal")}
//                                     className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-green-800 focus:ring-2"
//                                   />
//                                   <label htmlFor={String(option.allergen)} className="ms-2 text-sm font-medium text-gray-900">
//                                     {option.allergen}
//                                   </label>
//                                 </div>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//               {/* The simple checkboxes can be grouped */}
//         <div className="flex w-full flex-col items-start gap-1">
//              <div className="flex gap-2"><input id="highProtein" type="checkbox" checked={prefs.highProtein} onChange={(e) => prefs.setHighProtein(e.target.checked)} className=" accent-green-800"/><label htmlFor="highProtein" className="text-black">High Protein</label></div>
//              <div className="flex gap-2"><input id="lowCalorie" type="checkbox" checked={prefs.lowCalorie} onChange={(e) => prefs.setLowCalorie(e.target.checked)} className=" accent-green-800"/><label htmlFor="lowCalorie" className="text-black">Low Calorie</label></div>
//             </div>  
//            </div>
//             </div>












//Creation code
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });
  //routes
  // const createIngredients = api.recipe.createIngredients.useMutation();
  // const createDietTypes = api.recipe.createDietTypes.useMutation();
  // const createAllergens = api.recipe.createAllergens.useMutation();
  // //const createRecipes = api.recipe.createRecipes.useMutation();
  // const getAllIngredients = api.recipe.getAllIngredients.useQuery();
  // const getAllAllergens = api.recipe.getAllAllergens.useQuery();
  // const getAllDietTypes = api.recipe.getAllDietTypes.useQuery();

//   //------------------ Create Ingredients --------------------
//   const ingredients = ['Butter', 'Garlic', 'Olive Oil', 'Onions', 'Salt', 'Eggs', 'Water', 'Sugar', 'Milk', 'Potatoes', 'Flour', 'Pepper', 'Carrots', 'Caster Sugar', 'Parsley', 'Vegetable Oil', 'Soy Sauce', 'Garlic Clove', 'Bay Leaves', 'Coriander', 'Lemon', 'Ginger', 'Tomato Puree', 'Paprika', 'Spring Onions', 'Thyme', 'Chicken Stock', 'Cinnamon', 'Cumin', 'Double Cream', 'Tomatoes', 'Beef', 'Baking Powder', 'Mushrooms', 'Red Pepper', 'Lime', 'Oil', 'Bread', 'Celery', 'Bacon', 'Lemon Juice', 'Icing Sugar', 'Black Pepper', 'Vanilla Extract', 'Egg Yolks', 'Vegetable Stock', 'Beef Stock', 'Allspice', 'Chicken', 'Red Chilli', 'Parmesan', 'Nutmeg', 'Self-raising Flour', 'Red Onions', 'Pork', 'Rice', 'White Wine', 'Sour Cream', 'Breadcrumbs', 'Cabbage', 'Brown Sugar', 'Rosemary', 'Sunflower Oil', 'Leek', 'Mint', 'Sesame Seed Oil', 'Worcestershire Sauce', 'Coconut Milk', 'Corn Flour', 'Cardamom', 'Minced Beef', 'Basil', 'Honey', 'Orange', 'Chicken Breasts', 'Muscovado Sugar', 'Greek Yogurt', 'Puff Pastry', 'Red Wine', 'Cornstarch', 'Cucumber', 'White Wine Vinegar', 'Dill', 'Prawns', 'Spinach', 'Shallots', 'Cayenne Pepper', 'Fennel', 'Green Chilli', 'Mustard', 'Cloves', 'Sausages', 'Yeast', 'Hotsauce', 'Garlic Powder', 'Garam Masala', 'Harissa Spice', 'Sea Salt', 'Cream Cheese', 'Red Wine Vinegar', 'Dry White Wine', 'Courgettes/Zucchinis', 'Vinegar', 'Peanuts', 'Lamb', 'Saffron', 'Peanut Butter', 'Turmeric', 'Cinnamon Stick', 'Creme Fraiche', 'Black Treacle', 'Almonds', 'Cherry Tomatoes', 'Salmon', 'Black Olives', 'Mayonnaise', 'Green Pepper', 'Cannellini Beans', 'Cumin Seeds', 'Heavy Cream', 'Chickpeas', 'Vanilla', 'Basmati Rice', 'Egg Plants/Aubergine', 'Peas', 'Digestive Biscuits', 'Unsalted Butter', 'Chicken Thighs', 'Tamarind Paste', 'English Mustard', 'Beef Brisket', 'Broccoli', 'Rapeseed Oil', 'Raspberries', 'Starch', 'Oyster Sauce', 'Egg White', 'Chilli Powder', 'Avocado', 'Brandy', 'Basil Leaves', 'Dark Chocolate', 'Shortcrust Pastry', 'Kale', 'Mozzarella', 'Strawberries', 'Yellow Pepper', 'Chives', 'Dried Oregano', 'Salted Butter', 'Ground Almonds', 'Blackberries', 'Beef Fillet', 'Oregano', 'Tomato Ketchup', 'Suet', 'Green Beans', 'Minced Garlic', 'Bicarbonate Of Soda', 'Golden Syrup', 'Red Pepper Flakes/Red Chilli Flakes', 'Macaroni', 'Lettuce', 'Ham', 'Custard', 'Feta', 'Gruyère', 'Fish Stock', 'Kidney Beans', 'Curry Powder', 'Sage', 'Chilli', 'Brown Lentils', 'Lamb Mince', 'Almond Extract', 'Flaked Almonds', 'Braeburn Apples', 'Demerara Sugar', 'Chorizo', 'Plum Tomatoes', 'Banana', 'Pecan Nuts', 'Swede', 'Celeriac', 'Noodles', 'Ricotta', 'Maple Syrup', 'Ground Beef', 'Cheese', 'Onion Salt', 'Marjoram', 'Star Anise', 'Coconut Cream', 'White Vinegar', 'Cheddar Cheese', 'Smoked Paprika', 'Sake', 'Chicken Legs', 'King Prawns', 'Passata', 'Whole Milk', 'Light Brown Soft Sugar', 'Cocoa', 'Walnuts', 'Dried Fruit', 'Single Cream', 'Raisins', 'Lentils', 'Mascarpone', 'Currants', 'Small Potatoes', 'Celery Salt', 'Cilantro', 'Pita Bread', 'Rice Vinegar', 'Mussels', 'Broad Beans', 'Tofu', 'Sushi Rice', 'Mirin', 'Smoked Haddock', 'Fish Sauce', 'Lasagne Sheets', 'Tuna', 'Anchovy Fillet', 'Spaghetti', 'Rocket', 'Baguette', 'Bramley Apples', 'Ice Cream', 'Raspberry Jam', 'Red Chilli Powder', 'Coriander Leaves/Cilantro', 'Balsamic Vinegar', 'Tomato Sauce', 'Butter Beans', 'Yogurt', 'Apricot', 'Goose Fat', 'Chestnut Mushroom', 'Bean Sprouts', 'Barbeque Sauce', 'Sesame Seed Burger Buns', 'Sauerkraut', 'Filo Pastry', 'Beetroot', 'Buckwheat', 'Corn Tortillas', 'Granulated Sugar', 'Christmas Pudding', 'Ginger Paste', 'Cream', 'Squash', 'White Fish', 'Shredded Mexican Cheese', 'Jalapeno', 'Linguine Pasta', 'Clams', 'Mustard Powder', 'Sweetcorn', 'Couscous', 'Cacao', 'Dark Brown Soft Sugar', 'Milk Chocolate', 'Ginger Cordial', 'Cashew Nuts', 'Candied Peel', 'Grand Marnier', 'Glace Cherry', 'Italian Fennel Sausages', 'Shiitake Mushrooms', 'Quinoa', 'Pickle Juice', 'Pork Chops', 'Minced Pork', 'Lamb Shoulder', 'Garlic Sauce', 'Sesame Seed', 'Ghee', 'Apricot Jam', 'Duck Legs', 'Mixed Peel', 'Black Pudding', 'Scotch Bonnet', 'Ground Pork', 'Floury Potatoes', 'Jerusalem Artichokes', 'Fettuccine', 'Lard', 'Haddock', 'Sardines', 'Cod', 'Kosher Salt', 'Chocolate Chips', 'Condensed Milk', 'White Chocolate Chips', 'Miniature Marshmallows', 'Water Chestnut', 'Pumpkin', 'Canola Oil', 'Fennel Bulb', 'Lamb Leg', 'Butternut Squash', 'Mozzarella Balls', 'Lamb Kidney', 'Scallions', 'Chinese Broccoli', 'Lemon Zest', 'Rice Stick Noodles', 'Fennel Seeds', 'Blueberries', 'Ground Ginger', 'Tiger Prawns', 'Pecorino', 'Apple Cider Vinegar', 'Pine Nuts', 'Frozen Peas', 'Ground Cumin', 'Pretzels', 'Cooking Wine', 'Rice Wine', 'Sultanas', 'Parma Ham', 'Ancho Chillies', 'Dark Brown Sugar', 'Borlotti Beans', 'Stilton Cheese', 'Stout', 'Oysters', 'Hazelnuts', 'Pink Food Colouring', 'Marzipan', 'Beef Shin', 'Bouquet Garni', 'Brie', 'Prosciutto', 'Dark Rum', 'Iceberg Lettuce', 'Dill Pickles', 'Kielbasa', 'Caraway Seed', 'Beef Stock Concentrate', 'Enchilada Sauce', 'Shredded Monterey Jack Cheese', 'Rolled Oats', 'Coriander Seeds', 'Turmeric Powder', 'Fenugreek', 'Farfalle/Bowtie Pasta', 'Fajita Seasoning', 'Cajun', 'Flour Tortilla', 'Little Gem Lettuce', 'Salsa', 'Vinaigrette Dressing', 'Refried Beans', 'Hard Taco Shells', 'Grape Tomatoes', 'Green Salsa', 'Potato Starch', 'Sugar Snap Peas', 'Fromage Frais', 'Dried Apricots', 'Dark Chocolate Chips', 'Tinned Tomatoes', 'White Flour', 'Red Wine Jelly', 'Sun-dried Tomatoes', 'Mars Bar', 'Rice Krispies', 'Orange Blossom Water', 'Sherry', 'Mixed Spice', 'Rose Water', 'Cider', 'Toor Dal', 'Mustard Seeds', 'Meringue Nests', 'Red Snapper', 'Malt Vinegar', 'Semi-skimmed Milk', 'White Fish Fillets', 'French Lentils', 'Clotted Cream', 'Baked Beans', 'Tarragon Leaves', 'Raw King Prawns', 'Cubed Feta Cheese', 'Monterey Jack Cheese', 'Colby Jack Cheese', 'Duck Sauce', 'Gochujang', 'Wood Ear Mushrooms', 'Fruit Mix', 'Whole Wheat', 'Lamb Loin Chops', 'Turnips', 'Charlotte Potatoes', 'Fries', 'Doner Meat', 'Gouda Cheese', 'Ras El Hanout', 'Shortening', 'Vine Leaves', 'Khus Khus', 'Ginger Garlic Paste', 'Full Fat Yogurt', 'Biryani Masala', 'Madras Paste', 'Thai Red Curry Paste', 'Rice Noodles', 'Bulgur Wheat', 'Bun', 'Prunes', 'Baby Plum Tomatoes', 'Extra Virgin Olive Oil', 'Green Olives', 'Massaman Curry Paste', 'Jasmine Rice', 'Chestnuts', 'Wild Mushrooms', 'Truffle Oil', 'Paneer', 'Naan Bread', 'Doubanjiang', 'Fermented Black Beans', 'Sichuan Pepper', 'Goat Meat', 'Mincemeat', 'Mulukhiyah', 'Desiccated Coconut', 'Custard Powder', 'Veal', 'Orange Zest', 'Oxtail', 'Dark Soy Sauce', 'Peanut Oil', 'Beef Gravy', 'Cheese Curds', 'Pilchards', 'Haricot Beans', 'Peanut Cookies', 'Gelatine Leafs', 'Peanut Brittle', 'Peaches', 'Oatmeal', 'Pears', 'Creamed Corn', 'Ciabatta', 'Squid', 'Pitted Black Olives', 'Rigatoni', 'Mackerel', 'Tamarind Ball', 'Canned Tomatoes', 'Wholegrain Bread', 'Baby Aubergine', 'Paella Rice', 'Jam', 'Lean Minced Beef', 'Penne Rigate', 'Italian Seasoning', 'Parmigiano-reggiano', 'Medjool Dates', 'Asparagus', 'Caramel', 'Caramel Sauce', 'Toffee Popcorn', 'Vermicelli Pasta', 'Monkfish', 'Baby Squid', 'Vine Tomatoes', 'Redcurrants', 'Dijon Mustard', 'Tabasco Sauce', 'Salt Cod', 'Ackee', 'English Muffins', 'Smoked Salmon', 'Apples', 'Rhubarb', 'Herring', 'Black Beans', 'Stir-fry Vegetables', 'Brown Rice', 'Thai Green Curry Paste', 'Thai Fish Sauce', 'Horseradish', 'Turkey Mince', 'Capers', 'Tahini', 'Goats Cheese', 'Green Red Lentils', 'Vegan Butter', 'Soya Milk', 'Coco Sugar', 'Flax Eggs', 'Almond Milk', 'Rice Vermicelli', 'Egg Rolls', 'Paccheri Pasta', 'Roasted Vegetables', 'Mixed Grain', 'Wonton Skin', 'Udon Noodles'];
//   const handleCreateIngredients = () => {

//   // Set a manageable size for each batch
//   const batchSize = 50;

//   console.log(`Starting to create ${ingredients.length} ingredients in batches of ${batchSize}...`);

//   // Loop through the ingredients array, taking a "slice" of `batchSize` each time
//   for (let i = 0; i < ingredients.length; i += batchSize) {
//     const batch = ingredients.slice(i, i + batchSize);

//     // Use a setTimeout to add a small delay between requests. This is good practice
//     // to avoid overwhelming the server with simultaneous requests.
//     setTimeout(() => {
//       console.log(`Sending batch starting with: ${batch[0]}`);
      
//       // Call mutate for each smaller batch
//       createIngredients.mutate(
//         { name: batch },
//         {
//           onSuccess: (data) => {
//             // This is the correct way to know a batch succeeded
//             console.log(`Successfully created batch of ${data.count} ingredients!`);
//           },
//           onError: (error) => {
//             // This will catch and log tRPC errors properly
//             console.error(`Failed to create batch starting with: ${batch[0]}`, error);
//           },
//         }
//       );
//     }, i * 20); // 0ms, 1000ms, 2000ms delay etc. (adjust delay as needed)
//   }
// };

//-----------------------Create Allergens--------------------
// //const allergensList_ = ['Wheat', 'Milk', 'Eggs', 'Sulfur Dioxide', 'Celery', 'Soybeans', 'Fish', 'Tree Nuts', 'Mustard', 'Sesame', 'Crustacean Shellfish', 'Peanuts', 'Molluscs'];
// const allergensList_ = ['Lupin'];
//   const handleCreateAllergens = () => {
//     createAllergens.mutate({ name: allergensList_ });
//     console.log("Allergens created successfully");
//   };

//-----------------------Create DietTypes-------------------
  //const allergensList_ = ['Wheat', 'Milk', 'Eggs', 'Sulfur Dioxide', 'Celery', 'Soybeans', 'Fish', 'Tree Nuts', 'Mustard', 'Sesame', 'Crustacean Shellfish', 'Peanuts', 'Molluscs'];
//const dietTypesList_ = ['None', 'Pescatarian', 'Pollotarian', 'Vegetarian', 'Vegan'];
// const dietTypesList_ = ['Halal', 'Keto'];
//   const handleCreateDietTypes = () => {
//     createDietTypes.mutate({ name: dietTypesList_ });
//     console.log("Diet Types created successfully");
//   };


// //-------------------------get all ingredients-----------------
// const handleGetAllIngredients = () => {
//   console.log("Ingredients: ", getAllIngredients.data?.map((ingredient) => ({ name: ingredient.name, id: ingredient.id })))
// }

// //-------------------------get all allergens-----------------
// const handleGetAllAllergens = () => {
//   console.log("Allergens: ", getAllAllergens.data?.map((allergen) => ({ name: allergen.name, id: allergen.id })));
// }

// //-------------------------get all diettypes-----------------
// const handleGetAllDietTypes = () => {
//   console.log("DietTypes: ", getAllDietTypes.data?.map((dietType) => ({ name: dietType.name, id: dietType.id })));
// }

// //--------------------------Create recipes---------------------------
// const [statusMessage, setStatusMessage] = useState("");

//   const { mutate, isPending } = api.recipe.createManyRecipes.useMutation({
//     onSuccess: (data) => {
//       setStatusMessage(`✅ Success! ${data.count} recipes were created.`);
//       console.log("Successfully created recipes:", data);
//     },
//     onError: (error) => {
//       setStatusMessage(`❌ Error: ${error.message}`);
//       console.error("Failed to create recipes:", error);
//     },
//   });

//   const handleSeedDatabase = () => {
//     setStatusMessage("🚀 Seeding database with recipes...");
//     // The entire array is sent in one go!
//     mutate({ recipes: recipesToSeed });
//   };

//front end seeding button for recipes at the beginning
// {/* <button
//         onClick={handleSeedDatabase}
//         disabled={isPending}
//         className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
//       >
//         {isPending ? "Seeding..." : `Seed ${recipesToSeed.length} Recipes`}
//       </button>

//       {statusMessage && (
//         <div className="mt-4 w-full max-w-md rounded-md bg-gray-100 p-4 text-center font-mono">
//           <p>{statusMessage}</p>
//         </div>
//       )}                 */}



























//Startup code
// <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
//         <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
//           <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
//             Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
//           </h1>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
//               href="https://create.t3.gg/en/usage/first-steps"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">First Steps →</h3>
//               <div className="text-lg">
//                 Just the basics - Everything you need to know to set up your
//                 database and authentication.
//               </div>
//             </Link>
//             <Link
//               className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
//               href="https://create.t3.gg/en/introduction"
//               target="_blank"
//             >
//               <h3 className="text-2xl font-bold">Documentation →</h3>
//               <div className="text-lg">
//                 Learn more about Create T3 App, the libraries it uses, and how
//                 to deploy it.
//               </div>
//             </Link>
//           </div>
//           <div className="flex flex-col items-center gap-2">
//             <p className="text-2xl text-white">
//               {/* {hello.data ? hello.data.greeting : "Loading tRPC query..."} */}
//             </p>
//             <AuthShowcase />
//           </div>
//         </div>
//       </main>

// function AuthShowcase() {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = api.post.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined },
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => void signOut() : () => void signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// }
