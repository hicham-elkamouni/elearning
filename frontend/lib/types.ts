export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  thumbnailUrl?: string;
  teacher: Pick<User, 'id' | 'firstName' | 'lastName'>;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: 'video' | 'pdf' | 'text';
  fileUrl?: string;
  order: number;
  courseId: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  courseId: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  score: number;
  submittedAt: string;
  answers: Record<string, string>;
}

export interface Progress {
  lessonId: string;
  isCompleted: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
}
