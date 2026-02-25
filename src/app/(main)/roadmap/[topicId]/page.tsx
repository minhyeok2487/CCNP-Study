"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle2, Circle, Clock, BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TopicDetail {
  id: string;
  code: string;
  title_en: string;
  title_ko: string;
  domain: { title_ko: string; color: string };
  children: { id: string; code: string; title_ko: string }[];
}

interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const supabase = createClient();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [status, setStatus] = useState<string>("not_started");
  const [relatedNotes, setRelatedNotes] = useState<{ id: string; title: string }[]>([]);
  const [quizStats, setQuizStats] = useState<{ total: number; correct: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch topic
      const { data: topicData } = await supabase
        .from("topics")
        .select("*, exam_domains(title_ko, color)")
        .eq("id", topicId)
        .single();

      if (!topicData) {
        router.push("/roadmap");
        return;
      }

      // Fetch children
      const { data: children } = await supabase
        .from("topics")
        .select("id, code, title_ko")
        .eq("parent_id", topicId)
        .order("sort_order");

      // Fetch checklist items with progress
      const { data: items } = await supabase
        .from("checklist_items")
        .select("id, content, sort_order")
        .eq("topic_id", topicId)
        .order("sort_order");

      const { data: completedItems } = await supabase
        .from("user_checklist_progress")
        .select("checklist_item_id, completed")
        .eq("user_id", user.id);

      const completedSet = new Set(
        (completedItems || [])
          .filter((c) => c.completed)
          .map((c) => c.checklist_item_id)
      );

      // Fetch progress
      const { data: progressData } = await supabase
        .from("user_topic_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("topic_id", topicId)
        .single();

      // Fetch related notes
      const { data: notes } = await supabase
        .from("notes")
        .select("id, title")
        .eq("user_id", user.id)
        .eq("topic_id", topicId)
        .limit(5);

      // Fetch quiz stats
      const { data: answers } = await supabase
        .from("quiz_answers")
        .select("is_correct, questions!inner(topic_id)")
        .eq("questions.topic_id", topicId);

      setTopic({
        ...topicData,
        domain: topicData.exam_domains as any,
        children: children || [],
      });

      setChecklist(
        (items || []).map((item) => ({
          id: item.id,
          content: item.content,
          completed: completedSet.has(item.id),
        }))
      );

      setStatus(progressData?.status || "not_started");
      setRelatedNotes(notes || []);

      if (answers && answers.length > 0) {
        setQuizStats({
          total: answers.length,
          correct: answers.filter((a) => a.is_correct).length,
        });
      }

      setLoading(false);
    }
    fetchData();
  }, [topicId]);

  async function toggleChecklist(itemId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const item = checklist.find((c) => c.id === itemId);
    if (!item) return;

    const newCompleted = !item.completed;

    await supabase.from("user_checklist_progress").upsert(
      {
        user_id: user.id,
        checklist_item_id: itemId,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,checklist_item_id" }
    );

    setChecklist((prev) =>
      prev.map((c) =>
        c.id === itemId ? { ...c, completed: newCompleted } : c
      )
    );
  }

  async function changeStatus(newStatus: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_topic_progress").upsert(
      {
        user_id: user.id,
        topic_id: topicId,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,topic_id" }
    );

    setStatus(newStatus);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!topic) return null;

  const statusOptions = [
    { value: "not_started", label: "미시작", icon: Circle, className: "text-muted-foreground" },
    { value: "in_progress", label: "진행중", icon: Clock, className: "text-amber-500" },
    { value: "completed", label: "완료", icon: CheckCircle2, className: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        로드맵으로 돌아가기
      </button>

      <div>
        <p className="text-sm text-muted-foreground mb-1">
          {topic.domain.title_ko} · {topic.code}
        </p>
        <h1 className="text-xl font-bold">{topic.title_ko}</h1>
        <p className="text-sm text-muted-foreground mt-1">{topic.title_en}</p>
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => changeStatus(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
              status === opt.value
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
            )}
          >
            <opt.icon className={cn("h-4 w-4", opt.className)} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Children topics */}
      {topic.children.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">세부 토픽</h2>
          <div className="space-y-1">
            {topic.children.map((child) => (
              <Link
                key={child.id}
                href={`/roadmap/${child.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {child.code}
                </span>
                <span>{child.title_ko}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">
            학습 체크리스트 ({checklist.filter((c) => c.completed).length}/
            {checklist.length})
          </h2>
          <div className="space-y-2">
            {checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklist(item.id)}
                  className="mt-0.5 rounded border-input"
                />
                <span
                  className={cn(
                    "text-sm",
                    item.completed && "line-through text-muted-foreground"
                  )}
                >
                  {item.content}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Related info */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Notes */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">관련 노트</h2>
          </div>
          {relatedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              이 토픽에 관련된 노트가 없습니다.
            </p>
          ) : (
            <div className="space-y-1">
              {relatedNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block text-sm hover:underline truncate"
                >
                  {note.title}
                </Link>
              ))}
            </div>
          )}
          <Link
            href={`/notes/new?topicId=${topicId}`}
            className="inline-block mt-2 text-xs text-primary hover:underline"
          >
            + 노트 작성
          </Link>
        </div>

        {/* Quiz stats */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">퀴즈 성적</h2>
          </div>
          {quizStats ? (
            <div>
              <p className="text-2xl font-bold">
                {Math.round((quizStats.correct / quizStats.total) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {quizStats.correct}/{quizStats.total} 정답
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 이 토픽의 퀴즈를 풀지 않았습니다.
            </p>
          )}
          <Link
            href={`/quiz?topicId=${topicId}`}
            className="inline-block mt-2 text-xs text-primary hover:underline"
          >
            퀴즈 풀기
          </Link>
        </div>
      </div>
    </div>
  );
}
