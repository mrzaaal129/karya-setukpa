import React, { useState } from 'react';

interface PaperViewProps {
    content: string;
    settings: {
        paperSize: 'A4' | 'Letter';
        margins: { top: number; right: number; bottom: number; left: number };
        font: { family: string; size: number; lineHeight: number };
    };
    onContentChange?: (content: string) => void;
    mode?: 'edit' | 'preview';
}

const PaperView: React.FC<PaperViewProps> = ({
    content,
    settings,
    onContentChange,
    mode = 'edit'
}) => {
    const [zoom, setZoom] = useState(100);
    const [showRuler, setShowRuler] = useState(false);

    // A4 dimensions in pixels at 96 DPI (210mm x 297mm)
    const paperWidth = 794; // pixels
    const paperHeight = 1123; // pixels

    const scaledWidth = (paperWidth * zoom) / 100;
    const scaledHeight = (paperHeight * zoom) / 100;

    const marginStyle = {
        paddingTop: `${settings.margins.top}cm`,
        paddingRight: `${settings.margins.right}cm`,
        paddingBottom: `${settings.margins.bottom}cm`,
        paddingLeft: `${settings.margins.left}cm`,
    };

    const fontStyle = {
        fontFamily: settings.font.family,
        fontSize: `${settings.font.size}pt`,
        lineHeight: settings.font.lineHeight,
    };

    const zoomLevels = [50, 75, 100, 125, 150];

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">Zoom:</span>
                    <div className="flex items-center gap-2">
                        {zoomLevels.map(level => (
                            <button
                                key={level}
                                onClick={() => setZoom(level)}
                                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${zoom === level
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {level}%
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showRuler}
                            onChange={(e) => setShowRuler(e.target.checked)}
                            className="rounded"
                        />
                        <span>Tampilkan Penggaris</span>
                    </label>
                    <div className="text-xs text-gray-500">
                        {settings.paperSize} • {settings.margins.top}/{settings.margins.right}/{settings.margins.bottom}/{settings.margins.left} cm
                    </div>
                </div>
            </div>

            {/* Paper Container */}
            <div className="flex-1 overflow-auto p-8">
                <div className="mx-auto" style={{ width: `${scaledWidth}px` }}>
                    {/* Ruler - Top */}
                    {showRuler && (
                        <div className="h-6 bg-gray-200 border-b border-gray-400 relative mb-2">
                            {Array.from({ length: 21 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute h-full border-l border-gray-400"
                                    style={{ left: `${(i * 100) / 21}%` }}
                                >
                                    {i % 5 === 0 && (
                                        <span className="text-xs text-gray-600 ml-1">{i}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex">
                        {/* Ruler - Left */}
                        {showRuler && (
                            <div className="w-6 bg-gray-200 border-r border-gray-400 relative mr-2" style={{ height: `${scaledHeight}px` }}>
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-full border-t border-gray-400"
                                        style={{ top: `${(i * 100) / 30}%` }}
                                    >
                                        {i % 5 === 0 && (
                                            <span className="text-xs text-gray-600 ml-1">{i}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Paper */}
                        <div
                            className="bg-white shadow-2xl relative"
                            style={{
                                width: `${scaledWidth}px`,
                                height: `${scaledHeight}px`,
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            {/* Margin Guides */}
                            <div
                                className="absolute inset-0 border-2 border-dashed border-blue-300 opacity-30 pointer-events-none"
                                style={marginStyle}
                            />

                            {/* Content Area */}
                            <div
                                className="w-full h-full overflow-hidden"
                                style={{ ...marginStyle, ...fontStyle }}
                            >
                                {mode === 'edit' ? (
                                    <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => onContentChange?.(e.currentTarget.innerHTML)}
                                        dangerouslySetInnerHTML={{ __html: content }}
                                        className="w-full h-full outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset rounded p-2"
                                    />
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: content }} />
                                )}
                            </div>

                            {/* Page Number Preview */}
                            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
                                1
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaperView;
