# Sistem Manajemen Makalah Digital SETUKPA

Sistem manajemen makalah online profesional untuk Sekolah Pembentukan Perwira Kepolisian Negara Republik Indonesia (SETUKPA).

## 🚀 Fitur Utama

- **Multi-Role System**: Super Admin, Admin, Pembimbing, Penguji, dan Siswa
- **Template Management**: Sistem template makalah yang dapat dikustomisasi
- **Real-time Editor**: Editor makalah dengan tracking word count dan struktur
- **Chapter Scheduling**: Jadwal pembukaan per bab untuk kontrol pengerjaan
- **Grading System**: Sistem penilaian dengan rubrik dan feedback dari penguji
- **Comment System**: Komunikasi antara pembimbing dan siswa
- **Authentication**: Sistem login yang aman dengan JWT

## 📋 Prerequisites

Sebelum menjalankan aplikasi, pastikan Anda telah menginstall:

- **Node.js** (v18 atau lebih baru)
- **PostgreSQL** (v14 atau lebih baru)
- **npm** atau **yarn**

## 🛠️ Installation & Setup

### 1. Clone Repository

```bash
cd Karya-Setukpa
```

### 2. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Setup environment variables
# Edit file .env dan sesuaikan dengan konfigurasi database Anda
# DATABASE_URL="postgresql://username:password@localhost:5432/setukpa_db"

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database dengan data demo
npm run prisma:seed
```

### 3. Setup Frontend

```bash
# Kembali ke root folder
cd ..

# Install dependencies frontend
npm install
```

## 🎯 Running the Application

### Quick Start (Recommended)

```bash
# Di root folder, jalankan backend dan frontend sekaligus
npm run dev:all
```

### Manual Start

#### Start Backend Server

```bash
# Di folder backend
cd backend
npm run dev
```

Backend akan berjalan di `http://localhost:3001`

#### Start Frontend

```bash
# Di root folder (buka terminal baru)
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 🔑 Default Login Credentials

Setelah seeding database, gunakan credentials berikut untuk login:

| Role | NOSIS | Password |
|------|-------|----------|
| Super Admin | SA001 | password123 |
| Admin | ADM001 | password123 |
| Pembimbing | PB001 | password123 |
| Penguji | PG001 | password123 |
| Siswa | 2024001 | password123 |

## 📁 Struktur Project

```
Karya-Setukpa/
├── backend/                    # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── lib/               # Libraries (Prisma client)
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Utility functions
│   │   └── server.ts          # Entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # Entry point
│   │   └── types.ts           # TypeScript types
│   ├── public/                # Static assets
│   ├── index.html             # HTML template
│   ├── vite.config.ts         # Vite configuration
│   ├── tsconfig.json          # TypeScript config
│   ├── .env                   # Environment variables
│   └── package.json
│
├── package.json               # Root workspace scripts
├── start.bat                  # Quick start script
├── README.md
└── STRUCTURE.md               # Detailed structure documentation

```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/pembimbing` - Get pembimbing list

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment
- `PUT /api/assignments/:id/schedules` - Update chapter schedules

### Papers
- `GET /api/papers` - Get all papers
- `GET /api/papers/:id` - Get paper by ID
- `POST /api/papers` - Create paper
- `PUT /api/papers/:id` - Update paper
- `DELETE /api/papers/:id` - Delete paper
- `POST /api/papers/:id/comments` - Add comment

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get template by ID
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Grades
- `GET /api/grades/paper/:paperId` - Get grade by paper ID
- `POST /api/grades` - Create grade
- `PUT /api/grades/:id` - Update grade

## 🗄️ Database Schema

Database menggunakan PostgreSQL dengan Prisma ORM. Schema utama:

- **User**: Data pengguna dengan berbagai role
- **Assignment**: Tugas makalah
- **Paper**: Dokumen makalah siswa
- **PaperTemplate**: Template makalah
- **Grade**: Nilai dan feedback
- **Comment**: Komentar pada makalah
- **ChapterSchedule**: Jadwal pembukaan bab

## 🎨 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM untuk database
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool

## 📝 Development

### Database Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Build for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ..
npm run build
```

## 🤝 Support

Untuk pertanyaan atau dukungan, silakan hubungi tim IT SETUKPA.

## 📄 License

Copyright © 2024 SETUKPA. All rights reserved.
