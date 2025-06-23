// src/hooks/useModalRouter.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

// This is a helper to check deep equality for query objects, preventing unnecessary pushes.
import isEqual from 'lodash.isequal';

export function useModalRouter<T extends string | number | boolean>(
    queryParam: string
) {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [internalState, setInternalState] = useState<T | null>(null);

    // This effect's only job is to sync our React state FROM the URL.
    // The URL is the single source of truth.
    useEffect(() => {
        // Wait until the Next.js router is fully ready.
        if (!router.isReady) return;

        const urlValue = router.query[queryParam] as string | undefined;

        let newState: T | null = null;
        if (urlValue) {
            // Attempt to convert to number if possible, otherwise use as string.
            // This makes it work for both `recipe=123` and `show_favourites=true`.
            const numericValue = Number(urlValue);
            if (!isNaN(numericValue)) {
                newState = numericValue as T;
            } else if (urlValue === 'true') {
                newState = true as T;
            } else {
                newState = urlValue as T;
            }
        }

        setInternalState(newState);
        setIsReady(true);
    }, [router.isReady, router.query, queryParam]);

    // This function is what our components will call to open/close the modal.
    // It works by programmatically changing the URL.
    const setModalState = useCallback((value: T | null) => {
        const currentQuery = { ...router.query };
        const newQuery = { ...router.query };

        if (value !== null) {
            // We want to OPEN the modal. Add the param to the URL.
            newQuery[queryParam] = String(value);
        } else {
            // We want to CLOSE the modal. Remove the param from the URL.
            delete newQuery[queryParam];
        }

        // Only push to history if the query has actually changed.
        // This prevents redundant pushes and history stack clutter.
        if (!isEqual(currentQuery, newQuery)) {
            void router.push({ query: newQuery }, undefined, { shallow: true });
        }
    }, [router, queryParam]);

    // Don't return the state until the hook has had a chance to sync with the URL.
    const finalState = isReady ? internalState : null;

    return [finalState, setModalState] as const;
}


// // src/hooks/useModalRouter.ts
// import { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/router';

// // This hook manages a piece of state that is synced with the URL
// // It allows the browser's back button to control the state (e.g., close a modal)
// export function useModalRouter<T>(
//     queryParam: string, // The name of the query parameter, e.g., 'recipe' or 'show_favourites'
//     initialValue: T | null = null
// ) {
//     const router = useRouter();
//     const [state, setState] = useState<T | null>(initialValue);

//     // This effect SYNCS THE URL to our state when we open a modal
//     useEffect(() => {
//         const currentQueryValue = router.query[queryParam] as string | undefined;

//         if (state !== null && String(state) !== currentQueryValue) {
//             // Our state is "open", but the URL doesn't reflect it.
//             // Push a new history entry to add our query param.
//             const newQuery = { ...router.query, [queryParam]: String(state) };
//             void router.push({ query: newQuery }, undefined, { shallow: true });
//         } else if (state === null && currentQueryValue) {
//             // Our state is "closed", but the URL still has the param.
//             // Push a new history entry to remove our query param.
//             const newQuery = { ...router.query };
//             delete newQuery[queryParam];
//             void router.push({ query: newQuery }, undefined, { shallow: true });
//         }
//     }, [state, queryParam, router]);

//     // This effect SYNCS OUR STATE from the URL when the user navigates (e.g., clicks back)
//     useEffect(() => {
//         const handleRouteChange = (url: string) => {
//             const params = new URLSearchParams(url.split('?')[1]);
//             const paramValue = params.get(queryParam);
            
//             if (!paramValue) {
//                 // The query param was removed, so we close the modal.
//                 setState(null);
//             }
//         };
        
//         // Next.js's router events are better for this than the native `popstate`
//         router.events.on('routeChangeComplete', handleRouteChange);

//         return () => {
//             router.events.off('routeChangeComplete', handleRouteChange);
//         };
//     }, [queryParam, router.events]);
    
//     // On initial load, sync state from the URL if it exists
//     useEffect(() => {
//         if(router.isReady) {
//             const paramValue = router.query[queryParam] as string | undefined;
//             if (paramValue) {
//                 // This is slightly tricky. If the value is numeric, parse it.
//                 // For a simple boolean flag like "show_favourites", we'd just set it.
//                 const numericValue = parseInt(paramValue, 10);
//                 setState(isNaN(numericValue) ? paramValue as T : numericValue as T);
//             }
//         }
//     }, [router.isReady]);


//     // Return the state and a "safe" setter function
//     const setModalState = useCallback((value: T | null) => {
//         setState(value);
//     }, []);

//     return [state, setModalState] as const;
// }