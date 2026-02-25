"use client";

import { Flame } from "lucide-react";

interface StudyStreakProps {
  streak: number;
  longestStreak: number;
}

export function StudyStreak({ streak, longestStreak }: StudyStreakProps) {
  return (
    <div className="col-span-1 rounded-lg border bg-card p-6 shadow-sm md:col-span-2 lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-sm font-medium text-muted-foreground">연속 학습</h2>
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold">{streak}</p>
          <p className="text-sm text-muted-foreground">현재 스트릭</p>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <p className="text-3xl font-bold text-muted-foreground">
            {longestStreak}
          </p>
          <p className="text-sm text-muted-foreground">최장 스트릭</p>
        </div>
      </div>
    </div>
  );
}
