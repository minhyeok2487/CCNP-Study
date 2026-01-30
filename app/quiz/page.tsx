'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import ProgressBar from '@/components/ProgressBar';
import {
  updateQuestionAnswered,
  saveCurrentQuiz,
  clearCurrentQuiz,
  saveQuizResult,
  getStudyProgress,
} from '@/lib/storage';
import questions from '@/data/questions.json';
import { Question, QuizResult } from '@/types';

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get('mode') || 'all';
  const count = parseInt(searchParams.get('count') || '0');
  const category = searchParams.get('category');
  const examPart = searchParams.get('examPart');

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [, setQuizComplete] = useState(false);

  useEffect(() => {
    let selectedQuestions: Question[] = [];

    if (mode === 'wrong') {
      const progress = getStudyProgress();
      const wrongIds = Object.entries(progress.questionsAnswered)
        .filter(([, data]) => !data.correct)
        .map(([id]) => parseInt(id));
      selectedQuestions = (questions as Question[]).filter((q) =>
        wrongIds.includes(q.id)
      );
    } else if (category && examPart) {
      // category와 examPart 동시 필터
      selectedQuestions = (questions as Question[]).filter(
        (q) => q.category === category && q.examPart === examPart
      );
    } else if (category) {
      selectedQuestions = (questions as Question[]).filter(
        (q) => q.category === category
      );
    } else if (examPart) {
      // examPart 필터 (예: "Drag Drop", "Practice")
      selectedQuestions = (questions as Question[]).filter(
        (q) => q.examPart === examPart
      );
    } else {
      selectedQuestions = [...(questions as Question[])];
    }

    if (mode === 'random') {
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    if (count > 0) {
      selectedQuestions = selectedQuestions.slice(0, count);
    }

    setQuizQuestions(selectedQuestions);
  }, [mode, count, category, examPart]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const currentQuestion = quizQuestions[currentIndex];

  const handleAnswer = (answer: string | string[]) => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    saveCurrentQuiz(newAnswers);

    let isCorrect = false;

    if (currentQuestion.type === 'dragdrop' && currentQuestion.dropTargets) {
      // Drag Drop 문제 정답 체크
      const userAnswer = answer as unknown as Record<string, string[]>;
      isCorrect = Object.keys(currentQuestion.dropTargets).every(target => {
        const correct = [...currentQuestion.dropTargets![target]].sort();
        const user = [...(userAnswer[target] || [])].sort();
        return JSON.stringify(correct) === JSON.stringify(user);
      });
    } else {
      // Single/Multiple 문제 정답 체크
      const correctAnswer = currentQuestion.correctAnswer;
      isCorrect =
        JSON.stringify(
          Array.isArray(answer) ? answer.sort() : [answer]
        ) ===
        JSON.stringify(
          Array.isArray(correctAnswer) ? correctAnswer?.sort() : [correctAnswer]
        );
    }

    updateQuestionAnswered(currentQuestion.id, isCorrect);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
    } else {
      completeQuiz();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowResult(true);
    }
  };

  const completeQuiz = () => {
    const results: QuizResult = {
      totalQuestions: quizQuestions.length,
      correctCount: 0,
      wrongCount: 0,
      skippedCount: 0,
      score: 0,
      details: quizQuestions.map((q) => {
        const userAnswer = answers[q.id] || null;
        let isCorrect = false;

        if (userAnswer !== null) {
          if (q.type === 'dragdrop' && q.dropTargets) {
            // Drag Drop 문제 정답 체크
            const userDragAnswer = userAnswer as unknown as Record<string, string[]>;
            isCorrect = Object.keys(q.dropTargets).every(target => {
              const correct = [...q.dropTargets![target]].sort();
              const user = [...(userDragAnswer[target] || [])].sort();
              return JSON.stringify(correct) === JSON.stringify(user);
            });
          } else {
            // Single/Multiple 문제 정답 체크
            isCorrect =
              JSON.stringify(
                Array.isArray(userAnswer) ? userAnswer.sort() : [userAnswer]
              ) ===
              JSON.stringify(
                Array.isArray(q.correctAnswer)
                  ? q.correctAnswer?.sort()
                  : [q.correctAnswer]
              );
          }
        }

        return {
          questionId: q.id,
          userAnswer,
          correctAnswer: q.type === 'dragdrop' ? 'Drag Drop' : (q.correctAnswer || ''),
          isCorrect,
        };
      }),
    };

    results.correctCount = results.details.filter((d) => d.isCorrect).length;
    results.wrongCount = results.details.filter(
      (d) => !d.isCorrect && d.userAnswer !== null
    ).length;
    results.skippedCount = results.details.filter(
      (d) => d.userAnswer === null
    ).length;
    results.score = Math.round(
      (results.correctCount / results.totalQuestions) * 100
    );

    saveQuizResult(results);
    clearCurrentQuiz();

    // Store result in sessionStorage for result page
    sessionStorage.setItem('quizResult', JSON.stringify(results));
    router.push('/quiz/result');
  };

  if (quizQuestions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {mode === 'wrong'
              ? '오답 노트가 비어있습니다'
              : '문제가 없습니다'}
          </h2>
          <p className="text-gray-600 mb-6">
            {mode === 'wrong'
              ? '아직 틀린 문제가 없습니다. 문제 풀이를 시작해보세요!'
              : '선택한 조건에 맞는 문제가 없습니다.'}
          </p>
          <Link
            href="/quiz"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            전체 문제 풀기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Progress */}
      <div className="mb-4 lg:mb-6">
        <ProgressBar
          current={currentIndex + 1}
          total={quizQuestions.length}
          color="blue"
        />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={quizQuestions.length}
          onAnswer={handleAnswer}
          showResult={showResult}
          userAnswer={answers[currentQuestion.id]}
        />
      )}

      {/* Navigation */}
      <div className="mt-4 lg:mt-6 flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
            currentIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          이전 문제
        </button>

        {showResult && (
          <button
            onClick={handleNext}
            className="px-4 lg:px-6 py-2 bg-blue-600 text-white rounded-lg text-sm lg:text-base font-medium hover:bg-blue-700 transition-colors"
          >
            {currentIndex < quizQuestions.length - 1 ? '다음 문제' : '결과 보기'}
          </button>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mt-6 lg:mt-8">
        <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">문제 목록</h3>
        <div className="flex flex-wrap gap-1.5 lg:gap-2">
          {quizQuestions.map((q, idx) => {
            const answered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowResult(answered);
                }}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : answered
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
