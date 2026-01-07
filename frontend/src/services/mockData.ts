import { Assignment, AssignmentStatus, Paper, Grade, User, UserRole, Comment, PaperTemplate } from '../types';

export const mockUsers: User[] = [
    { id: 'siswa-1', nosis: '2024001', name: 'Budi Santoso', role: UserRole.Siswa, pembimbingId: 'pembimbing-1' },
    { id: 'siswa-2', nosis: '2024002', name: 'Ani Yudhoyono', role: UserRole.Siswa, pembimbingId: 'pembimbing-2' },
    { id: 'siswa-3', nosis: '2024003', name: 'Charlie van Houten', role: UserRole.Siswa },
    { id: 'siswa-4', nosis: '2024004', name: 'Dedi Corbuzier', role: UserRole.Siswa },
    { id: 'admin-1', nosis: 'N/A', name: 'Admin Setukpa', role: UserRole.Admin },
    { id: 'superadmin-1', nosis: 'N/A', name: 'Super Admin', role: UserRole.SuperAdmin },
    { id: 'penguji-1', nosis: 'N/A', name: 'Dr. John Doe', role: UserRole.Penguji },
    { id: 'pembimbing-1', nosis: 'N/A', name: 'Prof. Jane Smith', role: UserRole.Pembimbing },
    { id: 'pembimbing-2', nosis: 'N/A', name: 'Dr. Ahmad Subarjo', role: UserRole.Pembimbing },
    { id: 'pembimbing-3', nosis: 'N/A', name: 'Ir. Soekarno', role: UserRole.Pembimbing },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'makalah-etika-polri-1',
    title: 'Makalah Etika Profesi Polri',
    subject: 'Etika Kepolisian',
    deadline: '2024-11-20T23:59:00',
    status: AssignmentStatus.Draft,
    templateId: 'template-1',
    progress: 1250,
    totalWords: 3000,
    chapterSchedules: [
      {
        chapterId: 'bab1',
        chapterTitle: 'BAB I: PENDAHULUAN',
        isOpen: true,
        openDate: '2024-11-15T08:00:00',
        closeDate: '2024-11-16T17:00:00'
      },
      {
        chapterId: 'bab2',
        chapterTitle: 'BAB II: LANDASAN TEORI',
        isOpen: false,
        openDate: '2024-11-16T08:00:00',
        closeDate: '2024-11-18T17:00:00'
      },
      {
        chapterId: 'bab3',
        chapterTitle: 'BAB III: PEMBAHASAN',
        isOpen: false,
      },
      {
        chapterId: 'bab4',
        chapterTitle: 'BAB IV: PENUTUP',
        isOpen: false,
      }
    ]
  },
  {
    id: 'prokap-manajemen-konflik-2',
    title: 'Prokap Manajemen Konflik Sosial',
    subject: 'Manajemen Operasional',
    deadline: '2024-08-10T23:59:00',
    status: AssignmentStatus.Completed,
    templateId: 'template-1',
  },
  {
    id: 'analisis-kebijakan-publik-3',
    title: 'Analisis Kebijakan Publik',
    subject: 'Administrasi Publik',
    deadline: '2024-07-30T23:59:00',
    status: AssignmentStatus.Completed,
  },
  {
    id: 'strategi-intelijen-keamanan-4',
    title: 'Strategi Intelijen Keamanan',
    subject: 'Intelijen',
    deadline: '2024-08-25T23:59:00',
    status: AssignmentStatus.Scheduled,
  },
   {
    id: 'makalah-hukum-pidana-5',
    title: 'Tinjauan Hukum Pidana Modern',
    subject: 'Hukum Pidana',
    deadline: '2024-08-12T23:59:00',
    status: AssignmentStatus.UnderReview,
  },
];

const mockComments: Comment[] = [
    {
        id: 'comment-1',
        authorId: 'pembimbing-1',
        authorName: 'Prof. Jane Smith',
        authorRole: UserRole.Pembimbing,
        timestamp: '2024-07-28T10:30:00Z',
        text: 'Budi, draft awal sudah bagus. Tolong perkuat lagi bagian analisis di BAB II dengan data yang lebih konkret ya.'
    },
    {
        id: 'comment-2',
        authorId: 'siswa-1',
        authorName: 'Budi Santoso',
        authorRole: UserRole.Siswa,
        timestamp: '2024-07-28T11:15:00Z',
        text: 'Baik, Prof. Siap. Saya akan segera mencari data pendukung tambahan. Terima kasih atas masukannya.'
    },
    {
        id: 'comment-3',
        authorId: 'pembimbing-1',
        authorName: 'Prof. Jane Smith',
        authorRole: UserRole.Pembimbing,
        timestamp: '2024-07-28T11:16:00Z',
        text: 'Sama-sama. Jika ada kesulitan, jangan ragu untuk bertanya.'
    }
];

