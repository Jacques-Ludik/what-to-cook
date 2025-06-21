import { useState, useEffect } from 'react';

export function ScrollToTopButton() {
    // State to track whether the button should be visible
    const [isVisible, setIsVisible] = useState(false);

    // This function will be called when the user scrolls
    const toggleVisibility = () => {
        // If the user has scrolled down more than 300px, show the button
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // This function will be called when the button is clicked
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth', // This makes the scroll animated and not an instant jump
        });
    };

    // Set up the scroll event listener when the component mounts
    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
        <div className="fixed top-5 left-5 z-50">
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="p-2 rounded-full bg-green-800 text-white shadow-lg transition-opacity duration-300 hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                    aria-label="Scroll to top"
                >
                    {/* The SVG icon we generated */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 11l7-7 7 7M5 19l7-7 7 7"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}