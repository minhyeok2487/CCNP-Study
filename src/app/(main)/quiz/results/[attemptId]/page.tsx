"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Timer,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AttemptData {
  id: string;
  mode: string;
  total_questions: number;
  correct_count: number;
  time_taken_seconds: number | null;
  completed_at: string;
  domain_id: string | null;
  topic_id: string | null;
}

interface AnswerData {
  id: string;
  question_id: string;
  selected_answers: number[];
  is_correct: boolean;
  questions: {
    id: string;
    type: string;
    question_en: string;
    question_ko: string;
    options_en: string[];
    options_ko: string[];
    correct_answers: number[];
    explanation_en: string;
    explanation_ko: string;
    difficulty: number;
  };
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const MODE_LABELS: Record<string, string> = {
  topic: "토픽별 퀴즈",
  weak: "약점 영역",
  spaced: "간격 반복",
  mixed: "혼합 모드",
};

export default function QuizResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answerList, setAnswerList] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    async function fetchResults() {
      // Fetch attempt
      const { data: attemptData, error: attemptErr } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("id", attemptId)
        .single();

      if (attemptErr || !attemptData) {
        setLoading(false);
        return;
      }

      setAttempt(attemptData);

      // Fetch answers with question data
      const { data: answersData } = await supabase
        .from("quiz_answers")
        .select(
          "id, question_id, selected_answers, is_correct, questions(id, type, question_en, question_ko, options_en, options_ko, correct_answers, explanation_en, explanation_ko, difficulty)"
        )
        .eq("attempt_id", attemptId);

      if (answersData) {
        setAnswerList(answersData as unknown as AnswerData[]);
        // Auto-expand wrong answers
        const wrongIds = new Set(
          answersData
            .filter((a: any) => !a.is_correct)
            .map((a: any) => a.id)
        );
        setExpandedQuestions(wrongIds);
      }

      setLoading(false);
    }

    fetchResults();
  }, [attemptId]);

  function toggleQuestion(answerId: string) {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(answerId)) {
        next.delete(answerId);
      } else {
        next.add(answerId);
      }
      return next;
    });
  }

  function formatTime(seconds: number | null): string {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">결과를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push("/quiz")}>
          퀴즈 선택으로 돌아가기
        </Button>
      </div>
    );
  }

  const scorePercent = Math.round(
    (attempt.correct_count / attempt.total_questions) * 100
  );
  const incorrectCount = attempt.total_questions - attempt.correct_count;

  // Determine score color
  let scoreColor = "text-red-500";
  let scoreBg = "stroke-red-500";
  if (scorePercent >= 80) {
    scoreColor = "text-green-500";
    scoreBg = "stroke-green-500";
  } else if (scorePercent >= 60) {
    scoreColor = "text-yellow-500";
    scoreBg = "stroke-yellow-500";
  } else if (scorePercent >= 40) {
    scoreColor = "text-orange-500";
    scoreBg = "stroke-orange-500";
  }

  // SVG circular progress params
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/quiz")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          퀴즈 선택
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-sm text-muted-foreground">
          {MODE_LABELS[attempt.mode] ?? attempt.mode}
        </span>
      </div>

      {/* Score overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            {/* Circular progress */}
            <div className="relative flex items-center justify-center">
              <svg width="140" height="140" className="-rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className={cn("transition-all duration-1000", scoreBg)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={cn("text-3xl font-bold", scoreColor)}>
                  {scorePercent}%
                </span>
                <span className="text-xs text-muted-foreground">정답률</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center sm:gap-10">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">
                    {attempt.correct_count}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">정답</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">
                    {incorrectCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">오답</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {formatTime(attempt.time_taken_seconds)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">소요 시간</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/quiz")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          퀴즈 선택
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            const params = new URLSearchParams({ mode: attempt.mode });
            if (attempt.domain_id)
              params.set("domainId", attempt.domain_id);
            if (attempt.topic_id)
              params.set("topicId", attempt.topic_id);
            router.push(`/quiz/new?${params.toString()}`);
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          다시 풀기
        </Button>
      </div>

      {/* Question review list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">문제별 결과</h2>

        {answerList.map((answer, index) => {
          const q = answer.questions;
          if (!q) return null;

          const isExpanded = expandedQuestions.has(answer.id);
          const options =
            q.options_ko && q.options_ko.length > 0
              ? q.options_ko
              : q.options_en;

          return (
            <Card
              key={answer.id}
              className={cn(
                "transition-colors",
                answer.is_correct
                  ? "border-green-200 dark:border-green-900/40"
                  : "border-red-200 dark:border-red-900/40"
              )}
            >
              <button
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => toggleQuestion(answer.id)}
              >
                {answer.is_correct ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className="text-muted-foreground mr-1.5">
                      Q{index + 1}.
                    </span>
                    {q.question_ko || q.question_en}
                  </p>
                </div>

                <Badge
                  variant={answer.is_correct ? "secondary" : "destructive"}
                  className="shrink-0"
                >
                  {answer.is_correct ? "정답" : "오답"}
                </Badge>

                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <CardContent className="border-t pt-4 space-y-4">
                  {/* Full question text */}
                  <div>
                    <p className="text-sm font-medium">
                      {q.question_ko || q.question_en}
                    </p>
                    {q.question_ko && q.question_en && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {q.question_en}
                      </p>
                    )}
                  </div>

                  {/* Options with markings */}
                  <div className="space-y-2">
                    {options.map((opt, optIdx) => {
                      const isUserSelected =
                        answer.selected_answers.includes(optIdx);
                      const isCorrectOption =
                        q.correct_answers.includes(optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            "flex items-start gap-2.5 rounded-md px-3 py-2 text-sm",
                            isCorrectOption &&
                              "bg-green-50 dark:bg-green-950/20",
                            isUserSelected &&
                              !isCorrectOption &&
                              "bg-red-50 dark:bg-red-950/20"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              isCorrectOption
                                ? "bg-green-500 text-white"
                                : isUserSelected
                                ? "bg-red-500 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {OPTION_LABELS[optIdx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectOption && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                          )}
                          {isUserSelected && !isCorrectOption && (
                            <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Your answer vs correct answer summary */}
                  {!answer.is_correct && (
                    <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
                      <p>
                        <span className="font-medium text-red-500">
                          내 답변:{" "}
                        </span>
                        {answer.selected_answers.length > 0
                          ? answer.selected_answers
                              .map((i) => OPTION_LABELS[i])
                              .join(", ")
                          : "미응답"}
                      </p>
                      <p>
                        <span className="font-medium text-green-500">
                          정답:{" "}
                        </span>
                        {q.correct_answers
                          .map((i) => OPTION_LABELS[i])
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  {(q.explanation_ko || q.explanation_en) && (
                    <div className="rounded-md border bg-card p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        해설
                      </p>
                      <p className="text-sm leading-relaxed">
                        {q.explanation_ko || q.explanation_en}
                      </p>
                      {q.explanation_ko && q.explanation_en && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {q.explanation_en}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
