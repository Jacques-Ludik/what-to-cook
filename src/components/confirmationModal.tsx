// src/components/ui/ConfirmationModal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: ReactNode; // To pass the confirmation message
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    isDestructive?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-green-800 hover:bg-green-700 focus-visible:ring-green-600',
    isDestructive = false
}: ConfirmationModalProps) {
    const destructiveButtonClass = 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500';

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    {isDestructive && (
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                        </div>
                                    )}
                                    <div className="w-full">
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {children}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button type="button" className="inline-flex w-1/2 justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-1/2" onClick={onClose}>
                                        {cancelText}
                                    </button>
                                    <button type="button" className={`inline-flex w-1/2 justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isDestructive ? destructiveButtonClass : confirmButtonClass}`} onClick={onConfirm}>
                                        {confirmText}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}