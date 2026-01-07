import React from 'react';
import { PaperStructure } from '../types';

interface TableOfContentsProps {
  structure: PaperStructure[];
  startPage?: number; // Starting page number for content
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ structure, startPage = 1 }) => {
  let currentPage = startPage;

  const renderTOCEntry = (item: PaperStructure, level: number = 0) => {
    const itemPage = currentPage;
    currentPage++; // Increment for next chapter/section

    return (
      <div key={item.id}>
        <div 
          className="flex justify-between items-baseline mb-2"
          style={{ 
            marginLeft: `${level * 1.27}cm`,
            fontFamily: 'Times New Roman',
            fontSize: '12pt',
            lineHeight: '1.5'
          }}
        >
          <span className="flex-grow">{item.title}</span>
          <span className="border-b border-dotted border-gray-400 flex-grow mx-2"></span>
          <span className="font-semibold">{itemPage}</span>
        </div>
        
        {item.subsections && item.subsections.map(sub => renderTOCEntry(sub, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <h1 
        className="text-center font-bold mb-8"
        style={{
          fontSize: '14pt',
          fontFamily: 'Times New Roman',
          letterSpacing: '0.05em'
        }}
      >
        DAFTAR ISI
      </h1>
      
      <div className="space-y-1">
        {structure.map(chapter => renderTOCEntry(chapter))}
      </div>
    </div>
  );
};

export default TableOfContents;