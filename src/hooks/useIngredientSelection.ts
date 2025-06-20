// src/hooks/useIngredientSelection.ts
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

const SELECTED_IDS_KEY = 'selectedIngredients';
const ANON_COUNTS_KEY = 'anonymousIngredientCounts'; // <-- NEW KEY

// Define the shape of our local storage counts object
type AnonIngredientCount = Record<number, number>; // e.g., { 5: 3, 22: 1 }

export function useIngredientSelection() {
  const { status: sessionStatus } = useSession();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  const updateCountsMutation = api.user.updateUserIngredientCounts.useMutation();

  // Load initial selected checkboxes from localStorage
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    const localData = localStorage.getItem(SELECTED_IDS_KEY);
    if (localData) {
      try {
        setSelectedIds(new Set(JSON.parse(localData) as number[]));
      } catch { /* ignore */ }
    }
  }, [sessionStatus]);

  // Save selected checkboxes to localStorage on change
  useEffect(() => {
    localStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(Array.from(selectedIds)));
  }, [selectedIds]);

  const toggleIngredient = useCallback((id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);
  
  // This function now handles both logged-in and logged-out cases
  const saveSelection = useCallback(() => {
    if (selectedIds.size === 0) return;
    
    if (sessionStatus === 'authenticated') {
      // LOGGED-IN: Save to database via tRPC
      const ingredientIds = Array.from(selectedIds);
      updateCountsMutation.mutate({ ingredientIds }, {
        onSuccess: () => console.log("Ingredient counts updated in DB!"),
      });
    } else if (sessionStatus === 'unauthenticated') {
      // LOGGED-OUT: Save to localStorage
      console.log("Updating anonymous ingredient counts in localStorage.");
      try {
        const existingCountsRaw = localStorage.getItem(ANON_COUNTS_KEY);
        const existingCounts: AnonIngredientCount = existingCountsRaw ? JSON.parse(existingCountsRaw) as AnonIngredientCount : {};
        
        for (const id of selectedIds) {
          existingCounts[id] = (existingCounts[id] ?? 0) + 1;
        }
        
        localStorage.setItem(ANON_COUNTS_KEY, JSON.stringify(existingCounts));
      } catch (error) {
        console.error("Failed to update anonymous ingredient counts:", error);
      }
    }
  }, [sessionStatus, selectedIds, updateCountsMutation]);

  return {
    selectedIds,
    toggleIngredient,
    saveSelection, // <-- Renamed for clarity
    isSaving: updateCountsMutation.isPending,
  };
}

// // src/hooks/useIngredientSelection.ts
// import { useState, useEffect, useCallback } from "react";
// import { useSession } from "next-auth/react";
// import { api } from "~/utils/api";

// const LOCAL_STORAGE_KEY = 'selectedIngredients';

// export function useIngredientSelection() {
//   const { status: sessionStatus } = useSession();
//   const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
// //   // Use a query to get the user's initial ingredients if they are logged in.
// //   // This helps pre-select ingredients they've used before.
// //   const { data: userIngredients } = api.user.getInitialIngredients.useQuery(undefined, {
// //       enabled: sessionStatus === 'authenticated',
// //   });
  
//   const updateCountsMutation = api.user.updateUserIngredientCounts.useMutation();

//   // Effect to hydrate the initial state from DB (if logged in) or localStorage
//   useEffect(() => {
//     if (sessionStatus === 'loading') return;

//     // We don't need initial state from DB for this feature, but you could add it.
//     // Let's just load from localStorage regardless of login status.
//     const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
//     if (localData) {
//       try {
//         const parsedIds = JSON.parse(localData) as number[];
//         setSelectedIds(new Set(parsedIds));
//       } catch {
//         setSelectedIds(new Set());
//       }
//     }
//   }, [sessionStatus]);

//   // Effect to automatically save to localStorage whenever the selection changes
//   useEffect(() => {
//     const idsArray = Array.from(selectedIds);
//     console.log("Selected ingredient Ids: ", selectedIds);
//     localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(idsArray));
//   }, [selectedIds]);

//   // A handler to toggle an ingredient's selection state
//   const toggleIngredient = useCallback((id: number) => {
//     setSelectedIds(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(id)) {
//         newSet.delete(id);
//       } else {
//         newSet.add(id);
//       }
//       return newSet;
//     });
//   }, []);
  
//   // Function to be called to save the selection to the database
//   const saveSelectionToDb = useCallback(() => {
//     if (sessionStatus === 'authenticated' && selectedIds.size > 0) {
//       const ingredientIds = Array.from(selectedIds);
//       updateCountsMutation.mutate({ ingredientIds }, {
//         onSuccess: () => console.log("Ingredient counts updated in DB!"),
//         onError: (err) => console.error("Failed to update ingredient counts:", err),
//       });
//     }
//   }, [sessionStatus, selectedIds, updateCountsMutation]);

//   return {
//     selectedIds,
//     toggleIngredient,
//     saveSelectionToDb,
//     isSaving: updateCountsMutation.isPending,
//   };
// }