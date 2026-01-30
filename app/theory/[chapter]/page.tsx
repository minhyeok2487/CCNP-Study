'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TheoryContent from '@/components/TheoryContent';
import { getStudyProgress, updateChapterCompleted } from '@/lib/storage';
import chapters from '@/data/chapters.json';
import questions from '@/data/questions.json';
import { Chapter, Question } from '@/types';

export default function ChapterPage() {
  const params = useParams();
  const chapterId = parseInt(params.chapter as string);

  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const chapter = (chapters as Chapter[]).find((c) => c.id === chapterId);
  const relatedQuestions = (questions as Question[]).filter(
    (q) => q.category === chapter?.title
  );

  useEffect(() => {
    const progress = getStudyProgress();
    setCompletedChapters(progress.chaptersCompleted);
    setIsCompleted(progress.chaptersCompleted.includes(chapterId));
  }, [chapterId]);

  const handleMarkComplete = () => {
    updateChapterCompleted(chapterId);
    setIsCompleted(true);
    setCompletedChapters((prev) => [...prev, chapterId]);
  };

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            챕터를 찾을 수 없습니다
          </h1>
          <Link
            href="/theory"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            이론 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const prevChapter = (chapters as Chapter[]).find((c) => c.id === chapterId - 1);
  const nextChapter = (chapters as Chapter[]).find((c) => c.id === chapterId + 1);

  return (
    <div className="flex">
      <Sidebar chapters={chapters as Chapter[]} completedChapters={completedChapters} />

      <div className="flex-1 p-4 lg:p-8 lg:ml-0 min-w-0">
        <TheoryContent
          chapter={chapter}
          relatedQuestions={relatedQuestions}
          onMarkComplete={handleMarkComplete}
          isCompleted={isCompleted}
        />

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-between">
          {prevChapter ? (
            <Link
              href={`/theory/${prevChapter.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>이전: {prevChapter.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <Link
              href={`/theory/${nextChapter.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <span>다음: {nextChapter.title}</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
