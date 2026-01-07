import React from 'react';
import { PageSettings } from '../types';
import { Settings, FileText, MoveHorizontal, MoveVertical, LayoutTemplate } from 'lucide-react';

interface PageSettingsPanelProps {
  settings: PageSettings;
  onChange: (settings: PageSettings) => void;
}

const PageSettingsPanel: React.FC<PageSettingsPanelProps> = ({ settings, onChange }) => {
  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...settings,
      margins: { ...settings.margins, [side]: numValue }
    });
  };

  return (
    <div className="space-y-6">
      {/* Paper Size Section */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Ukuran & Orientasi
        </label>

        <div className="grid grid-cols-1 gap-3">
          <div className="relative">
            <select
              value={settings.paperSize}
              onChange={(e) => onChange({ ...settings, paperSize: e.target.value as 'A4' | 'Letter' })}
              className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-gray-100"
            >
              <option value="A4">A4 (21 × 29.7 cm)</option>
              <option value="Letter">Letter (21.6 × 27.9 cm)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ ...settings, orientation: 'portrait' })}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${settings.orientation === 'portrait'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="w-6 h-8 border-2 border-current rounded-sm mb-1.5 bg-current opacity-20"></div>
              <span className="text-xs font-semibold">Portrait</span>
            </button>
            <button
              onClick={() => onChange({ ...settings, orientation: 'landscape' })}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${settings.orientation === 'landscape'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="w-8 h-6 border-2 border-current rounded-sm mb-1.5 bg-current opacity-20"></div>
              <span className="text-xs font-semibold">Landscape</span>
            </button>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Margins Section */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5" />
          Margin (cm)
        </label>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
          {/* Visual Margin Representation */}
          <div className="grid grid-cols-3 gap-2 place-items-center mb-2">
            <div className="col-start-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-gray-500 uppercase">Atas</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.margins.top}
                  onChange={(e) => handleMarginChange('top', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="col-start-1 row-start-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-gray-500 uppercase">Kiri</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.margins.left}
                  onChange={(e) => handleMarginChange('left', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="col-start-2 row-start-2 w-24 h-32 bg-white border border-gray-300 shadow-sm rounded flex items-center justify-center">
              <div className="w-full h-full border border-dashed border-blue-300 m-1 bg-blue-50/30 flex items-center justify-center">
                <span className="text-[10px] text-blue-400 font-medium">Konten</span>
              </div>
            </div>

            <div className="col-start-3 row-start-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-gray-500 uppercase">Kanan</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.margins.right}
                  onChange={(e) => handleMarginChange('right', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="col-start-2 row-start-3">
              <div className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[10px] font-medium text-gray-500 uppercase">Bawah</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => onChange({ ...settings, margins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 } })}
            className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-center"
          >
            Standar (2.54)
          </button>
          <button
            onClick={() => onChange({ ...settings, margins: { top: 3, right: 3, bottom: 3, left: 4 } })}
            className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all text-center"
          >
            Akademik (4-3-3-3)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageSettingsPanel;
