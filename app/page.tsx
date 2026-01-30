'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStatistics, getStudyProgress } from '@/lib/storage';
import ProgressBar from '@/components/ProgressBar';
import chapters from '@/data/chapters.json';
import questions from '@/data/questions.json';

interface Statistics {
  chaptersCompleted: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  totalQuizzes: number;
  averageScore: number;
  lastStudyDate: string;
}

export default function Home() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [recentChapters, setRecentChapters] = useState<number[]>([]);

  useEffect(() => {
    const statistics = getStatistics();
    const progress = getStudyProgress();
    setStats(statistics);
    setRecentChapters(progress.chaptersCompleted.slice(-3));
  }, []);

  const totalChapters = chapters.length;
  const totalQuestions = questions.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">CCNP ENCOR 350-401 Study</h1>
        <p className="text-blue-100 mb-6">
          Implementing and Operating Cisco Enterprise Network Core Technologies
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/theory"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            이론 학습 시작
          </Link>
          <Link
            href="/quiz"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors border border-blue-400"
          >
            문제 풀이 시작
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">학습 챕터</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.chaptersCompleted || 0}
            <span className="text-lg text-gray-400">/{totalChapters}</span>
          </p>
          <ProgressBar
            current={stats?.chaptersCompleted || 0}
            total={totalChapters}
            showLabel={false}
            size="sm"
            color="blue"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">풀이한 문제</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.totalQuestionsAnswered || 0}
            <span className="text-lg text-gray-400">/{totalQuestions}</span>
          </p>
          <ProgressBar
            current={stats?.totalQuestionsAnswered || 0}
            total={totalQuestions}
            showLabel={false}
            size="sm"
            color="green"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">정답률</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.accuracy.toFixed(1) || 0}%
          </p>
          <div className="text-sm text-gray-500">
            정답 {stats?.correctAnswers || 0}개
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">평균 점수</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.averageScore.toFixed(0) || 0}점
          </p>
          <div className="text-sm text-gray-500">
            퀴즈 {stats?.totalQuizzes || 0}회
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Chapters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 학습</h2>
          {recentChapters.length > 0 ? (
            <ul className="space-y-3">
              {recentChapters.map((chapterId) => {
                const chapter = chapters.find((c) => c.id === chapterId);
                return chapter ? (
                  <li key={chapterId}>
                    <Link
                      href={`/theory/${chapterId}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm text-blue-600 font-medium">
                        Chapter {chapter.id}
                      </p>
                      <p className="text-gray-900">{chapter.title}</p>
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">아직 학습한 챕터가 없습니다.</p>
              <Link
                href="/theory"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                학습 시작하기 →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Quiz */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 퀴즈</h2>
          <div className="space-y-3">
            <Link
              href="/quiz?mode=random&count=10"
              className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <p className="font-medium text-blue-900">랜덤 10문제</p>
              <p className="text-sm text-blue-600">전체 문제에서 무작위 출제</p>
            </Link>
            <Link
              href="/quiz?mode=random&count=25"
              className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <p className="font-medium text-purple-900">모의고사 (25문제)</p>
              <p className="text-sm text-purple-600">실전과 유사한 문제 수</p>
            </Link>
            <Link
              href="/quiz?mode=wrong"
              className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <p className="font-medium text-red-900">오답 노트</p>
              <p className="text-sm text-red-600">틀린 문제 다시 풀기</p>
            </Link>
            <Link
              href="/quiz?examPart=Drag Drop"
              className="block p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              <p className="font-medium text-orange-900">Drag &amp; Drop (8문제)</p>
              <p className="text-sm text-orange-600">항목을 올바른 카테고리로 매칭</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Exam Info */}
      <div className="mt-8 bg-gray-800 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">시험 정보: CCNP ENCOR 350-401</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-gray-400 text-sm mb-1">시험 시간</h3>
            <p className="font-medium">120분</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">문제 수</h3>
            <p className="font-medium">90-110문제</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">합격 점수</h3>
            <p className="font-medium">약 825/1000점</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">주요 시험 영역</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li>• Architecture (15%)</li>
            <li>• Virtualization (10%)</li>
            <li>• Infrastructure (30%)</li>
            <li>• Network Assurance (10%)</li>
            <li>• Security (20%)</li>
            <li>• Automation (15%)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
