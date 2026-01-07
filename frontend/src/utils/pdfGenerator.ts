export const generatePDF = async (
  title: string,
  author: string,
  nosis: string,
  content: string
): Promise<void> => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this site.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 4cm 3cm 3cm 4cm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        h1 {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 5cm 0 2cm 0;
          letter-spacing: 0.05em;
          page-break-after: avoid;
        }
        
        h2 {
          font-size: 12pt;
          font-weight: bold;
          margin: 1.5cm 0 0.5cm 0;
          page-break-after: avoid;
        }
        
        p {
          text-align: justify;
          text-indent: 1.27cm;
          margin: 0 0 0.5cm 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1cm 0;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1cm auto;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .page-number {
          position: fixed;
          bottom: 2cm;
          width: 100%;
          text-align: center;
          font-size: 12pt;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};

export const downloadAsWord = (
  title: string,
  content: string
): void => {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman'; font-size: 12pt; line-height: 1.5; }
        h1 { font-size: 14pt; font-weight: bold; text-align: center; }
        p { text-align: justify; text-indent: 1.27cm; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(url);
};