import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface FloatingPanelProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    position?: 'left' | 'right';
    storageKey?: string;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({
    title,
    children,
    defaultOpen = true,
    position = 'left',
    storageKey,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // Load state from localStorage
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved !== null) {
                setIsOpen(saved === 'true');
            }
        }
    }, [storageKey]);

    // Save state to localStorage
    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(storageKey, String(isOpen));
        }
    }, [isOpen, storageKey]);

    const positionClasses = position === 'left'
        ? 'left-4'
        : 'right-4';

    const slideClasses = position === 'left'
        ? isOpen ? 'translate-x-0' : '-translate-x-full'
        : isOpen ? 'translate-x-0' : 'translate-x-full';

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-24 ${position === 'left' ? 'left-4' : 'right-4'} z-50 bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                title={`Show ${title}`}
            >
                {position === 'left' ? (
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                ) : (
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                )}
            </button>

            {/* Panel */}
            <div
                className={`fixed top-20 ${positionClasses} bottom-4 w-96 bg-white shadow-2xl rounded-xl border border-gray-200 z-40 transition-transform duration-300 ease-in-out ${slideClasses} flex flex-col`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-xl">
                    <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Hide panel"
                    >
                        {position === 'left' ? (
                            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                </div>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-10 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default FloatingPanel;
