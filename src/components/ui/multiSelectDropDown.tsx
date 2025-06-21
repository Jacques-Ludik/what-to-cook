// src/components/ui/MultiSelectDropdown.tsx
import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { FiChevronDown } from 'react-icons/fi';

// Reusing the same option type
export type DropdownOption = {
    id: number;
    label: string;
};

interface MultiSelectDropdownProps {
    label: string;
    options: (DropdownOption & { checked: boolean })[];
    onSelectAll: () => void;
    onClearAll: () => void;
    onOptionChange: (id: number, checked: boolean) => void;
}

export function MultiSelectDropdown({ label, options, onSelectAll, onClearAll, onOptionChange }: MultiSelectDropdownProps) {
    return (
        <Popover className="relative">
            <Popover.Button className="inline-flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <span>{label}</span>
                <FiChevronDown className="h-5 w-5" aria-hidden="true" />
            </Popover.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
            >
                {/* Make the panel itself responsive */}
                <Popover.Panel className="absolute right-0 z-10 mt-2 w-screen max-w-xs transform px-4 sm:max-w-md sm:px-0">
                    <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
                        <div className="relative flex flex-col gap-4 bg-white p-4">
                            <div className='flex justify-between'>
                                <button onClick={onSelectAll} className="...">Select All</button>
                                <button onClick={onClearAll} className="...">Clear All</button>
                            </div>
                            {/* === THE KEY CHANGE === */}
                            {/* It's a 1-column grid by default, and a 2-column grid on small screens and up */}
                            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                {options.map((option) => (
                                    <label key={option.id} className="flex items-center space-x-2 cursor-pointer rounded-md p-1 hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded accent-green-800"
                                            checked={option.checked}
                                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                        />
                                        <span className="text-sm text-gray-800">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </Popover.Panel>
                {/* <Popover.Panel className="absolute z-10 mt-3 w-64 max-w-sm transform px-4 sm:px-0 lg:max-w-xl">
                    <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
                        <div className="relative flex flex-col bg-white p-4 gap-4">
                            <div className='flex justify-between'>
                                <button onClick={onSelectAll} className="text-sm font-medium text-green-700 hover:underline">Select All</button>
                                <button onClick={onClearAll} className="text-sm font-medium text-gray-500 hover:underline">Clear All</button>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {options.map((option) => (
                                    <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded accent-green-800"
                                            checked={option.checked}
                                            onChange={(e) => onOptionChange(option.id, e.target.checked)}
                                        />
                                        <span className="text-sm text-gray-800">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </Popover.Panel> */}
            </Transition>
        </Popover>
    );
}