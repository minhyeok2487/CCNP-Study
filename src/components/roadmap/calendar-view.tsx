"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  scheduled_date: string;
  completed: boolean;
  topics: { title_ko: string; code: string } | null;
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSchedule() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const { data } = await supabase
        .from("study_schedule")
        .select("id, scheduled_date, completed, topics(title_ko, code)")
        .eq("user_id", user.id)
        .gte("scheduled_date", start)
        .lte("scheduled_date", end)
        .order("scheduled_date");

      setSchedule((data as unknown as ScheduleItem[]) || []);
    }
    fetchSchedule();
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const scheduleByDate = new Map<string, ScheduleItem[]>();
  schedule.forEach((s) => {
    const key = s.scheduled_date;
    const list = scheduleByDate.get(key) || [];
    list.push(s);
    scheduleByDate.set(key, list);
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 rounded hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 rounded hover:bg-muted"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px]" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const items = scheduleByDate.get(dateStr) || [];

          return (
            <div
              key={dateStr}
              className={cn(
                "min-h-[80px] rounded-md border p-1 text-xs",
                isToday(day) && "border-primary bg-primary/5",
                !isSameMonth(day, currentMonth) && "opacity-50"
              )}
            >
              <div
                className={cn(
                  "mb-1 font-medium",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "truncate rounded px-1 py-0.5",
                      item.completed
                        ? "bg-emerald-500/10 text-emerald-600 line-through"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.topics?.code || ""}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-muted-foreground">
                    +{items.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
