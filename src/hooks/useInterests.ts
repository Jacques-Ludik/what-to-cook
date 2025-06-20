// src/hooks/useInterests.ts
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

const LOCAL_KEY = 'recipeInterests';
type InterestCounts = Record<number, number>; // e.g., { recipeId: count }

export function useInterests() {
  const { data: session } = useSession();
  const [interestCounts, setInterestCounts] = useState<InterestCounts>({});

  const incrementInterestMutation = api.user.incrementRecipeInterest.useMutation();

  // Hydrate from localStorage on initial load
  useEffect(() => {
    try {
      const localData = localStorage.getItem(LOCAL_KEY);
      if (localData) {
        setInterestCounts(JSON.parse(localData) as InterestCounts);
      }
    } catch { /* ignore */ }
  }, []);

  const addInterest = useCallback((recipeId: number) => {
    // Update local state immediately for snappy UI
    const newCounts = { ...interestCounts, [recipeId]: (interestCounts[recipeId] ?? 0) + 1 };
    setInterestCounts(newCounts);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newCounts));
    
    // If logged in, sync with the database
    if (session) {
      incrementInterestMutation.mutate({ recipeId });
    }
  }, [interestCounts, session, incrementInterestMutation]);

  return { interestCounts, addInterest };
}