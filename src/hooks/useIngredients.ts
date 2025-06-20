// src/hooks/useIngredients.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

interface Ingredient {
  id: number;
  name: string;
}
type AnonIngredientCount = Record<string, number>; // Keys from JS objects are strings
const ANON_COUNTS_KEY = 'anonymousIngredientCounts';

export function useIngredients() {
  const { status: sessionStatus } = useSession();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  // State to hold the input for the anonymous query
  const [anonCountsInput, setAnonCountsInput] = useState<AnonIngredientCount | null>(null);

  // Query for logged-in users (unchanged)
  const personalizedQuery = api.recipe.getPersonalizedTopIngredients.useQuery(undefined, { 
      enabled: sessionStatus === 'authenticated',
      // === THE FIX ===
      // Tell React Query to consider the data fresh for 5 minutes.
      // It will not refetch on window focus or re-mount during this time.
      staleTime: 1000 * 60 * 60, // 1 hour in milliseconds 
  });

  // Query for anonymous users. It's enabled only when we have the input data.
  const anonymousQuery = api.recipe.getAnonymousTopIngredients.useQuery(
    { counts: anonCountsInput ?? {} },
    { enabled: sessionStatus === 'unauthenticated' && anonCountsInput !== null,
      // === THE FIX ===
      // Tell React Query to consider the data fresh for 5 minutes.
      // It will not refetch on window focus or re-mount during this time.
      staleTime: 1000 * 60 * 60, // 1 hour in milliseconds
     }
  );

  // This single useEffect now handles the initial data-loading decision
  useEffect(() => {
    // We only need to do something for the unauthenticated case here:
    // read from localStorage and set the input state to trigger the query.
    if (sessionStatus === 'unauthenticated') {
      try {
        const countsRaw = localStorage.getItem(ANON_COUNTS_KEY);
        const counts: AnonIngredientCount = countsRaw ? (JSON.parse(countsRaw) as AnonIngredientCount) : {};
        setAnonCountsInput(counts);
      } catch {
        setAnonCountsInput({}); // If parsing fails, use an empty object
      }
    }
  }, [sessionStatus]);

  // Effect to update state when personalized data arrives
  useEffect(() => {
    if (personalizedQuery.data) {
      setIngredients(personalizedQuery.data);
    }
  }, [personalizedQuery.data]);

  // Effect to update state when anonymous data arrives
  useEffect(() => {
    if (anonymousQuery.data) {
      setIngredients(anonymousQuery.data.filter((ingredient) => ingredient != undefined).map((ingredient) => ({name: ingredient?.name, id: ingredient?.id})));
    }
  }, [anonymousQuery.data]);

  const isLoading = personalizedQuery.isFetching || anonymousQuery.isFetching || (sessionStatus === 'loading');

  const addIngredientToList = (ingredient: { id: number; name: string }, selectedIds: Set<number>) => {
    setIngredients(prevIngredients => {
      // If already in list, just move to front
      if (prevIngredients.some(i => i.id === ingredient.id)) {
        const otherIngredients = prevIngredients.filter(i => i.id !== ingredient.id);
        return [ingredient, ...otherIngredients];
      }

      const listToModify = [...prevIngredients];
      
      // If list is full (assuming 18 is the limit), remove one
      if (listToModify.length >= 18) {
        let indexToRemove = -1;

        // Find the last unselected ingredient by searching from the end
        for (let i = listToModify.length - 1; i >= 0; i--) {
            if (!selectedIds.has(listToModify[i]!.id)) {
                indexToRemove = i;
                break;
            }
        }
        
        // If all are selected, remove the very last one
        if (indexToRemove === -1) {
            indexToRemove = listToModify.length - 1;
        }

        listToModify.splice(indexToRemove, 1);
      }
      
      // Add the new ingredient to the beginning
      return [ingredient, ...listToModify];
    });
  };
  // const addIngredientToList = (ingredient: Ingredient) => {
  //   setIngredients(prevIngredients => {
  //     // Check if the ingredient is already in the list to avoid duplicates
  //     if (prevIngredients.some(i => i.id === ingredient.id)) {
  //       return prevIngredients;
  //     }
  //     // Add the new ingredient to the beginning of the list
  //     return [ingredient, ...prevIngredients];
  //   });
  // };

  return {
    ingredients,
    isLoading,
    addIngredientToList
  };
}






// // old code that had infinite loop
// // src/hooks/useIngredients.ts
// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { api } from "~/utils/api";

// interface Ingredient {
//   id: number;
//   name: string;
// }
// type AnonIngredientCount = Record<number, number>;

