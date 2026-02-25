"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setExamDate(data.exam_date || "");
        setDailyGoalMinutes(data.daily_goal_minutes || 60);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSave() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: displayName || null,
        exam_date: examDate || null,
        daily_goal_minutes: dailyGoalMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      toast.error("저장 실패: " + error.message);
    } else {
      toast.success("설정이 저장되었습니다.");
    }
    setSaving(false);
  }

  async function handleGenerateSchedule() {
    if (!examDate) {
      toast.error("시험일을 먼저 설정해주세요.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setGenerating(true);

    // Delete existing schedule
    await supabase
      .from("study_schedule")
      .delete()
      .eq("user_id", user.id);

    // Fetch all domains and topics
    const { data: domains } = await supabase
      .from("exam_domains")
      .select("id, weight, sort_order")
      .order("sort_order");

    const { data: topics } = await supabase
      .from("topics")
      .select("id, domain_id, sort_order")
      .order("sort_order");

    if (!domains || !topics) {
      toast.error("데이터를 불러올 수 없습니다.");
      setGenerating(false);
      return;
    }

    // Calculate days until exam
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    const totalDays = Math.max(
      1,
      Math.floor((exam.getTime() - today.getTime()) / 86400000)
    );

    // Group topics by domain
    const topicsByDomain = new Map<string, string[]>();
    topics.forEach((t) => {
      const list = topicsByDomain.get(t.domain_id) || [];
      list.push(t.id);
      topicsByDomain.set(t.domain_id, list);
    });

    // Distribute topics across days based on domain weight
    const scheduleItems: {
      user_id: string;
      topic_id: string;
      scheduled_date: string;
    }[] = [];

    let dayIndex = 0;

    domains.forEach((domain) => {
      const domainTopics = topicsByDomain.get(domain.id) || [];
      const domainDays = Math.max(
        1,
        Math.round((domain.weight / 100) * totalDays)
      );

      domainTopics.forEach((topicId, i) => {
        const daysOffset =
          dayIndex + Math.floor((i / domainTopics.length) * domainDays);
        const date = new Date(today);
        date.setDate(date.getDate() + Math.min(daysOffset, totalDays - 1));

        scheduleItems.push({
          user_id: user.id,
          topic_id: topicId,
          scheduled_date: date.toISOString().split("T")[0],
        });
      });

      dayIndex += domainDays;
    });

    if (scheduleItems.length > 0) {
      const { error } = await supabase
        .from("study_schedule")
        .insert(scheduleItems);

      if (error) {
        toast.error("일정 생성 실패: " + error.message);
      } else {
        toast.success(
          `${scheduleItems.length}개 학습 일정이 생성되었습니다.`
        );
      }
    }

    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">설정</h1>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">프로필</h2>

        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            이름
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="examDate" className="text-sm font-medium">
            시험 예정일
          </label>
          <input
            id="examDate"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dailyGoal" className="text-sm font-medium">
            일일 학습 목표 (분)
          </label>
          <input
            id="dailyGoal"
            type="number"
            min={10}
            max={480}
            value={dailyGoalMinutes}
            onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">학습 일정</h2>
        <p className="text-sm text-muted-foreground">
          시험 예정일을 기반으로 도메인 배점 비중에 맞춰 학습 일정을 자동
          생성합니다. 기존 일정은 삭제됩니다.
        </p>
        <button
          onClick={handleGenerateSchedule}
          disabled={generating || !examDate}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {generating ? "생성 중..." : "학습 일정 생성"}
        </button>
      </div>
    </div>
  );
}
