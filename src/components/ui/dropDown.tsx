// src/components/ui/Dropdown.tsx
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

// A generic type for the options
export type DropdownOption = {
    id: string | number;
    label: string;
};

interface DropdownProps {
    options: DropdownOption[];
    selectedValue: DropdownOption | undefined;
    onChange: (value: DropdownOption) => void;
}

export function Dropdown({ options, selectedValue, onChange }: DropdownProps) {
    return (
        <Listbox value={selectedValue} onChange={onChange}>
            <div className="relative w-40">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-green-800 py-2 pl-3 pr-10 text-left text-white shadow-md hover:bg-green-700 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-green-500 sm:text-sm">
                    <span className="block truncate">{selectedValue?.label ?? 'Select...'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <FiChevronDown className="h-5 w-5 text-gray-200" aria-hidden="true" />
                    </span>
                </Listbox.Button>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                        {options.map((option) => (
                            <Listbox.Option
                                key={option.id}
                                className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-green-100 text-green-900' : 'text-gray-900'}`}
                                value={option}
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {option.label}
                                        </span>
                                        {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                                                <FiCheck className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}