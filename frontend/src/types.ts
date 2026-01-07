export enum AssignmentStatus {
  Scheduled = 'SCHEDULED',
  Draft = 'DRAFT',
  Submitted = 'SUBMITTED',
  UnderReview = 'UNDER_REVIEW',
  Revision = 'REVISION',
  Approved = 'APPROVED',
  Completed = 'COMPLETED',
}

export enum UserRole {
  SuperAdmin = 'SUPER_ADMIN',
  Admin = 'ADMIN',
  Siswa = 'SISWA',
  Penguji = 'PENGUJI',
  Pembimbing = 'PEMBIMBING',
}

export interface User {
  id: string;
  nosis: string;
  name: string;
  role: UserRole;
  pembimbingId?: string;
  photoUrl?: string;
  email?: string; // Also adding email as it was missing but used in modal
}

export interface ChapterSchedule {
  id?: string;
  assignmentId?: string;
  chapterId: string; // Reference to PaperStructure.id from template
  chapterTitle: string;
  chapterOrder?: number;
  isOpen: boolean;
  openDate?: string; // ISO datetime
  closeDate?: string; // ISO datetime
  isManuallyOpened?: boolean;  // Super Admin can force open
  isManuallyClosed?: boolean;  // Super Admin can force close
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterAccess {
  chapterId: string;
  isOpen: boolean;
  openDate?: Date;
  closeDate?: Date;
  daysUntilOpen?: number;
  daysUntilClose?: number;
  status: 'locked' | 'open' | 'closed' | 'upcoming';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  status: AssignmentStatus;
  templateId?: string;
  progress?: number;
  totalWords?: number;
  activationDate?: string;
  chapterSchedules?: ChapterSchedule[];
  myPaperId?: string;
}

export interface PaperStructure {
  id: string;
  title: string;
  wordCount: number;
  minWords: number;
  subsections?: PaperStructure[];
}

export type TemplatePageType = 'TITLE' | 'STATEMENT' | 'APPROVAL' | 'FOREWORD' | 'TOC' | 'LIST_OF_TABLES' | 'LIST_OF_FIGURES' | 'CONTENT' | 'REFERENCES' | 'APPENDIX';

export type PageNumberType = 'none' | 'roman' | 'arabic';
export type PageNumberPosition = 'none' | 'top-center' | 'bottom-center' | 'top-right';

export interface PageNumbering {
  type: PageNumberType;
  position: PageNumberPosition;
  startNumber?: number;
  isChapterStart?: boolean; // True jika halaman pertama BAB (nomor di bawah)
}

export interface TemplatePage {
  id: string;
  type: TemplatePageType;
  name: string;
  content?: string;
  order: number;
  structure?: PaperStructure[];
  numbering: PageNumbering;
}

export interface PageSettings {
  paperSize: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  font: {
    family: string;
    size: number;
    lineHeight: number;
  };
  paragraph: {
    indent: number; // in cm
    spacing: number; // line spacing multiplier
  };
}

export interface PaperTemplate {
  id: string;
  name: string;
  description: string;
  settings: PageSettings;
  pages: TemplatePage[];
  updatedAt?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  text: string;
}

export interface Paper {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  content: string;
  structure: PaperStructure[];
  wordCount: number;
  pageCount: number;
  totalWords: number;
  totalPages: number;
  timerDuration: number;
  comments?: Comment[];
}

export interface Grade {
  id: string;
  paperId: string;
  finalScore: number;
  rubric: {
    content: number;
    structure: number;
    language: number;
    format: number;
  };
  maxScores: {
    content: number;
    structure: number;
    language: number;
    format: number;
  };
  examiners: {
    id: string;
    name: string;
    score: number;
    feedback: string;
  }[];
  advisorFeedback: string;
}