// src/components/IngredientsSkeleton.tsx

// A single placeholder item for an ingredient
const SkeletonItem = () => (
    <div className="flex items-center gap-2">
        {/* Checkbox placeholder */}
        <div className="h-4 w-4 rounded bg-gray-300"></div>
        {/* Text placeholder with random width for a more natural look */}
        <div
            className="h-4 rounded-md bg-gray-300"
            style={{ width: `${Math.floor(Math.random() * (120 - 60 + 1)) + 60}px` }}
        ></div>
    </div>
);

export function IngredientsSkeleton() {
    return (
        // The parent container with the pulse animation
        <div className="animate-pulse w-full">
            <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-3">
                {/* Create an array of 18 items and map over it to render placeholders */}
                {Array.from({ length: 18 }).map((_, index) => (
                    <SkeletonItem key={index} />
                ))}
            </div>
        </div>
    );
}