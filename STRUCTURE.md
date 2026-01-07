# Struktur Proyek Karya-Setukpa

## Overview

Proyek ini menggunakan struktur **monorepo standar** dengan frontend dan backend terpisah dalam folder masing-masing.

## Struktur Directory

```
Karya-Setukpa/
├── backend/                    # Backend API (Node.js + Express + Prisma)
│   ├── prisma/                # Database schema dan migrations
│   │   ├── schema.prisma      # Prisma schema
│   │   ├── seed.ts            # Database seeder
│   │   └── dev.db             # SQLite dev database (jika ada)
│   ├── src/                   # Source code backend
│   │   ├── config/           # Konfigurasi (database, env, dll)
│   │   │   ├── index.ts      # Main config
│   │   │   └── database.ts   # Database config
│   │   ├── controllers/      # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── assignmentController.ts
│   │   │   ├── paperController.ts
│   │   │   ├── templateController.ts
│   │   │   └── gradeController.ts
│   │   ├── lib/              # Libraries (Prisma client)
│   │   │   └── prisma.ts
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/           # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── assignmentRoutes.ts
│   │   │   ├── paperRoutes.ts
│   │   │   ├── templateRoutes.ts
│   │   │   └── gradeRoutes.ts
│   │   ├── utils/            # Utility functions
│   │   │   ├── jwt.ts
│   │   │   └── password.ts
│   │   └── server.ts         # Entry point backend
│   ├── .env                  # Environment variables backend
│   ├── .env.example          # Example env file
│   ├── tsconfig.json         # TypeScript config backend
│   └── package.json          # Dependencies backend
│
├── frontend/                   # Frontend (React + Vite + TypeScript)
│   ├── src/                   # Source code frontend
│   │   ├── components/       # React components
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ... (31 components)
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   ├── UserContext.tsx
│   │   │   ├── SystemContext.tsx
│   │   │   ├── TemplateContext.tsx
│   │   │   └── AssignmentContext.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Editor.tsx
│   │   │   ├── Assignments.tsx
│   │   │   ├── Grades.tsx
│   │   │   └── ... (23 pages)
│   │   ├── services/         # API service layer
│   │   │   ├── api.ts        # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── userService.ts
│   │   │   ├── assignmentService.ts
│   │   │   ├── paperService.ts
│   │   │   ├── templateService.ts
│   │   │   └── gradeService.ts
│   │   ├── utils/            # Utility functions
│   │   │   └── ... (utility files)
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point (Vite standard)
│   │   └── types.ts          # TypeScript type definitions
│   ├── public/               # Static assets (images, fonts, etc)
│   ├── index.html            # HTML template
│   ├── vite.config.ts        # Vite configuration
│   ├── tsconfig.json         # TypeScript config frontend
│   ├── package.json          # Dependencies frontend
│   ├── .env                  # Environment variables frontend
│   └── .env.local            # Local env overrides
│
├── package.json               # Root package.json (workspace scripts)
├── start.bat                  # Quick start script untuk Windows
├── README.md                  # Dokumentasi utama
└── STRUCTURE.md              # Dokumentasi struktur (file ini)
```

## Mengapa Struktur Ini?

Struktur ini mengikuti **best practice monorepo** dengan pemisahan yang jelas antara frontend dan backend:

1. **Separation of Concerns**: Frontend dan backend terpisah sepenuhnya
2. **Independent Deployment**: Masing-masing bisa di-deploy secara terpisah
3. **Clear Dependencies**: Dependencies frontend dan backend tidak tercampur
4. **Standard Convention**: Mengikuti konvensi Vite (main.tsx) dan Express
5. **Scalability**: Mudah untuk menambahkan workspace baru (mobile app, admin panel, dll)

## Port Configuration

- **Backend**: Port 3001 (`http://localhost:3001`)
- **Frontend**: Port 5173 (`http://localhost:5173`)
- **API Endpoint**: `http://localhost:3001/api`

Frontend menggunakan Vite proxy untuk forward request `/api/*` ke backend.

## Environment Variables

### Backend (.env di folder backend/)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/setukpa_db
JWT_SECRET=setukpa-secret-2024
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env di root folder)
```
VITE_API_URL=http://localhost:3001/api
```

## Development Workflow

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `npm run dev` (di root folder)
3. **Atau gunakan**: `npm run dev:all` untuk start keduanya sekaligus

## Database

Backend menggunakan:
- PostgreSQL sebagai database
- Prisma sebagai ORM
- Schema ada di `backend/prisma/schema.prisma`

## Build untuk Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ..
npm run build
```

Frontend build output akan ada di folder `dist/`.
Backend build output akan ada di folder `backend/dist/`.
