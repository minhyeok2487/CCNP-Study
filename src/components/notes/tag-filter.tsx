"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
}

interface TagFilterProps {
  tags: TagItem[];
  selectedTags: string[];
  onToggle: (tagId: string) => void;
}

export function TagFilter({ tags, selectedTags, onToggle }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isActive = selectedTags.includes(tag.id);
        return (
          <button key={tag.id} onClick={() => onToggle(tag.id)} type="button">
            <Badge
              variant={isActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              <Tag className="size-3" />
              {tag.name}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
