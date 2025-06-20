// src/hooks/useUserPreferences.ts
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

// Define the shape of our preferences object
interface UserPreferences {
  dietTypeId: number;
  estimatedTimeOption: string;
  allergensIDList: number[];
  highProtein: boolean;
  lowCalorie: boolean;
}

const LOCAL_STORAGE_KEY = 'userPreferences';

// Define default values
const defaultPreferences: UserPreferences = {
  dietTypeId: 1, // 'None'
  estimatedTimeOption: '30 minutes',
  allergensIDList: [],
  highProtein: false,
  lowCalorie: false,
};

export function useUserPreferences() {
  const { data: sessionData, status: sessionStatus } = useSession();

  // State for each preference
  const [dietTypeId, setDietTypeId] = useState<number>(defaultPreferences.dietTypeId);
  const [estimatedTimeOption, setEstimatedTimeOption] = useState<string>(defaultPreferences.estimatedTimeOption);
  const [allergensIDList, setAllergensIDList] = useState<number[]>(defaultPreferences.allergensIDList);
  const [highProtein, setHighProtein] = useState<boolean>(defaultPreferences.highProtein);
  const [lowCalorie, setLowCalorie] = useState<boolean>(defaultPreferences.lowCalorie);
  const [isLoading, setIsLoading] = useState(true);

  // tRPC hooks
  const { data: dbPreferences, refetch: fetchDbPreferences } = api.user.getUserPreferences.useQuery(undefined, { enabled: false });
  const saveMutation = api.user.saveUserPreferences.useMutation();

  // Function to apply preferences from any source (DB, localStorage, defaults)
  const applyPreferences = (prefs: Partial<UserPreferences>) => {
    setDietTypeId(prefs.dietTypeId ?? defaultPreferences.dietTypeId);
    setEstimatedTimeOption(prefs.estimatedTimeOption ?? defaultPreferences.estimatedTimeOption);
    setAllergensIDList(prefs.allergensIDList ?? defaultPreferences.allergensIDList);
    setHighProtein(prefs.highProtein ?? defaultPreferences.highProtein);
    setLowCalorie(prefs.lowCalorie ?? defaultPreferences.lowCalorie);
    setIsLoading(false);
  };

  // Main effect for hydrating state on load or session change
  useEffect(() => {
    if (sessionStatus === 'loading') {
      setIsLoading(true);
      return;
    }

    if (sessionStatus === 'authenticated') {
      void fetchDbPreferences();
    } else { // 'unauthenticated'
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        try {
          applyPreferences(JSON.parse(localData) as Partial<UserPreferences>);
        } catch {
          applyPreferences(defaultPreferences);
        }
      } else {
        applyPreferences(defaultPreferences);
      }
    }
  }, [sessionStatus, fetchDbPreferences]);
  
  // Effect to handle data returned from the database
  useEffect(() => {
    if (dbPreferences) { // This means we're logged in and got data
      // If DB has no saved data (all fields are null), fall back to localStorage
      const hasDbData = dbPreferences.dietTypeId !== null;
      if (hasDbData) {
          applyPreferences(dbPreferences as UserPreferences);
      } else {
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          applyPreferences(localData ? (JSON.parse(localData) as Partial<UserPreferences>) : defaultPreferences);
      }
    }
  }, [dbPreferences]);


  // Effect to save to localStorage for logged-out users whenever a preference changes
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      const currentPrefs: UserPreferences = { dietTypeId, estimatedTimeOption, allergensIDList, highProtein, lowCalorie };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentPrefs));
    }
  }, [dietTypeId, estimatedTimeOption, allergensIDList, highProtein, lowCalorie, sessionStatus]);


  // Function to be called by the "Let's Cook" button
  const savePreferencesToDb = useCallback(() => {
    if (sessionStatus === 'authenticated') {
      const currentPrefs = { 
        dietTypeId, 
        estimatedTime: Number(estimatedTimeOption.replace(new RegExp(" minutes", 'g'), '')), 
        allergensIDList, 
        highProtein, 
        lowCalorie 
      };
      saveMutation.mutate(currentPrefs, {
        onSuccess: () => console.log("Preferences saved to DB!"),
        onError: (err) => console.error("Failed to save preferences:", err),
      });
    }
  }, [sessionStatus, dietTypeId, estimatedTimeOption, allergensIDList, highProtein, lowCalorie, saveMutation]);

  return {
    // State values
    dietTypeId,
    estimatedTimeOption,
    allergensIDList,
    highProtein,
    lowCalorie,
    isLoading,
    // State setters
    setDietTypeId,
    setEstimatedTimeOption,
    setAllergensIDList,
    setHighProtein,
    setLowCalorie,
    // Actions
    savePreferencesToDb,
  };
}