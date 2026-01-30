'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QuizResult } from '@/types';
import questions from '@/data/questions.json';
import { Question } from '@/types';

export default function ResultPage() {
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('quizResult');
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            결과를 찾을 수 없습니다
          </h2>
          <Link
            href="/quiz"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            문제 풀이 시작하기
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return '훌륭합니다! 합격권에 가까워지고 있습니다.';
    if (score >= 60) return '조금 더 노력하면 합격할 수 있습니다.';
    return '기본 개념을 다시 복습해보세요.';
  };

  return (
    <div className="max-w-3xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Score Card */}
      <div className="bg-white rounded-xl shadow-lg p-4 lg:p-8 text-center mb-4 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">퀴즈 결과</h1>

        <div className={`text-4xl lg:text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
          {result.score}점
        </div>

        <p className="text-sm lg:text-base text-gray-600 mb-4 lg:mb-6">{getScoreMessage(result.score)}</p>

        <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
          <div className="bg-green-50 rounded-lg p-2 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-green-600">
              {result.correctCount}
            </div>
            <div className="text-xs lg:text-sm text-green-700">정답</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-red-600">
              {result.wrongCount}
            </div>
            <div className="text-xs lg:text-sm text-red-700">오답</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 lg:p-4">
            <div className="text-xl lg:text-2xl font-bold text-gray-600">
              {result.skippedCount}
            </div>
            <div className="text-xs lg:text-sm text-gray-700">건너뜀</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 mb-4 lg:mb-8">
        <Link
          href="/quiz?mode=random&count=10"
          className="flex-1 bg-blue-600 text-white py-2.5 lg:py-3 px-4 rounded-lg text-sm lg:text-base font-medium text-center hover:bg-blue-700 transition-colors"
        >
          다시 풀기
        </Link>
        <Link
          href="/quiz?mode=wrong"
          className="flex-1 bg-red-100 text-red-700 py-2.5 lg:py-3 px-4 rounded-lg text-sm lg:text-base font-medium text-center hover:bg-red-200 transition-colors"
        >
          오답 노트
        </Link>
        <Link
          href="/"
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 lg:py-3 px-4 rounded-lg text-sm lg:text-base font-medium text-center hover:bg-gray-200 transition-colors"
        >
          홈으로
        </Link>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-xl shadow-lg p-3 lg:p-6">
        <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
          문제별 결과
        </h2>

        <div className="space-y-3 lg:space-y-4">
          {result.details.map((detail, index) => {
            const question = (questions as Question[]).find(
              (q) => q.id === detail.questionId
            );

            return (
              <div
                key={detail.questionId}
                className={`p-3 lg:p-4 rounded-lg border ${
                  detail.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : detail.userAnswer === null
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 lg:mb-2">
                      <span
                        className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                          detail.isCorrect
                            ? 'bg-green-500 text-white'
                            : detail.userAnswer === null
                            ? 'bg-gray-400 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`text-xs lg:text-sm font-medium ${
                          detail.isCorrect
                            ? 'text-green-700'
                            : detail.userAnswer === null
                            ? 'text-gray-600'
                            : 'text-red-700'
                        }`}
                      >
                        {detail.isCorrect
                          ? '정답'
                          : detail.userAnswer === null
                          ? '건너뜀'
                          : '오답'}
                      </span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-700 line-clamp-2">
                      {question?.question}
                    </p>
                    {!detail.isCorrect && (
                      <div className="mt-1.5 lg:mt-2 text-xs lg:text-sm">
                        <span className="text-gray-500">정답: </span>
                        <span className="font-medium text-green-700">
                          {Array.isArray(detail.correctAnswer)
                            ? detail.correctAnswer.join(', ')
                            : detail.correctAnswer}
                        </span>
                        {detail.userAnswer && (
                          <span className="block sm:inline mt-1 sm:mt-0">
                            <span className="text-gray-500 sm:ml-2">
                              선택한 답:
                            </span>
                            <span className="font-medium text-red-700 ml-1">
                              {Array.isArray(detail.userAnswer)
                                ? detail.userAnswer.join(', ')
                                : detail.userAnswer}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/quiz/${detail.questionId}`}
                    className="text-blue-600 hover:text-blue-700 text-xs lg:text-sm font-medium flex-shrink-0"
                  >
                    상세보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
