// src/hooks/useSearch.ts
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { api } from '~/utils/api';

export function useSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Debounce the search term. The query will only run 300ms after the user stops typing.
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const { data: searchResults, isLoading } = api.recipe.searchRecipesAndIngredients.useQuery(
        { term: debouncedSearchTerm },
        {
            // Only enable the query if the debounced term has at least 2 characters
            enabled: debouncedSearchTerm.length > 1,
            // We don't want this data to be considered stale too quickly
            staleTime: 1000 * 60 * 5, // 5 minutes
        }
    );

    // Clear results when the search box is emptied
    useEffect(() => {
        if (searchTerm.length <= 1) {
            // This doesn't clear the data, tRPC query will be disabled and data will be undefined
        }
    }, [searchTerm]);

    return {
        searchTerm,
        setSearchTerm,
        searchResults: searchTerm.length > 1 ? searchResults : [], // Return empty array if term is too short
        isLoading,
    };
}