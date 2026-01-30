// Chapter type definition
export interface Chapter {
  id: number;
  part: string;           // "Part I: Forwarding"
  title: string;          // "Packet Forwarding"
  description?: string;   // 간략 설명
}

// Question option type
export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
  E?: string;           // 일부 문제는 5지선다
  F?: string;           // 드래그드롭용
}

// Question type definition
export interface Question {
  id: number;
  examPart: string;       // "Exam A" | "Exam B" | "Drag Drop"
  question: string;       // 문제 텍스트
  options?: QuestionOptions;  // single/multiple 문제용
  correctAnswer?: string | string[];  // single/multiple 문제용
  explanation?: string;
  hasImage?: boolean;
  imageUrl?: string;
  type: "single" | "multiple" | "dragdrop";
  category?: string;      // 관련 챕터/주제
  // Drag Drop 전용 필드
  dragItems?: string[];   // 드래그할 항목들
  dropTargets?: Record<string, string[]>;  // 드롭 영역과 정답 매핑
}

// Quiz session type
export interface QuizSession {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, string | string[]>;
  startTime: Date;
  endTime?: Date;
}

// Quiz result type
export interface QuizResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  details: {
    questionId: number;
    userAnswer: string | string[] | null;
    correctAnswer: string | string[];
    isCorrect: boolean;
  }[];
}

// Progress tracking type
export interface StudyProgress {
  chaptersCompleted: number[];
  questionsAnswered: Record<number, {
    correct: boolean;
    attempts: number;
    lastAttempt: string;
  }>;
  totalStudyTime: number;
  lastStudyDate: string;
}
