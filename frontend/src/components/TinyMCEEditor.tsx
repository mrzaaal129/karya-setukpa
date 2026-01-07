import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  content: string;
  onChange: (content: string) => void;
  height?: number;
  disabled?: boolean;
  placeholder?: string;
  enablePasteFromWord?: boolean;
  enableAutoSave?: boolean;
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  content,
  onChange,
  height = 600,
  disabled = false,
  placeholder = 'Mulai menulis di sini...',
  enablePasteFromWord = false,
  enableAutoSave = true,
}) => {
  const editorRef = useRef<any>(null);

  return (
    <Editor
      apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "hiecdezl5l7z8kg5qo70r8u1uwcmma07dcl9z84u4marhy2e"}
      onInit={(evt, editor) => (editorRef.current = editor)}
      value={content}
      onEditorChange={onChange}
      disabled={disabled}
      init={{
        height: height,
        menubar: 'file edit view insert format tools table',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | formatselect | fontselect fontsizeselect | ' +
          'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | forecolor backcolor | ' +
          'table link image | removeformat | help',

        font_formats:
          'Times New Roman=times new roman,times,serif;' +
          'Arial=arial,helvetica,sans-serif;' +
          'Calibri=calibri,sans-serif;' +
          'Georgia=georgia,serif;' +
          'Verdana=verdana,sans-serif;' +
          'Courier New=courier new,courier,monospace',

        fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 36pt',

        block_formats: 'Paragraph=p; Heading 1 (BAB)=h1; Heading 2 (Sub-BAB)=h2; Heading 3=h3',

        content_style: `
          body { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 12pt; 
            line-height: 1.5;
            padding: 2cm;
          }
          p { 
            margin: 0 0 1em 0; 
            text-indent: 1.27cm;
            text-align: justify;
          }
          h1 { 
            font-size: 14pt; 
            font-weight: bold; 
            text-align: center; 
            margin: 2em 0 1em 0;
          }
          h2 { 
            font-size: 13pt; 
            font-weight: bold; 
            margin: 1.5em 0 0.5em 0; 
          }
          h3 { 
            font-size: 12pt; 
            font-weight: bold; 
            margin: 1em 0 0.5em 0; 
          }
        `,

        paste_as_text: !enablePasteFromWord,
        placeholder: placeholder,
      }}
    />
  );
};

export default TinyMCEEditor;
