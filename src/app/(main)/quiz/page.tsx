"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Shuffle,
  History,
  ChevronRight,
  Loader2,
} from "lucide-react";

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
  code: string;
  title_ko: string;
  title_en: string;
}

const QUIZ_MODES = [
  {
    key: "topic",
    title: "토픽별 퀴즈",
    description: "특정 도메인이나 토픽을 선택하여 집중적으로 학습합니다.",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    key: "weak",
    title: "약점 영역",
    description: "가장 낮은 점수를 받은 토픽의 문제를 집중 연습합니다.",
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
  },
  {
    key: "spaced",
    title: "간격 반복 (SM-2)",
    description: "복습이 필요한 문제를 간격 반복 알고리즘으로 학습합니다.",
    icon: RotateCcw,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20 hover:border-green-500/40",
  },
  {
    key: "mixed",
    title: "혼합 모드",
    description: "모든 토픽에서 무작위로 문제를 풀어봅니다.",
    icon: Shuffle,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
  },
] as const;

export default function QuizPage() {
  const router = useRouter();
  const supabase = createClient();

  const [domains, setDomains] = useState<Domain[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [spacedCount, setSpacedCount] = useState(0);
  const [weakCount, setWeakCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch domains
      const { data: domainData } = await supabase
        .from("exam_domains")
        .select("*")
        .order("sort_order");

      // Fetch top-level topics (parent_id is null = major topics)
      const { data: topicData } = await supabase
        .from("topics")
        .select("id, domain_id, code, title_ko, title_en")
        .is("parent_id", null)
        .order("sort_order");

      if (domainData) setDomains(domainData);
      if (topicData) setTopics(topicData);

      // Count spaced repetition items due
      if (user) {
        const today = new Date().toISOString().split("T")[0];
        const { count: spacedDue } = await supabase
          .from("spaced_repetition")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lte("next_review_date", today);

        setSpacedCount(spacedDue ?? 0);

        // Count weak area questions (topics with < 60% correct rate)
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("total_questions, correct_count")
          .eq("user_id", user.id);

        if (attempts && attempts.length > 0) {
          const totalQ = attempts.reduce(
            (sum, a) => sum + a.total_questions,
            0
          );
          const totalC = attempts.reduce(
            (sum, a) => sum + a.correct_count,
            0
          );
          const wrongCount = totalQ - totalC;
          setWeakCount(wrongCount);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredTopics = selectedDomain
    ? topics.filter((t) => t.domain_id === selectedDomain)
    : topics;

  function startQuiz(mode: string) {
    const params = new URLSearchParams({ mode });

    if (mode === "topic") {
      if (selectedTopic) {
        params.set("topicId", selectedTopic);
      } else if (selectedDomain) {
        params.set("domainId", selectedDomain);
      } else {
        // Require selection for topic mode
        setSelectedMode("topic");
        return;
      }
    }

    router.push(`/quiz/new?${params.toString()}`);
  }

  function handleModeClick(modeKey: string) {
    if (modeKey === "topic") {
      setSelectedMode(selectedMode === "topic" ? null : "topic");
    } else {
      startQuiz(modeKey);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">퀴즈</h1>
          <p className="text-muted-foreground mt-1">
            학습 모드를 선택하고 실력을 테스트하세요.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/quiz/history")}
        >
          <History className="mr-2 h-4 w-4" />
          퀴즈 기록
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {QUIZ_MODES.map((mode) => {
          const Icon = mode.icon;
          const isExpanded = selectedMode === mode.key;

          return (
            <Card
              key={mode.key}
              className={cn(
                "cursor-pointer transition-all duration-200",
                mode.borderColor,
                isExpanded && "ring-2 ring-primary/20"
              )}
              onClick={() => handleModeClick(mode.key)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      mode.bgColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", mode.color)} />
                  </div>
                  {mode.key === "spaced" && spacedCount > 0 && (
                    <Badge variant="secondary">{spacedCount}개 대기</Badge>
                  )}
                  {mode.key === "weak" && weakCount > 0 && (
                    <Badge variant="secondary">{weakCount}개 오답</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>

              {/* Topic selection panel for "topic" mode */}
              {mode.key === "topic" && isExpanded && (
                <CardContent
                  onClick={(e) => e.stopPropagation()}
                  className="space-y-3 border-t pt-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">도메인 선택</label>
                    <Select
                      value={selectedDomain}
                      onValueChange={(value) => {
                        setSelectedDomain(value);
                        setSelectedTopic("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="도메인을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: domain.color }}
                              />
                              {domain.number}. {domain.title_ko}
                              <span className="text-muted-foreground ml-1">
                                ({domain.weight}%)
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDomain && filteredTopics.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        토픽 선택 (선택사항)
                      </label>
                      <Select
                        value={selectedTopic}
                        onValueChange={setSelectedTopic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="전체 도메인에서 출제" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredTopics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.code} {topic.title_ko}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={!selectedDomain}
                    onClick={(e) => {
                      e.stopPropagation();
                      startQuiz("topic");
                    }}
                  >
                    퀴즈 시작
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              )}

              {/* Start button for non-topic modes */}
              {mode.key !== "topic" && (
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-primary font-medium">
                    시작하기
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
