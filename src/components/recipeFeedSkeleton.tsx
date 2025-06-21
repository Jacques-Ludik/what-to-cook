// src/components/RecipeFeedSkeleton.tsx

// A single placeholder card for one recipe
const SkeletonCard = () => (
    <div className="border rounded-lg shadow-lg overflow-hidden">
        {/* Image Placeholder */}
        <div className="w-full h-48 bg-gray-300"></div>
        <div className="p-4 space-y-3">
            {/* Title Placeholder */}
            <div className="h-5 w-3/4 rounded-md bg-gray-300"></div>
            {/* Sub-info Placeholders */}
            <div className="flex justify-between">
                <div className="h-4 w-1/3 rounded-md bg-gray-300"></div>
                <div className="h-4 w-1/4 rounded-md bg-gray-300"></div>
            </div>
        </div>
    </div>
);

interface RecipeFeedSkeletonProps {
    count?: number; // Allow specifying how many cards to show
}

export function RecipeFeedSkeleton({ count = 6 }: RecipeFeedSkeletonProps) {
    return (
        // The parent container with the grid layout and pulse animation
        <div className="w-full animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create an array and map over it to render the placeholder cards */}
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        </div>
    );
}