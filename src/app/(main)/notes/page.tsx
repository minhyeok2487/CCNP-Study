"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagFilter } from "@/components/notes/tag-filter";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Clock,
  BookOpen,
  StickyNote,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface NoteTag {
  id: string;
  name: string;
}

interface NoteItem {
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
  tags: NoteTag[];
}

interface ExamDomain {
  id: string;
  title_ko: string;
  color: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [domains, setDomains] = useState<ExamDomain[]>([]);
  const [allTags, setAllTags] = useState<NoteTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch domains
      const { data: domainsData } = await supabase
        .from("exam_domains")
        .select("id, title_ko, color")
        .order("sort_order");

      setDomains(domainsData || []);

      // Fetch notes with domain info
      const { data: notesData } = await supabase
        .from("notes")
        .select(
          "id, title, content, is_pinned, created_at, updated_at, domain_id, topic_id, exam_domains(id, title_ko, color)"
        )
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      // Fetch note_tags with tag info for all notes
      const noteIds = (notesData || []).map((n: any) => n.id);
      let noteTagsMap: Record<string, NoteTag[]> = {};

      if (noteIds.length > 0) {
        const { data: noteTagsData } = await supabase
          .from("note_tags")
          .select("note_id, tags(id, name)")
          .in("note_id", noteIds);

        (noteTagsData || []).forEach((nt: any) => {
          if (!noteTagsMap[nt.note_id]) {
            noteTagsMap[nt.note_id] = [];
          }
          if (nt.tags) {
            noteTagsMap[nt.note_id].push({
              id: nt.tags.id,
              name: nt.tags.name,
            });
          }
        });
      }

      // Fetch all user tags
      const { data: tagsData } = await supabase
        .from("tags")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      setAllTags(tagsData || []);

      const mappedNotes: NoteItem[] = (notesData || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        is_pinned: n.is_pinned,
        created_at: n.created_at,
        updated_at: n.updated_at,
        domain_id: n.domain_id,
        topic_id: n.topic_id,
        domain: n.exam_domains
          ? {
              id: n.exam_domains.id,
              title_ko: n.exam_domains.title_ko,
              color: n.exam_domains.color,
            }
          : null,
        tags: noteTagsMap[n.id] || [],
      }));

      setNotes(mappedNotes);
      setLoading(false);
    }

    fetchData();
  }, []);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Search filter
      if (
        searchQuery &&
        !note.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Domain filter
      if (selectedDomain !== "all" && note.domain_id !== selectedDomain) {
        return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const noteTagIds = note.tags.map((t) => t.id);
        const hasMatchingTag = selectedTags.some((tagId) =>
          noteTagIds.includes(tagId)
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [notes, searchQuery, selectedDomain, selectedTags]);

  // Sort: pinned first, then by updated_at
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [filteredNotes]);

  function truncateContent(content: string | null, maxLength: number = 120) {
    if (!content) return "";
    // Strip markdown syntax for preview
    const stripped = content
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*|__/g, "")
      .replace(/\*|_/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(/>\s/g, "")
      .replace(/-\s/g, "")
      .replace(/\n/g, " ")
      .trim();
    if (stripped.length <= maxLength) return stripped;
    return stripped.slice(0, maxLength) + "...";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StickyNote className="size-7 text-primary" />
          <h1 className="text-2xl font-bold">노트</h1>
          <Badge variant="secondary">{notes.length}</Badge>
        </div>
        <Link href="/notes/new">
          <Button>
            <Plus className="size-4" />
            새 노트
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="노트 제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="도메인 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 도메인</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    />
                    {domain.title_ko}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <TagFilter
            tags={allTags}
            selectedTags={selectedTags}
            onToggle={handleTagToggle}
          />
        )}
      </div>

      {/* Notes Grid */}
      {sortedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="size-12 mb-4 opacity-50" />
          {notes.length === 0 ? (
            <>
              <p className="text-lg font-medium">아직 노트가 없습니다</p>
              <p className="text-sm mt-1">
                첫 번째 노트를 작성해 보세요!
              </p>
              <Link href="/notes/new" className="mt-4">
                <Button variant="outline">
                  <Plus className="size-4" />
                  새 노트 작성
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">
                검색 결과가 없습니다
              </p>
              <p className="text-sm mt-1">
                다른 검색어나 필터를 시도해 보세요.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedNotes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-1">
                      {note.title}
                    </CardTitle>
                    {note.is_pinned && (
                      <Pin className="size-4 shrink-0 text-primary fill-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.domain && (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${note.domain.color}20`,
                          color: note.domain.color,
                          borderColor: `${note.domain.color}40`,
                        }}
                      >
                        {note.domain.title_ko}
                      </Badge>
                    )}
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {truncateContent(note.content)}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      {format(new Date(note.updated_at), "yyyy.MM.dd HH:mm", {
                        locale: ko,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
