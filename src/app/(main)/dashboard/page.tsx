"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { DomainProgress } from "@/components/dashboard/domain-progress";
import { StudyStreak } from "@/components/dashboard/study-streak";
import { WeakAreas } from "@/components/dashboard/weak-areas";
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule";

interface DashboardData {
  profile: {
    streak: number;
    longestStreak: number;
    examDate: string | null;
    dailyGoalMinutes: number;
  } | null;
  domains: {
    id: string;
    titleKo: string;
    color: string;
    weight: number;
    totalTopics: number;
    completedTopics: number;
  }[];
  weakTopics: {
    topicId: string;
    titleKo: string;
    domainColor: string;
    correctRate: number;
  }[];
  schedule: {
    id: string;
    date: string;
    topicTitleKo: string;
    completed: boolean;
  }[];
  overallProgress: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch domains with topic counts
      const { data: domains } = await supabase
        .from("exam_domains")
        .select("*")
        .order("sort_order");

      const { data: topics } = await supabase
        .from("topics")
        .select("id, domain_id");

      const { data: progress } = await supabase
        .from("user_topic_progress")
        .select("topic_id, status")
        .eq("user_id", user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // Fetch quiz performance for weak areas
      const { data: quizAnswers } = await supabase
        .from("quiz_answers")
        .select("question_id, is_correct, questions(topic_id, topics(title_ko, domain_id, exam_domains(color)))")
        .eq("quiz_attempts.user_id", user.id);

      // Fetch upcoming schedule
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const { data: schedule } = await supabase
        .from("study_schedule")
        .select("id, scheduled_date, completed, topics(title_ko)")
        .eq("user_id", user.id)
        .gte("scheduled_date", today)
        .lte("scheduled_date", nextWeek)
        .order("scheduled_date");

      // Calculate domain progress
      const progressMap = new Map(
        (progress || []).map((p) => [p.topic_id, p.status])
      );

      // Only count leaf topics (those without children)
      const topicsByDomain = new Map<string, string[]>();
      (topics || []).forEach((t) => {
        const list = topicsByDomain.get(t.domain_id) || [];
        list.push(t.id);
        topicsByDomain.set(t.domain_id, list);
      });

      const domainData = (domains || []).map((d) => {
        const domainTopics = topicsByDomain.get(d.id) || [];
        const completed = domainTopics.filter(
          (tid) => progressMap.get(tid) === "completed"
        ).length;
        return {
          id: d.id,
          titleKo: d.title_ko,
          color: d.color,
          weight: d.weight,
          totalTopics: domainTopics.length,
          completedTopics: completed,
        };
      });

      const totalTopics = domainData.reduce((s, d) => s + d.totalTopics, 0);
      const totalCompleted = domainData.reduce(
        (s, d) => s + d.completedTopics,
        0
      );

      setData({
        profile: profile
          ? {
              streak: profile.streak,
              longestStreak: profile.longest_streak,
              examDate: profile.exam_date,
              dailyGoalMinutes: profile.daily_goal_minutes,
            }
          : null,
        domains: domainData,
        weakTopics: [], // Simplified - will show once quiz data exists
        schedule: (schedule || []).map((s: any) => ({
          id: s.id,
          date: s.scheduled_date,
          topicTitleKo: s.topics?.title_ko || "",
          completed: s.completed,
        })),
        overallProgress:
          totalTopics > 0
            ? Math.round((totalCompleted / totalTopics) * 100)
            : 0,
      });
      setLoading(false);
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ProgressOverview progress={data.overallProgress} />
        <StudyStreak
          streak={data.profile?.streak ?? 0}
          longestStreak={data.profile?.longestStreak ?? 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DomainProgress domains={data.domains} />
        <div className="space-y-4">
          <WeakAreas topics={data.weakTopics} />
          <UpcomingSchedule items={data.schedule} />
        </div>
      </div>
    </div>
  );
}
