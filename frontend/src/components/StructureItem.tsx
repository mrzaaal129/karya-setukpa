
import React from 'react';
import { PaperStructure } from '../types';
import { CheckCircleIcon, ExclamationIcon } from './icons';

interface StructureItemProps {
    item: PaperStructure;
}

const StructureItem: React.FC<StructureItemProps> = ({ item }) => {
  const isComplete = item.wordCount >= item.minWords;
  const progress = Math.min((item.wordCount / item.minWords) * 100, 100);

  return (
    <li className="mb-3 pl-4 text-sm">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-medium ${isComplete ? 'text-gray-800' : 'text-gray-600'}`}>
          {isComplete ? (
            <CheckCircleIcon className="w-4 h-4 inline-block mr-2 text-green-500" />
          ) : (
            <ExclamationIcon className="w-4 h-4 inline-block mr-2 text-yellow-500" />
          )}
          {item.title}
        </span>
        <span className={`font-mono text-xs ${isComplete ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
          {item.wordCount}/{item.minWords}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`} 
          style={{ width: `${progress}%` }}>
        </div>
      </div>
    </li>
  );
}

export default StructureItem;