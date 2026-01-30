import { StudyProgress, QuizResult } from '@/types';

const STORAGE_KEYS = {
  STUDY_PROGRESS: 'ccnp-study-progress',
  QUIZ_HISTORY: 'ccnp-quiz-history',
  CURRENT_QUIZ: 'ccnp-current-quiz',
};

// Study Progress
export const getStudyProgress = (): StudyProgress => {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }

  const stored = localStorage.getItem(STORAGE_KEYS.STUDY_PROGRESS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getDefaultProgress();
    }
  }
  return getDefaultProgress();
};

export const saveStudyProgress = (progress: StudyProgress): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STUDY_PROGRESS, JSON.stringify(progress));
};

export const updateChapterCompleted = (chapterId: number): void => {
  const progress = getStudyProgress();
  if (!progress.chaptersCompleted.includes(chapterId)) {
    progress.chaptersCompleted.push(chapterId);
    progress.lastStudyDate = new Date().toISOString();
    saveStudyProgress(progress);
  }
};

export const updateQuestionAnswered = (
  questionId: number,
  correct: boolean
): void => {
  const progress = getStudyProgress();
  const existing = progress.questionsAnswered[questionId];

  progress.questionsAnswered[questionId] = {
    correct,
    attempts: existing ? existing.attempts + 1 : 1,
    lastAttempt: new Date().toISOString(),
  };
  progress.lastStudyDate = new Date().toISOString();

  saveStudyProgress(progress);
};

// Quiz History
export const getQuizHistory = (): QuizResult[] => {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveQuizResult = (result: QuizResult): void => {
  if (typeof window === 'undefined') return;

  const history = getQuizHistory();
  history.push(result);

  // Keep only last 50 results
  if (history.length > 50) {
    history.shift();
  }

  localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(history));
};

// Current Quiz Session
export const saveCurrentQuiz = (answers: Record<number, string | string[]>): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_QUIZ, JSON.stringify(answers));
};

export const getCurrentQuiz = (): Record<number, string | string[]> | null => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_QUIZ);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const clearCurrentQuiz = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_QUIZ);
};

// Utility functions
function getDefaultProgress(): StudyProgress {
  return {
    chaptersCompleted: [],
    questionsAnswered: {},
    totalStudyTime: 0,
    lastStudyDate: new Date().toISOString(),
  };
}

export const getStatistics = () => {
  const progress = getStudyProgress();
  const history = getQuizHistory();

  const totalQuestions = Object.keys(progress.questionsAnswered).length;
  const correctQuestions = Object.values(progress.questionsAnswered)
    .filter(q => q.correct).length;

  const recentQuizzes = history.slice(-10);
  const averageScore = recentQuizzes.length > 0
    ? recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length
    : 0;

  return {
    chaptersCompleted: progress.chaptersCompleted.length,
    totalQuestionsAnswered: totalQuestions,
    correctAnswers: correctQuestions,
    accuracy: totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0,
    totalQuizzes: history.length,
    averageScore,
    lastStudyDate: progress.lastStudyDate,
  };
};
