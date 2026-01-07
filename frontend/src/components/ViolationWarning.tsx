
import React from 'react';
import { ExclamationIcon } from './icons';

interface ViolationWarningProps {
  isOpen: boolean;
  onClose: () => void;
  violationCount: number;
}

const ViolationWarning: React.FC<ViolationWarningProps> = ({ isOpen, onClose, violationCount }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
        <div className="flex items-start space-x-3">
          <ExclamationIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Peringatan Pelanggaran
            </h3>
            <p className="text-gray-700 mb-4">
              Anda telah berpindah tab sebanyak <strong>{violationCount}</strong> kali. 
              Tindakan ini telah dicatat dan dapat mempengaruhi penilaian Anda.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationWarning;