import React from 'react';

interface EditorRulerProps {
    paperWidthMm: number;
    marginLeft: number;
    marginRight: number;
    zoom: number;
}

const EditorRuler: React.FC<EditorRulerProps> = ({ paperWidthMm, marginLeft, marginRight, zoom }) => {
    const rulerWidthPx = (paperWidthMm / 10) * 37.795 * zoom; // Convert mm to px and apply zoom
    const totalCm = Math.ceil(paperWidthMm / 10);

    const leftMarginPx = (marginLeft * 37.795) * zoom;
    const rightMarginPx = rulerWidthPx - (marginRight * 37.795 * zoom);

    return (
        <div className="relative bg-gray-200 border-b border-gray-300 overflow-hidden" style={{ height: '28px' }}>
            <div className="relative mx-auto" style={{ width: `${rulerWidthPx}px` }}>
                {/* Ruler ticks and numbers */}
                <div className="relative h-7 bg-gray-100">
                    {Array.from({ length: totalCm * 10 + 1 }, (_, i) => {
                        const position = (i * 0.1 * 37.795) * zoom;
                        const isCm = i % 10 === 0;
                        const isHalfCm = i % 5 === 0;

                        return (
                            <div
                                key={i}
                                className="absolute top-0"
                                style={{ left: `${position}px` }}
                            >
                                {/* Tick mark */}
                                <div
                                    className={`bg-gray-600 ${isCm ? 'h-4' : isHalfCm ? 'h-3' : 'h-2'
                                        }`}
                                    style={{ width: '1px' }}
                                />

                                {/* Number label for cm */}
                                {isCm && i > 0 && (
                                    <div className="absolute -left-2 top-4 text-[9px] text-gray-700 font-mono">
                                        {i / 10}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Left margin indicator */}
                    <div
                        className="absolute top-0 bottom-0 w-0 border-l-2 border-blue-500"
                        style={{ left: `${leftMarginPx}px` }}
                        title={`Left margin: ${marginLeft}cm`}
                    >
                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-blue-500 rotate-45" />
                    </div>

                    {/* Right margin indicator */}
                    <div
                        className="absolute top-0 bottom-0 w-0 border-l-2 border-blue-500"
                        style={{ left: `${rightMarginPx}px` }}
                        title={`Right margin: ${marginRight}cm`}
                    >
                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-blue-500 rotate-45" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorRuler;
