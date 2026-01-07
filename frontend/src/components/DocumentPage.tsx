import React, { useRef, useEffect } from 'react';
import PageHeader from './PageHeader';
import PageFooter from './PageFooter';
import { PageSettings } from '../types';

interface DocumentPageProps {
    pageNumber: number;
    totalPages?: number;
    content: string;
    onContentChange: (content: string) => void;
    settings: PageSettings;
    header?: string;
    showHeaderOnFirstPageOnly?: boolean;
    pageNumberFormat: 'none' | 'roman' | 'arabic';
    pageNumberPosition: 'top-center' | 'bottom-center' | 'bottom-right';
    showPageNumberOnFirstPage?: boolean;
    isEditable?: boolean;
    zoom?: number;
}

const DocumentPage: React.FC<DocumentPageProps> = ({
    pageNumber,
    totalPages,
    content,
    onContentChange,
    settings,
    header,
    showHeaderOnFirstPageOnly = false,
    pageNumberFormat,
    pageNumberPosition,
    showPageNumberOnFirstPage = false,
    isEditable = true,
    zoom = 1.0
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const isFirstPage = pageNumber === 1;

    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== content) {
            contentRef.current.innerHTML = content;
        }
    }, [content]);

    const handleInput = () => {
        if (contentRef.current && onContentChange) {
            onContentChange(contentRef.current.innerHTML);
        }
    };

    // Calculate paper dimensions
    const getPaperDimensions = () => {
        const isPortrait = settings.orientation === 'portrait';
        if (settings.paperSize === 'A4') {
            return {
                widthMm: isPortrait ? 210 : 297,
                heightMm: isPortrait ? 297 : 210,
            };
        } else {
            return {
                widthMm: isPortrait ? 216 : 279,
                heightMm: isPortrait ? 279 : 216,
            };
        }
    };

    const { widthMm, heightMm } = getPaperDimensions();
    const paperWidthPx = (widthMm / 10) * 37.795 * zoom;
    const paperHeightPx = (heightMm / 10) * 37.795 * zoom;

    // Calculate margins in pixels
    const marginTopPx = settings.margins.top * 37.795 * zoom;
    const marginBottomPx = settings.margins.bottom * 37.795 * zoom;
    const marginLeftPx = settings.margins.left * 37.795 * zoom;
    const marginRightPx = settings.margins.right * 37.795 * zoom;

    return (
        <div
            className="document-page bg-white shadow-lg mb-8 relative border border-gray-300"
            style={{
                width: `${paperWidthPx}px`,
                height: `${paperHeightPx}px`, // FIXED height, not min/max
                boxSizing: 'border-box',
                fontFamily: settings.font.family,
                fontSize: `${settings.font.size * zoom}pt`,
                lineHeight: settings.font.lineHeight,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Page number indicator (top-left corner for reference) */}
            <div className="absolute top-2 left-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded z-10">
                Page {pageNumber}
            </div>

            {/* Content wrapper with padding */}
            <div
                style={{
                    padding: `${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px`,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                {header && (
                    <PageHeader
                        content={header}
                        showOnFirstPageOnly={showHeaderOnFirstPageOnly}
                        isFirstPage={isFirstPage}
                    />
                )}

                {/* Content - NO scrolling, fixed height */}
                <div
                    ref={contentRef}
                    contentEditable={isEditable}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    className="document-content outline-none flex-1"
                    style={{
                        overflow: 'hidden', // No scroll!
                    }}
                />

                {/* Footer with page number */}
                <PageFooter
                    pageNumber={pageNumber}
                    totalPages={totalPages}
                    format={pageNumberFormat}
                    position={pageNumberPosition}
                    showOnFirstPage={showPageNumberOnFirstPage}
                    isFirstPage={isFirstPage}
                />
            </div>
        </div>
    );
};

export default DocumentPage;
