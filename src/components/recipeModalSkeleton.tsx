// src/components/RecipeModalSkeleton.tsx

export function RecipeModalSkeleton() {
    return (
        // The main container with the pulsing animation
        <div className="animate-pulse">
            {/* --- Header Skeleton --- */}
            <div className="flex justify-between items-start">
                {/* Title Placeholder */}
                <div className="h-8 w-3/4 rounded-lg bg-gray-300"></div>
                {/* Favourite Button Placeholder */}
                <div className="h-10 w-28 rounded-lg bg-gray-300"></div>
            </div>

            {/* --- Main Content Skeleton --- */}
            <div className="mt-6 flex flex-col md:flex-row gap-6">
                {/* Image Placeholder */}
                <div className="h-64 w-full md:w-1/2 rounded-lg bg-gray-300"></div>
                
                {/* Ingredients Placeholder */}
                <div className="w-full md:w-1/2 space-y-4">
                    <div className="h-6 w-1/2 rounded-lg bg-gray-300"></div> {/* "Ingredients" title */}
                    <div className="space-y-2">
                        <div className="h-4 w-full rounded-md bg-gray-300"></div>
                        <div className="h-4 w-5/6 rounded-md bg-gray-300"></div>
                        <div className="h-4 w-full rounded-md bg-gray-300"></div>
                        <div className="h-4 w-4/6 rounded-md bg-gray-300"></div>
                    </div>
                </div>
            </div>

            {/* --- Instructions Skeleton --- */}
            <div className="mt-6 space-y-4">
                <div className="h-6 w-1/3 rounded-lg bg-gray-300"></div> {/* "Instructions" title */}
                <div className="space-y-2">
                    <div className="h-4 w-full rounded-md bg-gray-300"></div>
                    <div className="h-4 w-full rounded-md bg-gray-300"></div>
                    <div className="h-4 w-11/12 rounded-md bg-gray-300"></div>
                    <div className="h-4 w-full rounded-md bg-gray-300"></div>
                    <div className="h-4 w-3/4 rounded-md bg-gray-300"></div>
                </div>
            </div>

            {/* --- Footer Skeleton --- */}
            <div className="mt-8 flex justify-between">
                <div className="h-10 w-24 rounded-lg bg-gray-300"></div> {/* Close button */}
                <div className="h-10 w-24 rounded-lg bg-gray-300"></div> {/* Share button */}
            </div>
        </div>
    );
}