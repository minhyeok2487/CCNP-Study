"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Circle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const colorMap: Record<string, string> = {
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-500",
  cyan: "border-l-cyan-500",
};

const bgColorMap: Record<string, string> = {
  blue: "bg-blue-500/10",
  purple: "bg-purple-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  red: "bg-red-500/10",
  cyan: "bg-cyan-500/10",
};

interface Domain {
  id: string;
  number: number;
  title_en: string;
  title_ko: string;
  weight: number;
  color: string;
}

interface Topic {
  id: string;
  domain_id: string;
  parent_id: string | null;
  code: string;
  title_en: string;
  title_ko: string;
  sort_order: number;
}

interface Progress {
  topic_id: string;
  status: "not_started" | "in_progress" | "completed";
}

interface TopicTreeProps {
  domains: Domain[];
  topics: Topic[];
  progress: Progress[];
  onStatusChange: (
    topicId: string,
    status: "not_started" | "in_progress" | "completed"
  ) => void;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

function StatusButton({
  status,
  onCycle,
}: {
  status: string;
  onCycle: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCycle();
      }}
      className="shrink-0"
      title="상태 변경"
    >
      <StatusIcon status={status} />
    </button>
  );
}

function TopicItem({
  topic,
  children,
  progress,
  onStatusChange,
  depth = 0,
}: {
  topic: Topic;
  children: Topic[];
  progress: Map<string, string>;
  onStatusChange: (topicId: string, status: "not_started" | "in_progress" | "completed") => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = children.length > 0;
  const status = progress.get(topic.id) || "not_started";

  function cycleStatus() {
    const next =
      status === "not_started"
        ? "in_progress"
        : status === "in_progress"
        ? "completed"
        : "not_started";
    onStatusChange(topic.id, next as "not_started" | "in_progress" | "completed");
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer",
          depth > 0 && "ml-4"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}

        <StatusButton status={status} onCycle={cycleStatus} />

        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {topic.code}
        </span>

        <Link
          href={`/roadmap/${topic.id}`}
          onClick={(e) => e.stopPropagation()}
          className="truncate hover:underline"
        >
          {topic.title_ko}
        </Link>
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TopicItem
              key={child.id}
              topic={child}
              children={[]}
              progress={progress}
              onStatusChange={onStatusChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TopicTree({
  domains,
  topics,
  progress,
  onStatusChange,
}: TopicTreeProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(domains.map((d) => d.id))
  );
  const progressMap = new Map(progress.map((p) => [p.topic_id, p.status]));

  function toggleDomain(domainId: string) {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {domains.map((domain) => {
        const domainTopics = topics
          .filter((t) => t.domain_id === domain.id && !t.parent_id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const isExpanded = expandedDomains.has(domain.id);

        return (
          <div
            key={domain.id}
            className={cn(
              "rounded-lg border border-l-4 bg-card",
              colorMap[domain.color]
            )}
          >
            <button
              onClick={() => toggleDomain(domain.id)}
              className={cn(
                "flex w-full items-center gap-3 p-4 text-left font-medium",
                bgColorMap[domain.color]
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <span>
                {domain.number}. {domain.title_ko}
              </span>
              <span className="ml-auto text-sm text-muted-foreground">
                {domain.weight}%
              </span>
            </button>

            {isExpanded && (
              <div className="px-2 pb-3">
                {domainTopics.map((topic) => {
                  const childTopics = topics
                    .filter((t) => t.parent_id === topic.id)
                    .sort((a, b) => a.sort_order - b.sort_order);
                  return (
                    <TopicItem
                      key={topic.id}
                      topic={topic}
                      children={childTopics}
                      progress={progressMap}
                      onStatusChange={onStatusChange}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
