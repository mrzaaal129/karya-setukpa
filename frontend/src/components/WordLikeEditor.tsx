import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface WordLikeEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  documentTitle?: string;
}

const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  initialContent = '',
  onChange,
  documentTitle = 'Dokumen Tanpa Judul'
}) => {
  const editorRef = useRef<any>(null);

  return (
    <div className="flex flex-col h-full bg-[#F3F2F1] relative z-0">
      {/* Mock Word Header */}
      <div className="bg-[#2B579A] text-white px-4 py-1 flex items-center justify-between shadow-sm z-10 shrink-0 h-8">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-xs tracking-wide">Word Editor</span>
          <span className="text-[10px] opacity-80 bg-white/10 px-2 py-0.5 rounded">{documentTitle}</span>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden relative z-0">
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "hiecdezl5l7z8kg5qo70r8u1uwcmma07dcl9z84u4marhy2e"}
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={initialContent}
          onEditorChange={(content) => onChange?.(content)}
          init={{
            height: '100%',
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'pagebreak'
            ],
            // Enable Local Image Upload
            image_title: true,
            automatic_uploads: true,
            file_picker_types: 'image',
            file_picker_callback: (cb, value, meta) => {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');

              input.addEventListener('change', (e) => {
                const file = (e.target as any).files[0];
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                  const id = 'blobid' + (new Date()).getTime();
                  const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
                  const base64 = (reader.result as string).split(',')[1];
                  const blobInfo = blobCache.create(id, file, base64);
                  blobCache.add(blobInfo);

                  cb(blobInfo.blobUri(), { title: file.name });
                });
                reader.readAsDataURL(file);
              });

              input.click();
            },
            setup: (editor) => {
              editor.ui.registry.addButton('buatcover', {
                text: 'Buat Cover',
                icon: 'document',
                tooltip: 'Buat Halaman Judul Lengkap',
                onAction: () => {
                  const html = `
                    <div style="font-family: Arial, sans-serif; color: black;">
                      <!-- Kop Surat (Kiri Atas) -->
                      <div style="text-align: center; width: 350px; border-bottom: 3px solid black; margin-bottom: 40px; margin-left: 0;">
                        <p style="margin: 0; font-weight: bold; font-size: 11pt;">LEMBAGA PENDIDIKAN DAN PELATIHAN POLRI</p>
                        <p style="margin: 0; font-weight: bold; font-size: 11pt;">SEKOLAH PEMBENTUKAN PERWIRA</p>
                      </div>

                      <div style="text-align: center;">
                        <!-- Judul -->
                        <p style="font-weight: bold; font-size: 14pt; margin-bottom: 30px;">KARYA TULIS TERAPAN</p>

                        <!-- Logo Placeholder -->
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Lambang_Polri.png" width="120" height="140" style="margin-bottom: 30px;" />

                        <!-- Judul Karya -->
                        <p style="font-weight: bold; font-size: 12pt; margin-bottom: 30px; max-width: 90%; margin-left: auto; margin-right: auto; line-height: 1.5;">
                          OPTIMALISASI FUNGSI PENGAWASAN OLEH BIDPROPAM GUNA MENEKAN PELANGGARAN DISIPLIN BERULANG DALAM RANGKA MENINGKATKAN AKUNTABILITAS DAN ETIKA PROFESI POLRI
                        </p>

                        <!-- Garis Vertikal (Balok) -->
                        <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 30px; height: 80px;">
                          <div style="width: 6px; height: 100%; background-color: black;"></div>
                          <div style="width: 6px; height: 120%; margin-top: -10%; background-color: black;"></div>
                          <div style="width: 6px; height: 100%; background-color: black;"></div>
                        </div>

                        <!-- Oleh -->
                        <p style="margin-bottom: 10px;">Oleh :</p>
                        <table style="margin-left: auto; margin-right: auto; width: auto;">
                          <tr>
                            <td style="font-weight: bold; padding-right: 10px; text-align: left;">NAMA SERDIK</td>
                            <td style="font-weight: bold; text-align: left;">: ALEXANDER, S.H</td>
                          </tr>
                          <tr>
                            <td style="font-weight: bold; padding-right: 10px; text-align: left;">NOSIS</td>
                            <td style="font-weight: bold; text-align: left;">: 2508010676</td>
                          </tr>
                        </table>

                        <!-- Footer -->
                        <div style="margin-top: 50px; font-weight: bold; font-size: 11pt;">
                          <p style="margin: 0;">SEKOLAH INSPEKTUR POLISI ANGKATAN KE - 54 GEL I T.A. 2025</p>
                          <p style="margin: 0;">SETUKPA LEMDIKLAT POLRI</p>
                        </div>
                      </div>
                    </div>
                  `;
                  editor.insertContent(html);
                }
              });
            },
            toolbar: 'undo redo | buatcover | newdocument | formatselect | ' +
              'bold italic backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'table image | code | removeformat | help',
            content_style: `
              body {
                font-family: "Times New Roman", "Arial", sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                background-color: #808080;
                padding: 2rem 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              /* Simulate A4 Page */
              .mce-content-body {
                background-color: white;
                width: 210mm;
                min-height: 297mm;
                padding: 15mm 20mm; /* Reduced Margins */
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                margin-bottom: 2rem;
                box-sizing: border-box;
                text-align: left;
              }
              /* Table styling */
              table {
                border-collapse: collapse;
                width: 100%;
              }
              td, th {
                border: 1px dashed #ccc;
                padding: 4px;
              }
            `,
            resize: false,
            statusbar: true,
            branding: false,
            promotion: false,
          }}
        />
      </div>
    </div>
  );
};

export default WordLikeEditor;
