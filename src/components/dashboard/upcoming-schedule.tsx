"use client";

import { Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

interface UpcomingScheduleProps {
  items: {
    id: string;
    date: string;
    topicTitleKo: string;
    completed: boolean;
  }[];
}

export function UpcomingSchedule({ items }: UpcomingScheduleProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">
          향후 7일 학습 일정
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          설정에서 시험일을 지정하면 학습 일정이 생성됩니다.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 text-sm rounded-md p-2 hover:bg-muted/50"
            >
              <span className="shrink-0 text-xs text-muted-foreground w-16">
                {format(parseISO(item.date), "M/d (E)", { locale: ko })}
              </span>
              <span
                className={`flex-1 truncate ${
                  item.completed
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {item.topicTitleKo}
              </span>
              {item.completed && (
                <span className="text-xs text-emerald-500">완료</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