export const mockPaper: Paper = {
  id: 'paper-1',
  assignmentId: 'makalah-etika-polri-1',
  title: 'Makalah Etika Profesi Polri',
  subject: 'Etika Kepolisian',
  content: `<h1>BAB I: PENDAHULUAN</h1>
    <h2>1.1 Latar Belakang</h2>
    <p>Polri sebagai institusi penegak hukum memiliki peran krusial dalam menjaga keamanan dan ketertiban masyarakat. Oleh karena itu, etika profesi menjadi landasan fundamental bagi setiap anggota Polri dalam menjalankan tugasnya.</p>
    <h2>1.2 Rumusan Masalah</h2>
    <p>Bagaimana implementasi etika profesi Polri di lapangan?</p>
    <h1>BAB II: PEMBAHASAN</h1>
    <p>Pembahasan mengenai berbagai aspek etika...</p>
    <h1>BAB III: PENUTUP</h1>
    <p>Kesimpulan dan saran...</p>
    <h1>DAFTAR PUSTAKA</h1>
    <p>Referensi yang digunakan...</p>`,
  structure: [
    { id: 's1', title: 'BAB I: Pendahuluan', wordCount: 150, minWords: 200, subsections: [
        { id: 's1-1', title: '1.1 Latar Belakang', wordCount: 80, minWords: 100, subsections: [] },
        { id: 's1-2', title: '1.2 Rumusan Masalah', wordCount: 70, minWords: 100, subsections: [] },
    ]},
    { id: 's2', title: 'BAB II: Pembahasan', wordCount: 800, minWords: 1500, subsections: [] },
    { id: 's3', title: 'BAB III: Penutup', wordCount: 200, minWords: 300, subsections: [] },
    { id: 's4', title: 'Daftar Pustaka', wordCount: 100, minWords: 50, subsections: [] },
  ],
  wordCount: 1250,
  pageCount: 5,
  totalWords: 3000,
  totalPages: 10,
  timerDuration: 3 * 60 * 60, // 3 hours in seconds
  comments: mockComments,
};

export const mockGrade: Grade = {
    id: 'grade-1',
    paperId: 'prokap-manajemen-konflik-2',
    finalScore: 85,
    rubric: {
        content: 35,
        structure: 28,
        language: 15,
        format: 7
    },
    maxScores: {
        content: 40,
        structure: 30,
        language: 20,
        format: 10
    },
    examiners: [
        { id: 'penguji-1', name: 'Dr. John Doe', score: 83, feedback: 'Analisis sudah cukup tajam, namun bisa diperdalam lagi dengan studi kasus yang lebih relevan. Referensi sudah baik.'},
        { id: 'penguji-2', name: 'Prof. Jane Smith', score: 87, feedback: 'Struktur penulisan sangat baik dan sistematis. Penggunaan bahasa baku dan efektif. Perlu sedikit perbaikan pada format sitasi.'}
    ],
    advisorFeedback: 'Secara keseluruhan, makalah ini sudah sangat baik. Proses bimbingan berjalan lancar dan revisi yang dilakukan menunjukkan pemahaman yang mendalam.'
};

