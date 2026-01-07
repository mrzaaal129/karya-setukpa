-- ============================================
-- SETUKPA Database Schema - PostgreSQL
-- Complete SQL Script for Database Setup
-- ============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS "ExaminerGrade" CASCADE;
DROP TABLE IF EXISTS "Grade" CASCADE;
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Paper" CASCADE;
DROP TABLE IF EXISTS "ChapterSchedule" CASCADE;
DROP TABLE IF EXISTS "Assignment" CASCADE;
DROP TABLE IF EXISTS "PaperTemplate" CASCADE;
DROP TABLE IF EXISTS "ActivityLog" CASCADE;
DROP TABLE IF EXISTS "Violation" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- User Table
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "nosis" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL CHECK ("role" IN ('SUPER_ADMIN', 'ADMIN', 'SISWA', 'PENGUJI', 'PEMBIMBING')),
    "pembimbingId" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("pembimbingId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_pembimbingId_idx" ON "User"("pembimbingId");

-- PaperTemplate Table
CREATE TABLE "PaperTemplate" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "pages" JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "PaperTemplate_name_idx" ON "PaperTemplate"("name");

-- Assignment Table
CREATE TABLE "Assignment" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "deadline" TIMESTAMP NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK ("status" IN ('SCHEDULED', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION', 'APPROVED', 'COMPLETED')),
    "templateId" TEXT,
    "progress" INTEGER DEFAULT 0 NOT NULL,
    "totalWords" INTEGER DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("templateId") REFERENCES "PaperTemplate"("id") ON DELETE SET NULL
);

CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");
CREATE INDEX "Assignment_deadline_idx" ON "Assignment"("deadline");

-- ChapterSchedule Table
CREATE TABLE "ChapterSchedule" (
    "id" TEXT PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "isOpen" BOOLEAN DEFAULT FALSE NOT NULL,
    "openDate" TIMESTAMP,
    "closeDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE,
    UNIQUE ("assignmentId", "chapterId")
);

CREATE INDEX "ChapterSchedule_assignmentId_idx" ON "ChapterSchedule"("assignmentId");

-- Paper Table
CREATE TABLE "Paper" (
    "id" TEXT PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "wordCount" INTEGER DEFAULT 0 NOT NULL,
    "pageCount" INTEGER DEFAULT 0 NOT NULL,
    "totalWords" INTEGER DEFAULT 0 NOT NULL,
    "totalPages" INTEGER DEFAULT 0 NOT NULL,
    "timerDuration" INTEGER DEFAULT 0 NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE ("assignmentId", "userId")
);

CREATE INDEX "Paper_userId_idx" ON "Paper"("userId");
CREATE INDEX "Paper_assignmentId_idx" ON "Paper"("assignmentId");

-- Comment Table
CREATE TABLE "Comment" (
    "id" TEXT PRIMARY KEY,
    "paperId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE,
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Comment_paperId_idx" ON "Comment"("paperId");
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- Grade Table
CREATE TABLE "Grade" (
    "id" TEXT PRIMARY KEY,
    "paperId" TEXT UNIQUE NOT NULL,
    "advisorId" TEXT NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "contentScore" DOUBLE PRECISION NOT NULL,
    "structureScore" DOUBLE PRECISION NOT NULL,
    "languageScore" DOUBLE PRECISION NOT NULL,
    "formatScore" DOUBLE PRECISION NOT NULL,
    "maxContent" DOUBLE PRECISION DEFAULT 40 NOT NULL,
    "maxStructure" DOUBLE PRECISION DEFAULT 30 NOT NULL,
    "maxLanguage" DOUBLE PRECISION DEFAULT 20 NOT NULL,
    "maxFormat" DOUBLE PRECISION DEFAULT 10 NOT NULL,
    "advisorFeedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE,
    FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Grade_paperId_idx" ON "Grade"("paperId");

-- ExaminerGrade Table
CREATE TABLE "ExaminerGrade" (
    "id" TEXT PRIMARY KEY,
    "gradeId" TEXT NOT NULL,
    "examinerId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE,
    FOREIGN KEY ("examinerId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "ExaminerGrade_gradeId_idx" ON "ExaminerGrade"("gradeId");
CREATE INDEX "ExaminerGrade_examinerId_idx" ON "ExaminerGrade"("examinerId");

-- Violation Table
CREATE TABLE "Violation" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolved" BOOLEAN DEFAULT FALSE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Violation_userId_idx" ON "Violation"("userId");
CREATE INDEX "Violation_resolved_idx" ON "Violation"("resolved");

-- ActivityLog Table
CREATE TABLE "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('success', 'info', 'warning', 'error')),
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- ============================================
-- INSERT SEED DATA
-- ============================================

-- Insert Users (password: password123, hashed with bcrypt)
INSERT INTO "User" ("id", "nosis", "name", "email", "password", "role", "pembimbingId", "createdAt", "updatedAt") VALUES
('sa-1', 'SA001', 'Super Admin SETUKPA', 'superadmin@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'SUPER_ADMIN', NULL, NOW(), NOW()),
('adm-1', 'ADM001', 'Admin Akademik', 'admin@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'ADMIN', NULL, NOW(), NOW()),
('pb-1', 'PB001', 'Prof. Jane Smith', 'jane.smith@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'PEMBIMBING', NULL, NOW(), NOW()),
('pb-2', 'PB002', 'Dr. Ahmad Subarjo', 'ahmad.subarjo@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'PEMBIMBING', NULL, NOW(), NOW()),
('pb-3', 'PB003', 'Ir. Soekarno', 'soekarno@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'PEMBIMBING', NULL, NOW(), NOW()),
('pg-1', 'PG001', 'Dr. John Doe', 'john.doe@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'PENGUJI', NULL, NOW(), NOW()),
('pg-2', 'PG002', 'Prof. Maria Garcia', 'maria.garcia@setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'PENGUJI', NULL, NOW(), NOW()),
('siswa-1', '2024001', 'Budi Santoso', 'budi.santoso@siswa.setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'SISWA', 'pb-1', NOW(), NOW()),
('siswa-2', '2024002', 'Ani Yudhoyono', 'ani.yudhoyono@siswa.setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'SISWA', 'pb-2', NOW(), NOW()),
('siswa-3', '2024003', 'Charlie van Houten', 'charlie.vh@siswa.setukpa.ac.id', '$2a$10$YourHashedPasswordHere', 'SISWA', 'pb-1', NOW(), NOW());

-- Insert PaperTemplate
INSERT INTO "PaperTemplate" ("id", "name", "description", "settings", "pages", "createdAt", "updatedAt") VALUES
('template-1', 'Template Karya Tulis Ilmiah SETUKPA 2024', 'Template standar Karya Tulis Ilmiah sesuai Pedoman KARTUL SETUKPA', 
'{"paperSize": "A4", "orientation": "portrait", "margins": {"top": 4, "bottom": 3, "left": 4, "right": 3}, "font": {"family": "Times New Roman", "size": 12, "lineHeight": 1.5}, "paragraph": {"indent": 1.27, "spacing": 1.5}}'::jsonb,
'[{"id": "p1", "type": "TITLE", "name": "Halaman Judul", "order": 0, "numbering": {"type": "none", "position": "none"}}, {"id": "p2", "type": "CONTENT", "name": "Isi Makalah", "order": 1, "numbering": {"type": "arabic", "position": "bottom-center"}}]'::jsonb,
NOW(), NOW());

-- Insert Assignments
INSERT INTO "Assignment" ("id", "title", "subject", "deadline", "status", "templateId", "progress", "totalWords", "createdAt", "updatedAt") VALUES
('assign-1', 'Makalah Etika Profesi Polri', 'Etika Kepolisian', '2024-12-20 23:59:00', 'DRAFT', 'template-1', 1250, 3000, NOW(), NOW()),
('assign-2', 'Prokap Manajemen Konflik Sosial', 'Manajemen Operasional', '2024-08-10 23:59:00', 'COMPLETED', 'template-1', 3500, 3500, NOW(), NOW()),
('assign-3', 'Analisis Kebijakan Publik', 'Administrasi Publik', '2024-07-30 23:59:00', 'COMPLETED', NULL, 0, 0, NOW(), NOW()),
('assign-4', 'Strategi Intelijen Keamanan', 'Intelijen', '2025-01-25 23:59:00', 'SCHEDULED', NULL, 0, 0, NOW(), NOW()),
('assign-5', 'Tinjauan Hukum Pidana Modern', 'Hukum Pidana', '2024-12-12 23:59:00', 'UNDER_REVIEW', NULL, 0, 0, NOW(), NOW());

-- Insert Papers
INSERT INTO "Paper" ("id", "assignmentId", "userId", "title", "subject", "content", "structure", "wordCount", "pageCount", "totalWords", "totalPages", "timerDuration", "createdAt", "updatedAt") VALUES
('paper-1', 'assign-1', 'siswa-1', 'Makalah Etika Profesi Polri', 'Etika Kepolisian', '<h1>BAB I: PENDAHULUAN</h1><p>Polri sebagai institusi penegak hukum...</p>', '[]'::jsonb, 1250, 5, 3000, 10, 10800, NOW(), NOW()),
('paper-2', 'assign-2', 'siswa-1', 'Prokap Manajemen Konflik Sosial', 'Manajemen Operasional', '<h1>BAB I: PENDAHULUAN</h1><p>Makalah lengkap...</p>', '[]'::jsonb, 3500, 15, 3500, 15, 14400, NOW(), NOW());

-- Insert Grades
INSERT INTO "Grade" ("id", "paperId", "advisorId", "finalScore", "contentScore", "structureScore", "languageScore", "formatScore", "advisorFeedback", "createdAt", "updatedAt") VALUES
('grade-1', 'paper-2', 'pb-1', 85, 35, 28, 15, 7, 'Secara keseluruhan, makalah ini sudah sangat baik.', NOW(), NOW());

-- Insert ExaminerGrades
INSERT INTO "ExaminerGrade" ("id", "gradeId", "examinerId", "score", "feedback", "createdAt", "updatedAt") VALUES
('eg-1', 'grade-1', 'pg-1', 83, 'Analisis sudah cukup tajam, namun bisa diperdalam lagi.', NOW(), NOW()),
('eg-2', 'grade-1', 'pg-2', 87, 'Struktur penulisan sangat baik dan sistematis.', NOW(), NOW());

-- Insert Violations
INSERT INTO "Violation" ("id", "userId", "type", "description", "date", "resolved", "createdAt", "updatedAt") VALUES
('viol-1', 'siswa-3', 'Plagiarisme', 'Terdeteksi kesamaan konten dengan sumber eksternal tanpa sitasi yang memadai', '2024-11-20', FALSE, NOW(), NOW()),
('viol-2', 'siswa-1', 'Keterlambatan', 'Pengumpulan BAB I melewati deadline yang ditentukan', '2024-11-22', FALSE, NOW(), NOW());

-- Insert ActivityLogs
INSERT INTO "ActivityLog" ("id", "userId", "action", "type", "metadata", "createdAt") VALUES
('act-1', 'siswa-1', 'Mengumpulkan makalah', 'success', '{"assignmentId": "assign-1"}'::jsonb, NOW() - INTERVAL '5 minutes'),
('act-2', 'siswa-2', 'Membuat template baru', 'info', NULL, NOW() - INTERVAL '12 minutes'),
('act-3', 'siswa-3', 'Pelanggaran terdeteksi', 'warning', NULL, NOW() - INTERVAL '1 hour'),
('act-4', 'adm-1', 'Menyelesaikan review', 'success', NULL, NOW() - INTERVAL '2 hours'),
('act-5', 'adm-1', 'Mengupdate jadwal sidang', 'info', NULL, NOW() - INTERVAL '3 hours'),
('act-6', 'siswa-1', 'Mengedit BAB II', 'info', NULL, NOW() - INTERVAL '4 hours'),
('act-7', 'pb-1', 'Memberikan komentar pada makalah', 'success', NULL, NOW() - INTERVAL '5 hours'),
('act-8', 'siswa-2', 'Mengunduh template', 'info', NULL, NOW() - INTERVAL '6 hours'),
('act-9', 'pg-1', 'Memberikan nilai', 'success', NULL, NOW() - INTERVAL '7 hours'),
('act-10', 'sa-1', 'Membuat assignment baru', 'info', NULL, NOW() - INTERVAL '8 hours');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check data counts
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Templates', COUNT(*) FROM "PaperTemplate"
UNION ALL
SELECT 'Assignments', COUNT(*) FROM "Assignment"
UNION ALL
SELECT 'Papers', COUNT(*) FROM "Paper"
UNION ALL
SELECT 'Grades', COUNT(*) FROM "Grade"
UNION ALL
SELECT 'Violations', COUNT(*) FROM "Violation"
UNION ALL
SELECT 'ActivityLogs', COUNT(*) FROM "ActivityLog";
