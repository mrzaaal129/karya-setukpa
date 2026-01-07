-- Database Optimization for 2000+ Concurrent Users
-- Run these SQL commands on your PostgreSQL database

-- 1. Indexes for Papers table (most queried)
CREATE INDEX IF NOT EXISTS idx_papers_assignment_user ON "Paper"("assignmentId", "userId");
CREATE INDEX IF NOT EXISTS idx_papers_updated ON "Paper"("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_papers_user ON "Paper"("userId");

-- 2. Indexes for Assignments table
CREATE INDEX IF NOT EXISTS idx_assignments_batch ON "Assignment"("batchId");
CREATE INDEX IF NOT EXISTS idx_assignments_template ON "Assignment"("templateId");
CREATE INDEX IF NOT EXISTS idx_assignments_activation ON "Assignment"("activationDate");

-- 3. Indexes for ChapterSchedule (for locking logic)
CREATE INDEX IF NOT EXISTS idx_chapter_schedule_assignment ON "ChapterSchedule"("assignmentId");
CREATE INDEX IF NOT EXISTS idx_chapter_schedule_open ON "ChapterSchedule"("isOpen");

-- 4. Indexes for Users (for fetching student lists)
CREATE INDEX IF NOT EXISTS idx_users_role_active ON "User"("role", "isActive");
CREATE INDEX IF NOT EXISTS idx_users_batch ON "User"("batchId");

-- 5. Indexes for Comments (for loading comments quickly)
CREATE INDEX IF NOT EXISTS idx_comments_paper ON "Comment"("paperId");
CREATE INDEX IF NOT EXISTS idx_comments_author ON "Comment"("authorId");

-- 6. Full-text search index for plagiarism detection (optional, advanced)
-- This allows fast content similarity checks
-- Uncomment if implementing plagiarism checking
-- CREATE INDEX IF NOT EXISTS idx_papers_content_fts ON "Paper" 
-- USING GIN(to_tsvector('indonesian', content));

-- Analyze tables to update statistics (improves query planner)
ANALYZE "Paper";
ANALYZE "Assignment";
ANALYZE "User";
ANALYZE "ChapterSchedule";
ANALYZE "Comment";
