// src/hooks/useFavourites.ts
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

const LOCAL_KEY = 'favouriteRecipes';

export function useFavourites() {
  const { data: session } = useSession();
  const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());

  // Use the new tRPC mutations
  const addFavouriteMutation = api.user.addFavourite.useMutation();
  const removeFavouriteMutation = api.user.removeFavourite.useMutation();

  // Hydrate from localStorage on initial load
  useEffect(() => {
    // ... (this part is already correct)
    try {
      const localData = localStorage.getItem(LOCAL_KEY);
      if (localData) {
        setFavouriteIds(new Set(JSON.parse(localData) as number[]));
      }
    } catch { /* ignore */ }
  }, []);

  const toggleFavourite = useCallback((recipeId: number) => {
    // Optimistic UI update: update the state immediately
    const newSet = new Set(favouriteIds);
    if (newSet.has(recipeId)) {
      newSet.delete(recipeId);
      // If logged in, call the remove mutation
      if (session) {
        removeFavouriteMutation.mutate({ recipeId });
      }
    } else {
      newSet.add(recipeId);
      // If logged in, call the add mutation
      if (session) {
        addFavouriteMutation.mutate({ recipeId });
      }
    }
    setFavouriteIds(newSet);
    // Always update localStorage for both logged-in and logged-out users
    localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(newSet)));
  }, [favouriteIds, session, addFavouriteMutation, removeFavouriteMutation]);

  return { favouriteIds, toggleFavourite };
}




// // src/hooks/useFavourites.ts
// import { useState, useEffect, useCallback } from "react";
// import { useSession } from "next-auth/react";
// import { api } from "~/utils/api";

// const LOCAL_KEY = 'favouriteRecipes';

// export function useFavourites() {
//   const { data: session } = useSession();
//   const [favouriteIds, setFavouriteIds] = useState<Set<number>>(new Set());

//   // TODO: Create these tRPC mutations
//   // const addFavouriteMutation = api.user.addFavourite.useMutation();
//   // const removeFavouriteMutation = api.user.removeFavourite.useMutation();

//   // Hydrate from localStorage on initial load
//   useEffect(() => {
//     const localData = localStorage.getItem(LOCAL_KEY);
//     if (localData) {
//       const parsed: unknown = JSON.parse(localData);
//       if (Array.isArray(parsed) && parsed.every(item => typeof item === "number")) {
//         setFavouriteIds(new Set(parsed));
//       }
//     }
//   }, []);

//   const toggleFavourite = useCallback((recipeId: number) => {
//     const newSet = new Set(favouriteIds);
//     if (newSet.has(recipeId)) {
//       newSet.delete(recipeId);
//       // if (session) removeFavouriteMutation.mutate({ recipeId });
//     } else {
//       newSet.add(recipeId);
//       // if (session) addFavouriteMutation.mutate({ recipeId });
//     }
//     setFavouriteIds(newSet);
//     localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(newSet)));
//   }, [favouriteIds, session]);

//   return { favouriteIds, toggleFavourite };
// }