// const ANON_COUNTS_KEY = 'anonymousIngredientCounts';
// const INGREDIENTS_LIMIT = 18;

// export function useIngredients() {
//   const { status: sessionStatus } = useSession();
//   const [ingredients, setIngredients] = useState<Ingredient[]>([]);

//   // Query for logged-in users (unchanged)
//   const personalizedQuery = api.recipe.getPersonalizedTopIngredients.useQuery(undefined, { enabled: false });
//   // Query for the GLOBAL popular list (used as a base for anonymous users)
//   const anonymousBaseQuery = api.recipe.getAnonymousTopIngredients.useQuery(undefined, { enabled: false });

//   // Initial data loading logic
//   useEffect(() => {
//     if (sessionStatus === 'loading') return;

//     if (sessionStatus === 'authenticated') {
//       console.log("User is logged in. Fetching personalized ingredients.");
//       void personalizedQuery.refetch();
//     } else { // 'unauthenticated'
//       console.log("User is not logged in. Fetching global ingredients list to personalize on client.");
//       void anonymousBaseQuery.refetch();
//     }
//   }, [sessionStatus, personalizedQuery, anonymousBaseQuery]);

//   // Effect for LOGGED-IN user data
//   useEffect(() => {
//     if (personalizedQuery.data) {
//       console.log("Received personalized ingredients from DB.");
//       setIngredients(personalizedQuery.data);
//     }
//   }, [personalizedQuery.data]);

//   // Effect for ANONYMOUS user data (this is the new complex logic)
//   useEffect(() => {
//     if (anonymousBaseQuery.data) {
//       console.log("Received global ingredients list. Merging with local data.");
      
//       // 1. Get the globally popular list from the tRPC query
//       const globalList = anonymousBaseQuery.data.filter((item): item is Ingredient => !!item);
      
//       // 2. Get the user's "personal" list from localStorage
//       let anonymousPersonalList: Ingredient[] = [];
//       try {
//         const countsRaw = localStorage.getItem(ANON_COUNTS_KEY);
//         const counts: AnonIngredientCount = countsRaw ? (JSON.parse(countsRaw) as AnonIngredientCount) : {};
        
//         // Sort the user's ingredients by count, descending
//         const sortedPersonalIds = Object.keys(counts)
//           .map(Number)
//           .sort((a, b) => counts[b]! - counts[a]!);
          
//         // We need to map these IDs back to full ingredient objects.
//         // The easiest way is to find them within our `globalList`.
//         const globalListMap = new Map(globalList.map(ing => [ing.id, ing]));
//         anonymousPersonalList = sortedPersonalIds
//           .map(id => globalListMap.get(id))
//           .filter((item): item is Ingredient => !!item);

//       } catch (error) {
//         console.error("Could not process anonymous ingredient counts:", error);
//       }
      
//       // 3. Combine the lists, ensuring uniqueness and preserving order
//       const combinedList = [...anonymousPersonalList];
//       const personalIngredientIds = new Set(anonymousPersonalList.map(i => i.id));

//       for (const ingredient of globalList) {
//         if (combinedList.length >= INGREDIENTS_LIMIT) break;
//         if (!personalIngredientIds.has(ingredient.id)) {
//           combinedList.push(ingredient);
//         }
//       }
      
//       setIngredients(combinedList);
//     }
//   }, [anonymousBaseQuery.data]);

//   const isLoading = personalizedQuery.isFetching || anonymousBaseQuery.isFetching || sessionStatus === 'loading';

//   return {
//     ingredients,
//     isLoading,
//   };
// }


// // old code
// // src/hooks/useIngredients.ts

// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { api } from "~/utils/api";

// interface Ingredient {
//   id: number;
//   name: string;
// }

// const LOCAL_STORAGE_KEY = 'topIngredients';

// export function useIngredients() {
//   const { data: sessionData, status: sessionStatus } = useSession();
//   const [ingredients, setIngredients] = useState<Ingredient[]>([]);

//   // We now have two distinct queries
//   const personalizedQuery = api.recipe.getPersonalizedTopIngredients.useQuery(undefined, { enabled: false });
//   const anonymousQuery = api.recipe.getAnonymousTopIngredients.useQuery(undefined, { enabled: false });

//   useEffect(() => {
//     if (sessionStatus === 'loading') {
//       return; // Wait until session status is resolved
//     }

//     const isUserLoggedIn = sessionStatus === 'authenticated';
//     const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

