import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { PageSettings } from '../types';
import { FileText } from 'lucide-react';

interface CustomDocEditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    documentTitle?: string;
    pageSettings?: PageSettings;
}

const CustomDocEditor: React.FC<CustomDocEditorProps> = ({
    initialContent = '',
    onChange,
    documentTitle = 'Dokumen Tanpa Judul',
    pageSettings
}) => {
    const editorRef = useRef<any>(null);

    // Calculate dynamic styles based on paper settings
    const getPaperStyle = () => {
        const settings = pageSettings || {
            paperSize: 'A4',
            orientation: 'portrait',
            margins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 }
        };

        const sizes = {
            A4: { width: '210mm', height: '297mm' },
            Letter: { width: '216mm', height: '279mm' }
        };

        const size = sizes[settings.paperSize as keyof typeof sizes] || sizes.A4;
        const isLandscape = settings.orientation === 'landscape';

        // Swap for landscape
        const width = isLandscape ? size.height : size.width;

        // Convert margins to CSS string
        const padding = `${settings.margins.top}cm ${settings.margins.right}cm ${settings.margins.bottom}cm ${settings.margins.left}cm`;

        return {
            width,
            padding
        };
    };

    const paperStyle = getPaperStyle();

    // Custom Insert Cover Function
    const insertCoverTemplate = (editor: any) => {
        const html = `
      <div style="font-family: 'Times New Roman', Arial, sans-serif; color: black; text-align: center; line-height: 1.5;">
        <!-- Kop Surat -->
        <div style="text-align: left; margin-bottom: 40px;">
            <div style="display: inline-block; text-align: center; border-bottom: 3px solid black; padding-bottom: 2px; min-width: 300px;">
                <p style="margin: 0; font-weight: bold; font-size: 12pt;">LEMBAGA PENDIDIKAN DAN PELATIHAN POLRI</p>
                <p style="margin: 0; font-weight: bold; font-size: 14pt;">SEKOLAH PEMBENTUKAN PERWIRA</p>
            </div>
        </div>

        <div style="font-weight: bold; font-size: 16pt; margin-bottom: 30px;">KARYA TULIS TERAPAN</div>

        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Lambang_Polri.png/240px-Lambang_Polri.png" width="140" style="margin-bottom: 30px;" alt="Logo Polri" />

        <div style="font-weight: bold; font-size: 14pt; margin-bottom: 50px; max-width: 90%; margin: 0 auto 50px auto; text-transform: uppercase;">
          OPTIMALISASI FUNGSI PENGAWASAN OLEH BIDPROPAM GUNA MENEKAN PELANGGARAN DISIPLIN BERULANG
        </div>

        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 50px; height: 100px;">
          <div style="width: 8px; height: 100px; background-color: black;"></div>
          <div style="width: 8px; height: 125px; margin-top: -12px; background-color: black;"></div>
          <div style="width: 8px; height: 100px; background-color: black;"></div>
        </div>

        <div style="margin-bottom: 15px; font-size: 12pt;">Oleh :</div>
        <table style="margin: 0 auto; width: 70%; border-collapse: collapse; font-size: 12pt; border: none;">
          <tr>
            <td style="font-weight: bold; padding: 5px; text-align: left; width: 30%;">NAMA SERDIK</td>
            <td style="font-weight: bold; padding: 5px; text-align: left;">: NAMA SISWA</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 5px; text-align: left;">NOSIS</td>
            <td style="font-weight: bold; padding: 5px; text-align: left;">: 2025XXXXXX</td>
          </tr>
        </table>

        <div style="margin-top: 80px; font-weight: bold; font-size: 12pt;">
          <p style="margin: 0;">SEKOLAH INSPEKTUR POLISI ANGKATAN KE - 54 GEL I T.A. 2025</p>
          <p style="margin: 0;">SETUKPA LEMDIKLAT POLRI</p>
        </div>
      </div>
      <p>&nbsp;</p> <!-- Spacing after cover -->
    `;
        editor.insertContent(html);
    };

    return (
        <div className="flex flex-col h-full bg-[#F3F2F1]">
            {/* Header Bar */}
            <div className="bg-[#2B579A] text-white px-4 py-2 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5" />
                    <div>
                        <span className="font-bold text-sm tracking-wide block">Karya Editor Pro</span>
                        <span className="text-[10px] opacity-80 block leading-none">{documentTitle}</span>
                    </div>
                </div>
            </div>

            {/* TinyMCE Wrapper */}
            <div className="flex-1 overflow-hidden relative">
                <Editor
                    tinymceScriptSrc='/tinymce/tinymce.min.js'
                    licenseKey='gpl'
                    onInit={(evt, editor) => {
                        editorRef.current = editor;
                        // Initial insert if needed
                    }}
                    value={initialContent}
                    onEditorChange={(newValue) => onChange?.(newValue)}
                    init={{
                        base_url: '/tinymce', // Important for self-hosted to find skins
                        suffix: '.min',
                        height: '100%',
                        menubar: 'file edit view insert format tools table help',
                        toolbar_sticky: true,
                        plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                            'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'pagebreak'
                        ],
                        toolbar: 'undo redo | fontfamily fontsize | ' +
                            'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | ' +
                            'bullist numlist | table image insertCover | removeformat | help',

                        // Custom Button for Cover & Click Handling
                        setup: (editor) => {
                            editor.ui.registry.addButton('insertCover', {
                                text: 'Insert Cover',
                                icon: 'home',
                                tooltip: 'Insert Karya Tulis Cover Template',
                                onAction: () => insertCoverTemplate(editor)
                            });

                            // Fix: Clicking on the gray background (HTML) should focus the editor (Body)
                            editor.on('init', () => {
                                const doc = editor.getDoc();
                                doc.documentElement.addEventListener('click', (e: any) => {
                                    if (e.target === doc.documentElement) {
                                        editor.focus();
                                        // Optional: move cursor to end?
                                        // editor.selection.select(editor.getBody(), true); 
                                        // editor.selection.collapse(false);
                                    }
                                });
                            });
                        },

                        font_family_formats: 'Times New Roman=times new roman,times,serif;Arial=arial,helvetica,sans-serif;Verdana=verdana,geneva;Tahoma=tahoma,sans-serif',
                        font_size_formats: '8pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt',

                        // Visual Paper Simulation (Like MS Word)
                        content_style: `
                            html {
                                background-color: #F3F2F1;
                                height: 100%;
                                padding: 20px 0;
                                cursor: text; /* Show text cursor even on gray bg */
                            }
                            body {
                                font-family: 'Times New Roman', serif;
                                font-size: 12pt;
                                line-height: 1.5;
                                margin: 0 auto 2rem auto; /* Centered with bottom space */
                                padding: ${paperStyle.padding} !important;
                                width: ${paperStyle.width} !important;
                                max-width: ${paperStyle.width} !important;
                                min-height: 297mm;
                                background-color: white;
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06); /* Deeper shadow */
                                overflow-x: hidden;
                            }
                            /* Hide scrollbars for cleaner look inside editor iface */
                            ::-webkit-scrollbar { width: 10px; }
                            ::-webkit-scrollbar-track { background: #E0E0E0; }
                            ::-webkit-scrollbar-thumb { background: #BDBDBD; border-radius: 5px; }
                            ::-webkit-scrollbar-thumb:hover { background: #9E9E9E; }
                        `,

                        // Interaction configs
                        browser_spellcheck: true,
                        contextmenu: 'link image table',
                        resize: false, // Handle resizing via container
                        statusbar: true,
                        branding: false,
                        promotion: false, // Hide "Upgrade" button in self-hosted
                    }}
                />
            </div>
        </div>
    );
};

export default CustomDocEditor;
