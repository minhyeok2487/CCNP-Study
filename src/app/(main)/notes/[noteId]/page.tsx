"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Clock,
  Calendar,
  BookOpen,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import "@uiw/react-markdown-preview/markdown.css";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
);

interface NoteTag {
  id: string;
  name: string;
}

interface NoteDetail {
  id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  domain_id: string | null;
  topic_id: string | null;
  domain: {
    id: string;
    title_ko: string;
    color: string;
  } | null;
  topic: {
    id: string;
    title_ko: string;
  } | null;
  tags: NoteTag[];
}

export default function NoteViewPage() {
  const router = useRouter();
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const noteId = params.noteId as string;
  const supabase = createClient();

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch note with domain and topic
      const { data: noteData, error } = await supabase
        .from("notes")
        .select(
          "id, title, content, is_pinned, created_at, updated_at, domain_id, topic_id, exam_domains(id, title_ko, color), topics(id, title_ko)"
        )
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single();

      if (error || !noteData) {
        router.push("/notes");
        return;
      }

      // Fetch tags
      const { data: noteTagsData } = await supabase
        .from("note_tags")
        .select("tags(id, name)")
        .eq("note_id", noteId);

      const tags: NoteTag[] = (noteTagsData || [])
        .filter((nt: any) => nt.tags)
        .map((nt: any) => ({
          id: nt.tags.id,
          name: nt.tags.name,
        }));

      const mapped: NoteDetail = {
        id: noteData.id,
        title: noteData.title,
        content: noteData.content,
        is_pinned: noteData.is_pinned,
        created_at: noteData.created_at,
        updated_at: noteData.updated_at,
        domain_id: noteData.domain_id,
        topic_id: noteData.topic_id,
        domain: (noteData as any).exam_domains
          ? {
              id: (noteData as any).exam_domains.id,
              title_ko: (noteData as any).exam_domains.title_ko,
              color: (noteData as any).exam_domains.color,
            }
          : null,
        topic: (noteData as any).topics
          ? {
              id: (noteData as any).topics.id,
              title_ko: (noteData as any).topics.title_ko,
            }
          : null,
        tags,
      };

      setNote(mapped);
      setLoading(false);
    }

    fetchNote();
  }, [noteId]);

  const handleTogglePin = async () => {
    if (!note) return;

    const newPinned = !note.is_pinned;
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: newPinned })
      .eq("id", note.id);

    if (!error) {
      setNote((prev) => (prev ? { ...prev, is_pinned: newPinned } : prev));
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    setDeleting(true);
    try {
      // Delete note_tags first
      await supabase.from("note_tags").delete().eq("note_id", note.id);

      // Delete note
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (!error) {
        router.push("/notes");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleTogglePin}>
            {note.is_pinned ? (
              <PinOff className="size-4" />
            ) : (
              <Pin className="size-4" />
            )}
          </Button>
          <Link href={`/notes/${note.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="size-4" />
              편집
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" />
                삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>노트 삭제</DialogTitle>
                <DialogDescription>
                  &quot;{note.title}&quot; 노트를 삭제하시겠습니까? 이 작업은
                  되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">취소</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Note Content */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {note.is_pinned && (
              <Pin className="size-4 text-primary fill-primary" />
            )}
            <h1 className="text-3xl font-bold">{note.title}</h1>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {note.domain && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${note.domain.color}20`,
                  color: note.domain.color,
                  borderColor: `${note.domain.color}40`,
                }}
              >
                <BookOpen className="size-3" />
                {note.domain.title_ko}
              </Badge>
            )}
            {note.topic && (
              <Badge variant="secondary">{note.topic.title_ko}</Badge>
            )}
            {note.tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                <Tag className="size-3" />
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>
                작성:{" "}
                {format(new Date(note.created_at), "yyyy년 M월 d일 HH:mm", {
                  locale: ko,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>
                수정:{" "}
                {format(new Date(note.updated_at), "yyyy년 M월 d일 HH:mm", {
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="border rounded-lg p-6">
          {note.content ? (
            <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
              <MarkdownPreview
                source={note.content}
                style={{ backgroundColor: "transparent" }}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              내용이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
