// src/components/ShareButton.tsx
import { useState, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FiShare2, FiLink, FiMail } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const [supportsNativeShare, setSupportsNativeShare] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        // The navigator object is only available in the browser.
        // We check if the Web Share API is supported and update the state.
        if ('share' in navigator) {
            setSupportsNativeShare(true);
        }
    }, []);

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title,
                text,
                url,
            });
            console.log('Recipe shared successfully');
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(url).then(() => {
            setIsCopied(true);
            // Reset the "Copied!" message after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    // --- RENDER LOGIC ---

    // If native sharing is supported, show a single, simple button.
    if (supportsNativeShare) {
        return (
            <button
                onClick={handleNativeShare}
                className="flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-95"
                aria-label="Share this recipe"
            >
                <FiShare2 className="h-4 w-4" />
                <span>Share</span>
            </button>
        );
    }

    // --- FALLBACK MENU for other browsers ---
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-95">
                    <FiShare2 className="h-4 w-4" />
                    <span>Share</span>
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <a href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`} target="_blank" rel="noopener noreferrer" className={`${active ? 'bg-green-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    <FaWhatsapp className="mr-2 h-5 w-5" /> WhatsApp
                                </a>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={`${active ? 'bg-blue-600 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    <FaFacebook className="mr-2 h-5 w-5" /> Facebook
                                </a>
                            )}
                        </Menu.Item>
                         <Menu.Item>
                            {({ active }) => (
                                <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`} className={`${active ? 'bg-gray-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    <FiMail className="mr-2 h-5 w-5" /> Email
                                </a>
                            )}
                        </Menu.Item>
                    </div>
                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button onClick={copyToClipboard} className={`${active ? 'bg-indigo-500 text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                    <FiLink className="mr-2 h-5 w-5" /> {isCopied ? 'Copied!' : 'Copy Link'}
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}