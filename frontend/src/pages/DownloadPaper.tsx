import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTemplates } from '../contexts/TemplateContext';
import { useAssignments } from '../contexts/AssignmentContext';
import { generatePDF, downloadAsWord } from '../utils/pdfGenerator';
import { ArrowLeftIcon, DownloadIcon, PrinterIcon, EyeIcon } from '../components/icons';
import { PaperTemplate } from '../types';

const DownloadPaper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { getTemplateById } = useTemplates();
  const { getAssignmentById } = useAssignments();

  const assignment = id ? getAssignmentById(id) : undefined;
  const template = assignment?.templateId ? getTemplateById(assignment.templateId) : null;

  const [showPreview, setShowPreview] = useState(false);
  const [fullContent, setFullContent] = useState('');

  const generateFullPaperContent = (template: PaperTemplate, user: any, chapterContents: Record<string, string>) => {
    let html = '';
    
    template.pages.forEach((page: any) => {
      let pageContent = page.content || '';
      
      // Replace variables
      pageContent = pageContent
        .replace(/{{JUDUL_MAKALAH}}/g, assignment?.title || 'Judul Makalah')
        .replace(/{{NAMA_SISWA}}/g, user.name)
        .replace(/{{NOSIS}}/g, user.nosis);
      
      // For TOC page, generate table of contents
      if (page.type === 'TOC' && template.pages.find(p=> p.type === 'CONTENT')?.structure) {
        html += '<div class="page-break"></div>';
        html += `<div>${renderTableOfContents(template.pages.find(p=> p.type === 'CONTENT')?.structure || [])}</div>`;
      } else if (page.type === 'CONTENT' && page.structure) {
        // Add content chapters
        page.structure.forEach((chapter: any, index: number) => {
          if (index > 0) html += '<div class="page-break"></div>';
          html += `<h1>${chapter.title}</h1>`;
          html += chapterContents[chapter.id] || '<p>Konten belum diisi.</p>';
        });
      } else {
        html += '<div class="page-break"></div>';
        html += pageContent;
      }
    });
    
    return html;
  };

  const renderTableOfContents = (structure: any[]) => {
    let toc = '<h1 style="text-align: center; font-weight: bold;">DAFTAR ISI</h1><br/>';
    let pageNum = 1;
    
    structure.forEach(chapter => {
      toc += `<div style="display: flex; justify-between; margin: 0.5cm 0;">`;
      toc += `<span>${chapter.title}</span>`;
      toc += `<span>${pageNum}</span>`;
      toc += `</div>`;
      pageNum += 3; // Approximate
    });
    
    return toc;
  };

  useEffect(() => {
    if (template && currentUser) {
      // Generate full paper content
      const content = generateFullPaperContent(template, currentUser, {});
      setFullContent(content);
    }
  }, [template, currentUser]);


  const handlePrint = () => {
    if (assignment) {
      generatePDF(
        assignment.title,
        currentUser.name,
        currentUser.nosis,
        fullContent
      );
    }
  };

  const handleDownloadWord = () => {
    if (assignment) {
      downloadAsWord(assignment.title, fullContent);
    }
  };

  if (!assignment || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600">Tugas tidak ditemukan</h2>
          <button
            onClick={() => navigate('/assignments')}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Daftar Tugas
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📄 Download Makalah</h1>
            <p className="text-gray-600 mt-2">
              <strong>{assignment.title}</strong> - {currentUser.name}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>

      {/* Download Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-xl shadow-lg text-white cursor-pointer hover:scale-105 transition-transform"
             onClick={() => setShowPreview(!showPreview)}>
          <EyeIcon className="w-16 h-16 mb-4 mx-auto" />
          <h3 className="text-2xl font-bold text-center mb-2">Preview</h3>
          <p className="text-center text-blue-100">Lihat tampilan makalah sebelum download</p>
        </div>

        {/* Print to PDF */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 rounded-xl shadow-lg text-white cursor-pointer hover:scale-105 transition-transform"
             onClick={handlePrint}>
          <PrinterIcon className="w-16 h-16 mb-4 mx-auto" />
          <h3 className="text-2xl font-bold text-center mb-2">Print / PDF</h3>
          <p className="text-center text-green-100">Cetak atau simpan sebagai PDF</p>
        </div>

        {/* Download as Word */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-xl shadow-lg text-white cursor-pointer hover:scale-105 transition-transform"
             onClick={handleDownloadWord}>
          <DownloadIcon className="w-16 h-16 mb-4 mx-auto" />
          <h3 className="text-2xl font-bold text-center mb-2">Download .DOC</h3>
          <p className="text-center text-purple-100">Download dalam format Microsoft Word</p>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2">
            <h2 className="text-2xl font-bold text-gray-800">📖 Preview Makalah</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
            >
              ✕ Tutup Preview
            </button>
          </div>

          <div 
            className="bg-white border-2 border-gray-300 rounded-lg p-12 max-w-[21cm] mx-auto shadow-inner"
            style={{
              fontFamily: 'Times New Roman',
              fontSize: '12pt',
              lineHeight: '1.5'
            }}
            dangerouslySetInnerHTML={{ __html: fullContent }}
          />
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-300">
        <h3 className="font-bold text-lg mb-3 text-yellow-900">ℹ️ Informasi Penting</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>✅ Pastikan semua BAB sudah terisi dengan lengkap sebelum download</li>
          <li>✅ File PDF/DOC akan otomatis mengikuti format akademik yang benar</li>
          <li>✅ Penomoran halaman sudah diatur secara otomatis (romawi dan angka)</li>
          <li>✅ Daftar isi akan di-generate secara otomatis</li>
          <li>✅ Untuk mencetak (print), gunakan opsi "Print / PDF"</li>
        </ul>
      </div>
    </div>
  );
};

export default DownloadPaper;