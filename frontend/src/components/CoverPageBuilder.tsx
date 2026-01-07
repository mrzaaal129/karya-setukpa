import React, { useState, useEffect } from 'react';
import { Book, User, Award, Building, Upload, ZoomIn, ZoomOut } from 'lucide-react';

interface CoverData {
    title: string;
    studentName: string;
    studentNosis: string;
    program: string;
    logoUrl: string;
}

interface CoverPageBuilderProps {
    initialData?: string;
    onSave: (htmlContent: string) => void;
}

const CoverPageBuilder: React.FC<CoverPageBuilderProps> = ({ initialData, onSave }) => {
    const [data, setData] = useState<CoverData>({
        title: 'OPTIMALISASI FUNGSI PENGAWASAN OLEH BIDPROPAM GUNA MENEKAN PELANGGARAN DISIPLIN BERULANG DALAM RANGKA MENINGKATKAN AKUNTABILITAS DAN ETIKA PROFESI POLRI',
        studentName: 'ALEXANDER, S.H',
        studentNosis: '2508010676',
        program: 'SEKOLAH INSPEKTUR POLISI ANGKATAN KE - 54 GEL I T.A. 2025',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Lambang_Polri.png'
    });

    const [zoom, setZoom] = useState(0.8);

    useEffect(() => {
        const html = generateHtml(data);
        onSave(html);
    }, [data]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setData({ ...data, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const generateHtml = (d: CoverData) => {
        return `
      <div style="font-family: Arial, sans-serif; color: black; text-align: center; padding: 0;">
        <!-- Kop Surat -->
        <div style="text-align: center; width: 350px; border-bottom: 3px solid black; margin-bottom: 40px; margin-left: 0;">
          <p style="margin: 0; font-weight: bold; font-size: 11pt;">LEMBAGA PENDIDIKAN DAN PELATIHAN POLRI</p>
          <p style="margin: 0; font-weight: bold; font-size: 11pt;">SEKOLAH PEMBENTUKAN PERWIRA</p>
        </div>

        <div style="text-align: center;">
          <p style="font-weight: bold; font-size: 14pt; margin-bottom: 30px;">KARYA TULIS TERAPAN</p>

          <img src="${d.logoUrl}" width="120" height="140" style="margin-bottom: 30px; object-fit: contain;" />

          <p style="font-weight: bold; font-size: 12pt; margin-bottom: 30px; max-width: 90%; margin-left: auto; margin-right: auto; line-height: 1.5; text-transform: uppercase;">
            ${d.title}
          </p>

          <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 30px; height: 80px;">
            <div style="width: 6px; height: 100%; background-color: black;"></div>
            <div style="width: 6px; height: 120%; margin-top: -10%; background-color: black;"></div>
            <div style="width: 6px; height: 100%; background-color: black;"></div>
          </div>

          <p style="margin-bottom: 10px;">Oleh :</p>
          <table style="margin-left: auto; margin-right: auto; width: auto;">
            <tr>
              <td style="font-weight: bold; padding-right: 10px; text-align: left;">NAMA SERDIK</td>
              <td style="font-weight: bold; text-align: left;">: ${d.studentName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding-right: 10px; text-align: left;">NOSIS</td>
              <td style="font-weight: bold; text-align: left;">: ${d.studentNosis}</td>
            </tr>
          </table>

          <div style="margin-top: 50px; font-weight: bold; font-size: 11pt;">
            <p style="margin: 0;">${d.program}</p>
            <p style="margin: 0;">SETUKPA LEMDIKLAT POLRI</p>
          </div>
        </div>
      </div>
    `;
    };

    return (
        <div className="flex h-full bg-gray-100">
            {/* Configuration Panel */}
            <div className="w-[400px] bg-white border-r shadow-lg flex flex-col h-full z-10">
                <div className="p-6 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Book className="w-5 h-5 text-blue-600" />
                        Builder Halaman Judul
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Isi data di bawah untuk menyusun cover standar.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Section: Data Karya */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Data Karya Tulis
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Lengkap</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    rows={4}
                                    value={data.title}
                                    onChange={(e) => setData({ ...data, title: e.target.value })}
                                    placeholder="Masukkan judul karya tulis..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Institusi</label>
                                <div className="flex items-center gap-3">
                                    <img src={data.logoUrl} alt="Logo" className="w-10 h-10 object-contain border rounded bg-gray-50" />
                                    <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                                        <Upload className="w-3 h-3" /> Ganti Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Section: Data Siswa */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="w-4 h-4" /> Data Penulis
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Serdik</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={data.studentName}
                                    onChange={(e) => setData({ ...data, studentName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NOSIS</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={data.studentNosis}
                                    onChange={(e) => setData({ ...data, studentNosis: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100" />

                    {/* Section: Instansi */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Building className="w-4 h-4" /> Data Instansi
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program Pendidikan</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                value={data.program}
                                onChange={(e) => setData({ ...data, program: e.target.value })}
                            />
                        </div>
                    </section>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-200 overflow-hidden flex flex-col relative">
                {/* Toolbar */}
                <div className="absolute top-4 right-4 bg-white rounded-full shadow-md p-1 flex items-center gap-1 z-20">
                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
                    <div
                        className="bg-white shadow-2xl transition-transform origin-top"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            padding: '20mm 25mm',
                            transform: `scale(${zoom})`,
                            marginBottom: '50px'
                        }}
                        dangerouslySetInnerHTML={{ __html: generateHtml(data) }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CoverPageBuilder;