export const mockPaperTemplates: PaperTemplate[] = [
    {
        id: 'template-1',
        name: 'Template Karya Tulis Ilmiah SETUKPA 2024',
        description: 'Template standar Karya Tulis Ilmiah sesuai Pedoman KARTUL SETUKPA',
        settings: {
            paperSize: 'A4',
            orientation: 'portrait',
            margins: { top: 4, bottom: 3, left: 4, right: 3 },
            font: {
                family: 'Times New Roman',
                size: 12,
                lineHeight: 1.5
            },
            paragraph: {
                indent: 1.27, // 0.5 inch
                spacing: 1.5
            }
        },
        pages: [
            {
                id: 'p1',
                type: 'TITLE',
                name: 'Halaman Judul',
                order: 0,
                numbering: { type: 'none', position: 'none' },
                content: `<div style="text-align: center;">
                    <p style="margin-top: 3cm; font-size: 14pt; font-weight: bold; line-height: 1.5;">
                        {{JUDUL_MAKALAH}}
                    </p>
                    <p style="margin-top: 5cm; font-size: 12pt;">Disusun Oleh:</p>
                    <p style="font-size: 12pt; font-weight: bold; margin-top: 1cm;">{{NAMA_SISWA}}</p>
                    <p style="font-size: 12pt;">NOSIS: {{NOSIS}}</p>
                    <p style="margin-top: 5cm; font-size: 12pt; font-weight: bold; line-height: 1.5;">
                        SEKOLAH PEMBENTUKAN PERWIRA<br/>
                        KEPOLISIAN NEGARA REPUBLIK INDONESIA<br/>
                        SUKABUMI<br/>
                        2024
                    </p>
                </div>`
            },
            {
                id: 'p2',
                type: 'STATEMENT',
                name: 'Lembar Pernyataan',
                order: 1,
                numbering: { type: 'roman', position: 'bottom-center', startNumber: 2 },
                content: `<h1 style="text-align: center; font-size: 14pt; font-weight: bold;">LEMBAR PERNYATAAN</h1>
                <p style="margin-top: 2cm; text-indent: 1.27cm;">Saya yang bertanda tangan di bawah ini:</p>
                <table style="margin-left: 1.27cm; border: none;">
                    <tr><td style="width: 150px; border: none;">Nama</td><td style="border: none;">: {{NAMA_SISWA}}</td></tr>
                    <tr><td style="border: none;">NOSIS</td><td style="border: none;">: {{NOSIS}}</td></tr>
                </table>
                <p style="margin-top: 1cm; text-indent: 1.27cm; text-align: justify;">
                    Menyatakan dengan sesungguhnya bahwa Karya Tulis Ilmiah yang berjudul 
                    <strong>"{{JUDUL_MAKALAH}}"</strong> adalah benar-benar hasil karya sendiri 
                    dan bukan merupakan plagiat dari karya orang lain.
                </p>
                <div style="margin-top: 3cm; margin-left: 60%; text-align: center;">
                    <p>Sukabumi, _____________ 2024</p>
                    <p>Yang menyatakan,</p>
                    <br/><br/><br/>
                    <p style="font-weight: bold; text-decoration: underline;">{{NAMA_SISWA}}</p>
                    <p>NOSIS: {{NOSIS}}</p>
                </div>`
            },
            {
                id: 'p3',
                type: 'APPROVAL',
                name: 'Lembar Persetujuan',
                order: 2,
                numbering: { type: 'roman', position: 'bottom-center' },
                content: `<h1 style="text-align: center; font-size: 14pt; font-weight: bold;">LEMBAR PERSETUJUAN</h1>
                <p style="margin-top: 2cm; text-indent: 1.27cm; text-align: justify;">
                    Karya Tulis Ilmiah yang berjudul <strong>"{{JUDUL_MAKALAH}}"</strong> 
                    telah disetujui dan disahkan pada:
                </p>
                <table style="margin-left: 1.27cm; margin-top: 1cm; border: none;">
                    <tr><td style="width: 150px; border: none;">Hari, Tanggal</td><td style="border: none;">: _________________________</td></tr>
                    <tr><td style="border: none;">Tempat</td><td style="border: none;">: Sukabumi</td></tr>
                </table>
                <div style="margin-top: 3cm;">
                    <table style="width: 100%; border: none;">
                        <tr>
                            <td style="width: 50%; text-align: center; border: none;">
                                <p>Pembimbing,</p>
                                <br/><br/><br/>
                                <p style="font-weight: bold;">_____________________</p>
                                <p>NRP: ______________</p>
                            </td>
                            <td style="width: 50%; text-align: center; border: none;">
                                <p>Mengetahui,<br/>Kepala Bagian Akademik</p>
                                <br/><br/><br/>
                                <p style="font-weight: bold;">_____________________</p>
                                <p>NRP: ______________</p>
                            </td>
                        </tr>
                    </table>
                </div>`
            },
            {
                id: 'p4',
                type: 'FOREWORD',
                name: 'Kata Pengantar',
                order: 3,
                numbering: { type: 'roman', position: 'bottom-center' },
                content: `<h1 style="text-align: center; font-size: 14pt; font-weight: bold;">KATA PENGANTAR</h1>
                <p style="margin-top: 1cm; text-indent: 1.27cm; text-align: justify;">
                    Puji syukur penulis panjatkan kehadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya 
                    sehingga penulis dapat menyelesaikan Karya Tulis Ilmiah yang berjudul 
                    <strong>"{{JUDUL_MAKALAH}}"</strong>.
                </p>
                <p style="text-indent: 1.27cm; text-align: justify;">
                    [Siswa melanjutkan menulis kata pengantar di sini...]
                </p>
                <div style="margin-top: 2cm; margin-left: 60%; text-align: center;">
                    <p>Sukabumi, _____________ 2024</p>
                    <br/><br/><br/>
                    <p style="font-weight: bold;">{{NAMA_SISWA}}</p>
                </div>`
            },
            {
                id: 'p5',
                type: 'TOC',
                name: 'Daftar Isi',
                order: 4,
                numbering: { type: 'roman', position: 'bottom-center' },
                content: '' // Auto-generated
            },
            {
                id: 'p6',
                type: 'CONTENT',
                name: 'Isi Makalah',
                order: 5,
                numbering: { type: 'arabic', position: 'bottom-center', startNumber: 1, isChapterStart: true },
                structure: [
                    {
                        id: 'bab1',
                        title: 'BAB I PENDAHULUAN',
                        minWords: 500,
                        wordCount: 0,
                        subsections: [
                            { id: 'bab1-a', title: 'A. Latar Belakang', minWords: 250, wordCount: 0, subsections: [] },
                            { id: 'bab1-b', title: 'B. Rumusan Masalah', minWords: 150, wordCount: 0, subsections: [] },
                            { id: 'bab1-c', title: 'C. Tujuan Penulisan', minWords: 100, wordCount: 0, subsections: [] }
                        ]
                    },
                    {
                        id: 'bab2',
                        title: 'BAB II LANDASAN TEORI',
                        minWords: 1000,
                        wordCount: 0,
                        subsections: []
                    },
                    {
                        id: 'bab3',
                        title: 'BAB III PEMBAHASAN',
                        minWords: 1500,
                        wordCount: 0,
                        subsections: []
                    },
                    {
                        id: 'bab4',
                        title: 'BAB IV PENUTUP',
                        minWords: 300,
                        wordCount: 0,
                        subsections: [
                            { id: 'bab4-a', title: 'A. Kesimpulan', minWords: 150, wordCount: 0, subsections: [] },
                            { id: 'bab4-b', title: 'B. Saran', minWords: 150, wordCount: 0, subsections: [] }
                        ]
                    }
                ]
            },
            {
                id: 'p7',
                type: 'REFERENCES',
                name: 'Daftar Pustaka',
                order: 6,
                numbering: { type: 'arabic', position: 'bottom-center' },
                content: `<h1 style="text-align: center; font-size: 14pt; font-weight: bold;">DAFTAR PUSTAKA</h1>
                <p style="margin-top: 1cm; text-indent: 0; text-align: justify; line-height: 1;">
                    [Siswa mengisi daftar pustaka dengan format yang benar]
                </p>`
            },
            {
                id: 'p8',
                type: 'APPENDIX',
                name: 'Lampiran',
                order: 7,
                numbering: { type: 'arabic', position: 'bottom-center' },
                content: `<h1 style="text-align: center; font-size: 14pt; font-weight: bold;">LAMPIRAN</h1>
                <h2 style="text-align: center; font-size: 12pt; font-weight: bold; margin-top: 2cm;">DAFTAR RIWAYAT HIDUP</h2>
                <table style="margin-top: 1cm; margin-left: 1.27cm; border: none; line-height: 1.5;">
                    <tr><td style="width: 200px; border: none;">Nama Lengkap</td><td style="border: none;">: {{NAMA_SISWA}}</td></tr>
                    <tr><td style="border: none;">NOSIS</td><td style="border: none;">: {{NOSIS}}</td></tr>
                    <tr><td style="border: none;">Tempat, Tanggal Lahir</td><td style="border: none;">: ___________________</td></tr>
                    <tr><td style="border: none;">Jenis Kelamin</td><td style="border: none;">: ___________________</td></tr>
                    <tr><td style="border: none;">Agama</td><td style="border: none;">: ___________________</td></tr>
                    <tr><td style="border: none;">Alamat</td><td style="border: none;">: ___________________</td></tr>
                </table>`
            }
        ]
    }
];