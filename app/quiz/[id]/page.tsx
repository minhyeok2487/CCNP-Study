'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from '@/components/QuestionCard';
import { updateQuestionAnswered, getStudyProgress } from '@/lib/storage';
import questions from '@/data/questions.json';
import { Question } from '@/types';

export default function SingleQuestionPage() {
  const params = useParams();
  const questionId = parseInt(params.id as string);

  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string | string[] | null>(null);

  const question = (questions as Question[]).find((q) => q.id === questionId);
  const questionIndex = (questions as Question[]).findIndex(
    (q) => q.id === questionId
  );

  useEffect(() => {
    const progress = getStudyProgress();
    const answered = progress.questionsAnswered[questionId];
    if (answered) {
      setShowResult(true);
    }
  }, [questionId]);

  const handleAnswer = (answer: string | string[]) => {
    if (!question) return;

    setUserAnswer(answer);

    const correctAnswer = question.correctAnswer;
    const isCorrect =
      JSON.stringify(
        Array.isArray(answer) ? answer.sort() : [answer]
      ) ===
      JSON.stringify(
        Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer]
      );

    updateQuestionAnswered(question.id, isCorrect);
    setShowResult(true);
  };

  if (!question) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            문제를 찾을 수 없습니다
          </h2>
          <Link
            href="/quiz"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            문제 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const prevQuestion = questionIndex > 0 ? (questions as Question[])[questionIndex - 1] : null;
  const nextQuestion =
    questionIndex < questions.length - 1
      ? (questions as Question[])[questionIndex + 1]
      : null;

  return (
    <div className="max-w-3xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Question Info */}
      <div className="mb-4 lg:mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs lg:text-sm text-gray-500">{question.examPart}</span>
          {question.category && (
            <span className="text-xs lg:text-sm text-gray-400 ml-2">
              | {question.category}
            </span>
          )}
        </div>
        <Link
          href="/quiz"
          className="text-blue-600 hover:text-blue-700 text-xs lg:text-sm font-medium"
        >
          전체 문제 보기
        </Link>
      </div>

      {/* Question Card */}
      <QuestionCard
        question={question}
        questionNumber={questionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        showResult={showResult}
        userAnswer={userAnswer}
      />

      {/* Navigation */}
      <div className="mt-4 lg:mt-6 flex justify-between">
        {prevQuestion ? (
          <Link
            href={`/quiz/${prevQuestion.id}`}
            className="px-3 lg:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm lg:text-base font-medium hover:bg-gray-300 transition-colors"
          >
            이전 문제
          </Link>
        ) : (
          <div />
        )}

        {nextQuestion ? (
          <Link
            href={`/quiz/${nextQuestion.id}`}
            className="px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg text-sm lg:text-base font-medium hover:bg-blue-700 transition-colors"
          >
            다음 문제
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mt-6 lg:mt-8">
        <h3 className="text-xs lg:text-sm font-medium text-gray-600 mb-2">
          {question.examPart} 문제 목록
        </h3>
        <div className="flex flex-wrap gap-1.5 lg:gap-2">
          {(questions as Question[])
            .filter((q) => q.examPart === question.examPart)
            .map((q) => (
              <Link
                key={q.id}
                href={`/quiz/${q.id}`}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg text-xs lg:text-sm font-medium flex items-center justify-center transition-colors ${
                  q.id === questionId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {q.id}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
