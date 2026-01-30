'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { getStudyProgress } from '@/lib/storage';
import chapters from '@/data/chapters.json';
import { Chapter } from '@/types';

export default function TheoryPage() {
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);

  useEffect(() => {
    const progress = getStudyProgress();
    setCompletedChapters(progress.chaptersCompleted);
  }, []);

  // Group chapters by part
  const groupedChapters = (chapters as Chapter[]).reduce((acc, chapter) => {
    if (!acc[chapter.part]) {
      acc[chapter.part] = [];
    }
    acc[chapter.part].push(chapter);
    return acc;
  }, {} as Record<string, Chapter[]>);

  return (
    <div className="flex">
      <Sidebar chapters={chapters as Chapter[]} completedChapters={completedChapters} />

      <div className="flex-1 p-4 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">이론 학습</h1>
          <p className="text-gray-600 mb-8">
            CCNP ENCOR 350-401 공식 교재 목차 기반 29개 챕터
          </p>

          {/* Progress Overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">학습 진행률</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedChapters.length / chapters.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-lg font-medium text-gray-700">
                {completedChapters.length}/{chapters.length}
              </span>
            </div>
          </div>

          {/* Chapters by Part */}
          <div className="space-y-8">
            {Object.entries(groupedChapters).map(([part, partChapters]) => (
              <div key={part}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  {part}
                </h2>
                <div className="grid gap-4">
                  {partChapters.map((chapter) => {
                    const isCompleted = completedChapters.includes(chapter.id);

                    return (
                      <a
                        key={chapter.id}
                        href={`/theory/${chapter.id}`}
                        className={`block p-4 rounded-lg border transition-all hover:shadow-md ${
                          isCompleted
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {isCompleted ? '✓' : chapter.id}
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {chapter.title}
                              </h3>
                              {chapter.description && (
                                <p className="text-sm text-gray-500">
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400"
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
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
