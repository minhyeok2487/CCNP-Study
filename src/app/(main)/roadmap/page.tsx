"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TopicTree } from "@/components/roadmap/topic-tree";
import { CalendarView } from "@/components/roadmap/calendar-view";

interface Domain {
  id: string;
  number: number;
  title_en: string;
  title_ko: string;
  weight: number;
  color: string;
  sort_order: number;
}

interface Topic {
  id: string;
  domain_id: string;
  parent_id: string | null;
  code: string;
  title_en: string;
  title_ko: string;
  sort_order: number;
}

interface TopicProgress {
  topic_id: string;
  status: "not_started" | "in_progress" | "completed";
}

export default function RoadmapPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"tree" | "calendar">("tree");
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [domainsRes, topicsRes, progressRes] = await Promise.all([
        supabase.from("exam_domains").select("*").order("sort_order"),
        supabase.from("topics").select("*").order("sort_order"),
        supabase
          .from("user_topic_progress")
          .select("topic_id, status")
          .eq("user_id", user.id),
      ]);

      setDomains(domainsRes.data || []);
      setTopics(topicsRes.data || []);
      setProgress(
        (progressRes.data || []) as TopicProgress[]
      );
      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleStatusChange(
    topicId: string,
    status: "not_started" | "in_progress" | "completed"
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_topic_progress")
      .upsert(
        { user_id: user.id, topic_id: topicId, status, updated_at: new Date().toISOString() },
        { onConflict: "user_id,topic_id" }
      );

    if (!error) {
      setProgress((prev) => {
        const existing = prev.find((p) => p.topic_id === topicId);
        if (existing) {
          return prev.map((p) =>
            p.topic_id === topicId ? { ...p, status } : p
          );
        }
        return [...prev, { topic_id: topicId, status }];
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">학습 로드맵</h1>
        <div className="flex gap-1 rounded-md border p-1">
          <button
            onClick={() => setView("tree")}
            className={`rounded px-3 py-1 text-sm ${
              view === "tree"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            트리뷰
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`rounded px-3 py-1 text-sm ${
              view === "calendar"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            캘린더
          </button>
        </div>
      </div>

      {view === "tree" ? (
        <TopicTree
          domains={domains}
          topics={topics}
          progress={progress}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <CalendarView />
      )}
    </div>
  );
}
