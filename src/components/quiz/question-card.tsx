"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface QuestionData {
  id: string;
  type: "multiple_choice" | "multiple_select";
  question_en: string;
  question_ko: string;
  options_en: string[];
  options_ko: string[];
  difficulty: number;
}

interface QuestionCardProps {
  question: QuestionData;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswers: number[];
  onSelect: (answers: number[]) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const DIFFICULTY_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "매우 쉬움", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  2: { label: "쉬움", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  3: { label: "보통", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  4: { label: "어려움", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  5: { label: "매우 어려움", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswers,
  onSelect,
}: QuestionCardProps) {
  const isMultiSelect = question.type === "multiple_select";
  const difficulty = DIFFICULTY_MAP[question.difficulty] ?? DIFFICULTY_MAP[3];

  function handleOptionClick(index: number) {
    if (isMultiSelect) {
      // Toggle the option in the selected list
      if (selectedAnswers.includes(index)) {
        onSelect(selectedAnswers.filter((a) => a !== index));
      } else {
        onSelect([...selectedAnswers, index]);
      }
    } else {
      // Single select: replace
      onSelect([index]);
    }
  }

  const options = question.options_ko.length > 0 ? question.options_ko : question.options_en;
  const optionsSecondary =
    question.options_ko.length > 0 ? question.options_en : [];

  return (
    <div className="space-y-6">
      {/* Question header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">
            {questionNumber} / {totalQuestions}
          </Badge>
          <Badge variant="secondary" className={difficulty.className}>
            {difficulty.label}
          </Badge>
          {isMultiSelect && (
            <Badge variant="outline" className="text-primary border-primary/30">
              복수 선택
            </Badge>
          )}
        </div>

        {/* Question text */}
        <div>
          <p className="text-base font-medium leading-relaxed">
            {question.question_ko || question.question_en}
          </p>
          {question.question_ko && question.question_en && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {question.question_en}
            </p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {options.map((option, index) => {
          const isSelected = selectedAnswers.includes(index);
          const label = OPTION_LABELS[index] ?? String(index + 1);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(index)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all duration-150",
                "hover:bg-accent/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border"
              )}
            >
              {/* Option label circle / checkbox */}
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isMultiSelect && "rounded-md",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isSelected && isMultiSelect ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  label
                )}
              </span>

              {/* Option text */}
              <div className="flex-1 min-w-0">
                <span className="text-sm leading-relaxed">{option}</span>
                {optionsSecondary[index] && (
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {optionsSecondary[index]}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isMultiSelect && (
        <p className="text-xs text-muted-foreground">
          해당하는 답을 모두 선택하세요. (복수 선택 가능)
        </p>
      )}
    </div>
  );
}
