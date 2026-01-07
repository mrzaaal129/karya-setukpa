import React from 'react';

interface PageFooterProps {
    pageNumber: number;
    totalPages?: number;
    format: 'none' | 'roman' | 'arabic';
    position: 'top-center' | 'bottom-center' | 'bottom-right';
    showOnFirstPage?: boolean;
    isFirstPage?: boolean;
}

const PageFooter: React.FC<PageFooterProps> = ({
    pageNumber,
    totalPages,
    format,
    position,
    showOnFirstPage = true,
    isFirstPage = false
}) => {
    // Don't show on first page if configured
    if (!showOnFirstPage && isFirstPage) {
        return null;
    }

    // Don't show if format is none
    if (format === 'none') {
        return null;
    }

    const formatPageNumber = (num: number): string => {
        if (format === 'roman') {
            return toRoman(num).toLowerCase();
        }
        return num.toString();
    };

    const toRoman = (num: number): string => {
        if (isNaN(num) || num < 1) return '';
        const romanNumerals: [number, string][] = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
            [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
        ];

        let result = '';
        for (const [value, symbol] of romanNumerals) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    };

    const getPositionClass = () => {
        switch (position) {
            case 'top-center':
                return 'text-center';
            case 'bottom-center':
                return 'text-center';
            case 'bottom-right':
                return 'text-right';
            default:
                return 'text-center';
        }
    };

    const pageText = totalPages
        ? `${formatPageNumber(pageNumber)} / ${totalPages}`
        : formatPageNumber(pageNumber);

    return (
        <div className={`page-footer mt-4 pt-2 border-t border-gray-300 text-sm text-gray-600 ${getPositionClass()}`}>
            {pageText}
        </div>
    );
};

export default PageFooter;
