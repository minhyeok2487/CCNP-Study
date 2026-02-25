"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Timer,
  Target,
  ChevronRight,
  Loader2,
  ClipboardList,
} from "lucide-react";

interface AttemptRow {
  id: string;
  mode: string;
  domain_id: string | null;
  topic_id: string | null;
  total_questions: number;
  correct_count: number;
  time_taken_seconds: number | null;
  completed_at: string;
  domain_title?: string;
  topic_title?: string;
}

const MODE_LABELS: Record<string, string> = {
  topic: "토픽별",
  weak: "약점 영역",
  spaced: "간격 반복",
  mixed: "혼합",
};

const MODE_COLORS: Record<string, string> = {
  topic: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  weak: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  spaced:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  mixed:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function QuizHistoryPage() {
  const router = useRouter();
  const supabase = createClient();

  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("quiz_attempts")
        .select(
          "id, mode, domain_id, topic_id, total_questions, correct_count, time_taken_seconds, completed_at, exam_domains(title_ko), topics(title_ko)"
        )
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(50);

      if (data) {
        const mapped: AttemptRow[] = data.map((row: any) => ({
          id: row.id,
          mode: row.mode,
          domain_id: row.domain_id,
          topic_id: row.topic_id,
          total_questions: row.total_questions,
          correct_count: row.correct_count,
          time_taken_seconds: row.time_taken_seconds,
          completed_at: row.completed_at,
          domain_title: row.exam_domains?.title_ko ?? null,
          topic_title: row.topics?.title_ko ?? null,
        }));
        setAttempts(mapped);
      }

      setLoading(false);
    }

    fetchHistory();
  }, []);

  function formatTime(seconds: number | null): string {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }

  function getScoreColor(percent: number): string {
    if (percent >= 80) return "text-green-500";
    if (percent >= 60) return "text-yellow-500";
    if (percent >= 40) return "text-orange-500";
    return "text-red-500";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/quiz")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            뒤로
          </Button>
          <div>
            <h1 className="text-2xl font-bold">퀴즈 기록</h1>
            <p className="text-sm text-muted-foreground">
              지금까지의 퀴즈 결과를 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {attempts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">아직 퀴즈 기록이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                퀴즈를 풀고 학습 진행 상황을 추적하세요.
              </p>
            </div>
            <Button onClick={() => router.push("/quiz")}>
              퀴즈 시작하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Attempt list */}
      <div className="space-y-3">
        {attempts.map((attempt) => {
          const scorePercent = Math.round(
            (attempt.correct_count / attempt.total_questions) * 100
          );
          const subtitle =
            attempt.topic_title ||
            attempt.domain_title ||
            MODE_LABELS[attempt.mode] ||
            attempt.mode;

          return (
            <Card
              key={attempt.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() =>
                router.push(`/quiz/results/${attempt.id}`)
              }
            >
              <CardContent className="flex items-center gap-4 py-4">
                {/* Score circle */}
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-bold text-sm",
                    scorePercent >= 80
                      ? "border-green-500"
                      : scorePercent >= 60
                      ? "border-yellow-500"
                      : scorePercent >= 40
                      ? "border-orange-500"
                      : "border-red-500"
                  )}
                >
                  <span className={getScoreColor(scorePercent)}>
                    {scorePercent}%
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={
                        MODE_COLORS[attempt.mode] ?? ""
                      }
                    >
                      {MODE_LABELS[attempt.mode] ?? attempt.mode}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {subtitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(attempt.completed_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {attempt.correct_count}/{attempt.total_questions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {formatTime(attempt.time_taken_seconds)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
