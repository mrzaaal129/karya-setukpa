
import React from 'react';
import { PageSettings } from '../types';
import { CogIcon } from './icons';

interface PageSetupSidebarProps {
  settings: PageSettings;
  onSettingsChange: (newSettings: PageSettings) => void;
}

const PageSetupSidebar: React.FC<PageSetupSidebarProps> = ({ settings, onSettingsChange }) => {
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      margins: {
        ...settings.margins,
        [name]: parseFloat(value) || 0,
      },
    });
  };

  const handlePaperSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({
      ...settings,
      paperSize: e.target.value as 'A4' | 'Letter',
    });
  };

  return (
    <aside className="page-setup-sidebar bg-white p-4 border-l border-gray-200 h-full overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
        <CogIcon className="w-5 h-5 mr-2" />
        Pengaturan Halaman
      </h3>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="paperSize" className="block text-sm font-medium text-gray-700 mb-1">
            Ukuran Kertas
          </label>
          <select
            id="paperSize"
            value={settings.paperSize}
            onChange={handlePaperSizeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="A4">A4 (21cm x 29.7cm)</option>
            <option value="Letter">Letter (21.6cm x 27.9cm)</option>
          </select>
        </div>
        
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Margin (cm)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="marginTop" className="text-xs text-gray-600">Atas</label>
              <input type="number" name="top" id="marginTop" value={settings.margins.top} onChange={handleMarginChange} className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" step="0.1" />
            </div>
             <div>
              <label htmlFor="marginBottom" className="text-xs text-gray-600">Bawah</label>
              <input type="number" name="bottom" id="marginBottom" value={settings.margins.bottom} onChange={handleMarginChange} className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" step="0.1" />
            </div>
             <div>
              <label htmlFor="marginLeft" className="text-xs text-gray-600">Kiri</label>
              <input type="number" name="left" id="marginLeft" value={settings.margins.left} onChange={handleMarginChange} className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" step="0.1" />
            </div>
             <div>
              <label htmlFor="marginRight" className="text-xs text-gray-600">Kanan</label>
              <input type="number" name="right" id="marginRight" value={settings.margins.right} onChange={handleMarginChange} className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" step="0.1" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PageSetupSidebar;
