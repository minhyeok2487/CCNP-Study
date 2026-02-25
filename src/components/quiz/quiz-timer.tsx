"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTimerProps {
  className?: string;
  onTick?: (seconds: number) => void;
}

export function QuizTimer({ className, onTick }: QuizTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm font-mono text-muted-foreground",
        className
      )}
    >
      <Timer className="h-4 w-4" />
      <span>{formatted}</span>
    </div>
  );
}
