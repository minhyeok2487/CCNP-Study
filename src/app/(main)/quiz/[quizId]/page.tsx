"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestionCard } from "@/components/quiz/question-card";
import { QuizTimer } from "@/components/quiz/quiz-timer";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Question {
  id: string;
  topic_id: string;
  type: "multiple_choice" | "multiple_select";
  question_en: string;
  question_ko: string;
  options_en: string[];
  options_ko: string[];
  correct_answers: number[];
  explanation_en: string;
  explanation_ko: string;
  difficulty: number;
}

const QUIZ_SIZE = 20;

export default function QuizTakingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const mode = searchParams.get("mode") || "mixed";
  const topicId = searchParams.get("topicId");
  const domainId = searchParams.get("domainId");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number[]>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const elapsedRef = useRef(0);

  // Fetch questions based on mode
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        let fetchedQuestions: Question[] = [];

        if (mode === "topic") {
          if (topicId) {
            // Get questions for specific topic and its children
            const { data: childTopics } = await supabase
              .from("topics")
              .select("id")
              .eq("parent_id", topicId);

            const topicIds = [
              topicId,
              ...(childTopics || []).map((t) => t.id),
            ];

            const { data, error: qError } = await supabase
              .from("questions")
              .select("*")
              .in("topic_id", topicIds)
              .limit(QUIZ_SIZE);

            if (qError) throw qError;
            fetchedQuestions = data || [];
          } else if (domainId) {
            // Get all topics under this domain, then questions
            const { data: domainTopics } = await supabase
              .from("topics")
              .select("id")
              .eq("domain_id", domainId);

            const topicIds = (domainTopics || []).map((t) => t.id);

            if (topicIds.length > 0) {
              const { data, error: qError } = await supabase
                .from("questions")
                .select("*")
                .in("topic_id", topicIds)
                .limit(QUIZ_SIZE);

              if (qError) throw qError;
              fetchedQuestions = data || [];
            }
          }
        } else if (mode === "weak") {
          // Get questions that were answered incorrectly
          const { data: wrongAnswers } = await supabase
            .from("quiz_answers")
            .select(
              "question_id, is_correct, quiz_attempts!inner(user_id)"
            )
            .eq("quiz_attempts.user_id", user.id)
            .eq("is_correct", false);

          if (wrongAnswers && wrongAnswers.length > 0) {
            const questionIds = [
              ...new Set(wrongAnswers.map((a) => a.question_id)),
            ];
            const { data, error: qError } = await supabase
              .from("questions")
              .select("*")
              .in("id", questionIds.slice(0, QUIZ_SIZE));

            if (qError) throw qError;
            fetchedQuestions = data || [];
          } else {
            // Fallback: get random questions if no wrong answers yet
            const { data, error: qError } = await supabase
              .from("questions")
              .select("*")
              .limit(QUIZ_SIZE);

            if (qError) throw qError;
            fetchedQuestions = data || [];
          }
        } else if (mode === "spaced") {
          // Get questions due for spaced repetition
          const today = new Date().toISOString().split("T")[0];
          const { data: srData } = await supabase
            .from("spaced_repetition")
            .select("question_id")
            .eq("user_id", user.id)
            .lte("next_review_date", today)
            .limit(QUIZ_SIZE);

          if (srData && srData.length > 0) {
            const questionIds = srData.map((s) => s.question_id);
            const { data, error: qError } = await supabase
              .from("questions")
              .select("*")
              .in("id", questionIds);

            if (qError) throw qError;
            fetchedQuestions = data || [];
          } else {
            // Fallback: no spaced repetition items due
            const { data, error: qError } = await supabase
              .from("questions")
              .select("*")
              .limit(QUIZ_SIZE);

            if (qError) throw qError;
            fetchedQuestions = data || [];
          }
        } else {
          // mixed mode: random questions
          const { data, error: qError } = await supabase
            .from("questions")
            .select("*")
            .limit(QUIZ_SIZE);

          if (qError) throw qError;
          fetchedQuestions = data || [];
        }

        // Shuffle the questions
        fetchedQuestions = shuffleArray(fetchedQuestions);

        if (fetchedQuestions.length === 0) {
          setError("이 모드에 해당하는 문제가 없습니다.");
        }

        setQuestions(fetchedQuestions);
      } catch (err: any) {
        setError(err.message || "문제를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [mode, topicId, domainId]);

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const handleSelect = useCallback(
    (questionId: string, selected: number[]) => {
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(questionId, selected);
        return next;
      });
    },
    []
  );

  function goToQuestion(index: number) {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }

  async function handleSubmit() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate score
      let correctCount = 0;
      const answerRecords: {
        question_id: string;
        selected_answers: number[];
        is_correct: boolean;
      }[] = [];

      for (const question of questions) {
        const userAnswer = answers.get(question.id) || [];
        const correct = question.correct_answers;
        const isCorrect =
          userAnswer.length === correct.length &&
          userAnswer.every((a) => correct.includes(a)) &&
          correct.every((c) => userAnswer.includes(c));

        if (isCorrect) correctCount++;

        answerRecords.push({
          question_id: question.id,
          selected_answers: userAnswer,
          is_correct: isCorrect,
        });
      }

      // Create quiz attempt
      const { data: attempt, error: attemptErr } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          mode,
          domain_id: domainId || null,
          topic_id: topicId || null,
          total_questions: questions.length,
          correct_count: correctCount,
          time_taken_seconds: elapsedRef.current,
        })
        .select("id")
        .single();

      if (attemptErr) throw attemptErr;

      // Insert quiz answers
      const answerInserts = answerRecords.map((a) => ({
        attempt_id: attempt.id,
        ...a,
      }));

      const { error: answerErr } = await supabase
        .from("quiz_answers")
        .insert(answerInserts);

      if (answerErr) throw answerErr;

      // Update spaced repetition for each question
      for (const record of answerRecords) {
        const { data: existing } = await supabase
          .from("spaced_repetition")
          .select("*")
          .eq("user_id", user.id)
          .eq("question_id", record.question_id)
          .single();

        if (existing) {
          // SM-2 algorithm update
          const quality = record.is_correct ? 4 : 1;
          let ef = existing.ease_factor;
          let interval = existing.interval;
          let reps = existing.repetitions;

          if (quality >= 3) {
            if (reps === 0) interval = 1;
            else if (reps === 1) interval = 6;
            else interval = Math.round(interval * ef);
            reps++;
          } else {
            reps = 0;
            interval = 1;
          }

          ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
          if (ef < 1.3) ef = 1.3;

          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + interval);

          await supabase
            .from("spaced_repetition")
            .update({
              ease_factor: ef,
              interval,
              repetitions: reps,
              next_review_date: nextDate.toISOString().split("T")[0],
              last_reviewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Create new spaced repetition entry
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + (record.is_correct ? 1 : 0));

          await supabase.from("spaced_repetition").insert({
            user_id: user.id,
            question_id: record.question_id,
            ease_factor: 2.5,
            interval: record.is_correct ? 1 : 0,
            repetitions: record.is_correct ? 1 : 0,
            next_review_date: nextDate.toISOString().split("T")[0],
            last_reviewed_at: new Date().toISOString(),
          });
        }
      }

      // Redirect to results
      router.push(`/quiz/results/${attempt.id}`);
    } catch (err: any) {
      setError(err.message || "퀴즈 제출에 실패했습니다.");
      setSubmitting(false);
    }
  }

  function handleTimerTick(seconds: number) {
    elapsedRef.current = seconds;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push("/quiz")}>
          퀴즈 선택으로 돌아가기
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = answers.size;
  const progressPercent = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  const MODE_LABELS: Record<string, string> = {
    topic: "토픽별 퀴즈",
    weak: "약점 영역",
    spaced: "간격 반복",
    mixed: "혼합 모드",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Top bar: mode label, timer, progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/quiz")}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            나가기
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {MODE_LABELS[mode] ?? mode}
          </span>
        </div>
        <QuizTimer onTick={handleTimerTick} />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            문제 {currentIndex + 1} / {questions.length}
          </span>
          <span>
            {answeredCount}개 답변 완료
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Question navigator dots */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = answers.has(q.id);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(i)}
              className={cn(
                "h-7 w-7 rounded-md text-xs font-medium transition-colors",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isAnswered
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      {currentQuestion && (
        <Card>
          <CardContent className="pt-6">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              selectedAnswers={answers.get(currentQuestion.id) || []}
              onSelect={(selected) =>
                handleSelect(currentQuestion.id, selected)
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation and submit */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => goToQuestion(currentIndex - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          이전
        </Button>

        <div className="flex items-center gap-2">
          {currentIndex === questions.length - 1 ? (
            <>
              {showConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {answeredCount < questions.length
                      ? `${questions.length - answeredCount}개 미답변 문제가 있습니다. 제출하시겠습니까?`
                      : "퀴즈를 제출하시겠습니까?"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirm(false)}
                    disabled={submitting}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1 h-4 w-4" />
                    )}
                    확인
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSubmit}>
                  <Send className="mr-1 h-4 w-4" />
                  제출하기
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => goToQuestion(currentIndex + 1)}>
              다음
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