//     if (isUserLoggedIn) {
//       console.log("User is logged in. Fetching personalized ingredients.");
//       void personalizedQuery.refetch();
//     } else { // User is unauthenticated
//       if (localData) {
//         console.log("Using cached anonymous ingredients from localStorage.");
//         console.log("Ingredients: ", ingredients);
//         try {
//           setIngredients(JSON.parse(localData) as Ingredient[]);
//         } catch (error) {
//           console.error("Failed to parse local data, fetching fresh.", error);
//           localStorage.removeItem(LOCAL_STORAGE_KEY);
//           void anonymousQuery.refetch();
//         }
//       } else {
//         console.log("Fetching anonymous top ingredients.");
//         void anonymousQuery.refetch();
//       }
//     }
//   }, [sessionStatus]); // Rerun this logic when the user logs in or out

//   // Effect to handle data from the personalized query
//   useEffect(() => {
//     if (personalizedQuery.data) {
//       console.log("Received personalized ingredients.");
//       setIngredients(personalizedQuery.data);
//       // We don't cache personalized data in localStorage as it's user-specific
//       // and we want it to be fresh.
//     }
//   }, [personalizedQuery.data]);

//   // Effect to handle data from the anonymous query
//   useEffect(() => {
//     if (anonymousQuery.data) {
//       console.log("Received anonymous ingredients.");
//       setIngredients(anonymousQuery.data.filter((item): item is Ingredient => item !== undefined)); //Make sure no undefined ingredients
//       // Cache the anonymous data for other logged-out users
//       try {
//         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(anonymousQuery.data));
//       } catch (error) {
//         console.error("Failed to save anonymous ingredients to localStorage", error);
//       }
//     }
//   }, [anonymousQuery.data]);

//   const isLoading = personalizedQuery.isFetching || anonymousQuery.isFetching || (sessionStatus === 'loading');

//   return {
//     ingredients,
//     isLoading,
//   };
// }









// //old old code
// // src/hooks/useIngredients.ts

// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { api } from "~/utils/api";

// // Define the type for an ingredient for strong typing
// interface Ingredient {
//   id: number;
//   name: string;
// }

// const LOCAL_STORAGE_KEY = 'topIngredients';

// export function useIngredients() {
//   const { data: sessionData, status: sessionStatus } = useSession();
//   const [ingredients, setIngredients] = useState<Ingredient[]>([]);

//   // Use the tRPC query hook, but disable it initially.
//   // We will only enable it when we need to fetch from the server.
//   const { data: fetchedIngredients, refetch } = api.recipe.getTopIngredients.useQuery(
//     undefined, // no input
//     {
//       enabled: false, // IMPORTANT: Do not fetch automatically on component mount
//       //staleTime: Infinity, // The data is static, so it never becomes stale
//      // cacheTime: Infinity, // Keep the data in the React Query cache forever
//     }
//   );

//   useEffect(() => {
//     // This effect runs when the session status or fetched data changes.
//     // sessionStatus can be 'loading', 'authenticated', or 'unauthenticated'.

//     if (sessionStatus === 'loading') {
//       // Don't do anything while we're waiting to see if the user is logged in.
//       return;
//     }

//     // USER STORY LOGIC:
//     // Load from server if:
//     // 1. User is logged in (authenticated)
//     // 2. User is NOT logged in AND there's no data in localStorage
    
//     const isUserLoggedIn = sessionStatus === 'authenticated';
//     const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

//     if (isUserLoggedIn) {
//       console.log("User is logged in. Fetching fresh ingredients from server.");
//       void refetch(); // `refetch` returns a promise, void it if not awaiting
//     } else { // User is unauthenticated
//       if (localData) {
//         console.log("User not logged in, but found data in localStorage. Using local data.");
//         try {
//           const parsedData = JSON.parse(localData) as Ingredient[];
//           setIngredients(parsedData);
//         } catch (error) {
//           console.error("Failed to parse ingredients from localStorage", error);
//           localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
//           console.log("Corrupted data cleared. Fetching from server as a fallback.");
//           void refetch();
//         }
//       } else {
//         console.log("User not logged in and no local data. Fetching from server.");
//         void refetch();
//       }
//     }
//   }, [sessionStatus, refetch]); // Depend on sessionStatus to re-evaluate

//   useEffect(() => {
//     // This effect runs ONLY when new data is fetched from the tRPC query.
//     if (fetchedIngredients) {
//       console.log("New ingredients fetched from server. Updating state and localStorage.");
//       setIngredients(fetchedIngredients);
      
//       // Cache the newly fetched data in localStorage for next time.
//       try {
//         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fetchedIngredients));
//       } catch (error) {
//         console.error("Failed to save ingredients to localStorage", error);
//       }
//     }
//   }, [fetchedIngredients]);

//   return {
//     ingredients,
//     isLoading: sessionStatus === 'loading' && ingredients.length === 0,
//   };
// }