"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { CHAPTERS, PARTS, DOMAIN_NAMES, DOMAIN_COLORS, getChaptersByPart } from "@/lib/constants/chapters";

const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export default function TheoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">이론 학습</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CCNP ENCOR 350-401 교재 기반 {CHAPTERS.length}개 챕터
        </p>
      </div>

      {PARTS.map((part) => {
        const chapters = getChaptersByPart(part);
        if (chapters.length === 0) return null;
        const domainNumber = chapters[0].domainNumber;
        const domainColor = DOMAIN_COLORS[domainNumber];
        const domainName = DOMAIN_NAMES[domainNumber];

        return (
          <section key={part} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{part}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[domainColor] || ""}`}
              >
                Domain {domainNumber}: {domainName}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/theory/${chapter.id}`}
                  className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                      {chapter.id}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium leading-tight group-hover:text-primary">
                        {chapter.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {chapter.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
