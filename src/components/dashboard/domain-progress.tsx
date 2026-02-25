"use client";

import { BarChart3 } from "lucide-react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  cyan: "bg-cyan-500",
};

const colorTextMap: Record<string, string> = {
  blue: "text-blue-500",
  purple: "text-purple-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  red: "text-red-500",
  cyan: "text-cyan-500",
};

interface DomainProgressProps {
  domains: {
    id: string;
    titleKo: string;
    color: string;
    weight: number;
    totalTopics: number;
    completedTopics: number;
  }[];
}

export function DomainProgress({ domains }: DomainProgressProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">
          도메인별 진도
        </h2>
      </div>
      <div className="space-y-4">
        {domains.map((domain) => {
          const pct =
            domain.totalTopics > 0
              ? Math.round(
                  (domain.completedTopics / domain.totalTopics) * 100
                )
              : 0;
          return (
            <div key={domain.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  <span className={colorTextMap[domain.color] || "text-primary"}>
                    {domain.titleKo}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({domain.weight}%)
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {domain.completedTopics}/{domain.totalTopics} · {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    colorMap[domain.color] || "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
