"use client";

import { AlertTriangle } from "lucide-react";

interface WeakAreasProps {
  topics: {
    topicId: string;
    titleKo: string;
    domainColor: string;
    correctRate: number;
  }[];
}

export function WeakAreas({ topics }: WeakAreasProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-sm font-medium text-muted-foreground">
          약점 영역
        </h2>
      </div>
      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          퀴즈를 풀면 약점 영역이 표시됩니다.
        </p>
      ) : (
        <div className="space-y-3">
          {topics.slice(0, 5).map((topic) => (
            <div
              key={topic.topicId}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate mr-2">{topic.titleKo}</span>
              <span className="shrink-0 text-destructive font-medium">
                {topic.correctRate}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
