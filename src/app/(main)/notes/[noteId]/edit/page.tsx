"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Save, X, Plus, Trash2 } from "lucide-react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface ExamDomain {
  id: string;
  title_ko: string;
  color: string;
}

interface Topic {
  id: string;
  title_ko: string;
  domain_id: string;
}

interface TagItem {
  id: string;
  name: string;
}

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const noteId = params.noteId as string;
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string | undefined>("");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [domains, setDomains] = useState<ExamDomain[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [domainsRes, topicsRes, tagsRes, noteRes, noteTagsRes] =
        await Promise.all([
          supabase
            .from("exam_domains")
            .select("id, title_ko, color")
            .order("sort_order"),
          supabase
            .from("topics")
            .select("id, title_ko, domain_id")
            .order("sort_order"),
          supabase
            .from("tags")
            .select("id, name")
            .eq("user_id", user.id)
            .order("name"),
          supabase
            .from("notes")
            .select("id, title, content, domain_id, topic_id, is_pinned")
            .eq("id", noteId)
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("note_tags")
            .select("tags(id, name)")
            .eq("note_id", noteId),
        ]);

      if (!noteRes.data) {
        router.push("/notes");
        return;
      }

      setDomains(domainsRes.data || []);
      setTopics(topicsRes.data || []);
      setAllTags(tagsRes.data || []);

      // Populate form with existing data
      const noteData = noteRes.data;
      setTitle(noteData.title || "");
      setContent(noteData.content || "");
      setSelectedDomainId(noteData.domain_id || "");
      setSelectedTopicId(noteData.topic_id || "");

      // Populate existing tags
      const existingTags: TagItem[] = (noteTagsRes.data || [])
        .filter((nt: any) => nt.tags)
        .map((nt: any) => ({
          id: nt.tags.id,
          name: nt.tags.name,
        }));
      setSelectedTags(existingTags);

      setLoading(false);
    }

    fetchData();
  }, [noteId]);

  // Filter topics when domain changes
  useEffect(() => {
    if (selectedDomainId) {
      setFilteredTopics(
        topics.filter((t) => t.domain_id === selectedDomainId)
      );
    } else {
      setFilteredTopics([]);
    }
  }, [selectedDomainId, topics]);

  const tagSuggestions = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.some((st) => st.id === tag.id)
  );

  const handleAddTag = useCallback(
    (tag: TagItem) => {
      if (!selectedTags.some((st) => st.id === tag.id)) {
        setSelectedTags((prev) => [...prev, tag]);
      }
      setTagInput("");
      setShowTagSuggestions(false);
    },
    [selectedTags]
  );

  const handleCreateAndAddTag = useCallback(async () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = allTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      handleAddTag(existing);
      return;
    }

    const { data: newTag, error } = await supabase
      .from("tags")
      .insert({ name: trimmed, user_id: user.id })
      .select("id, name")
      .single();

    if (newTag && !error) {
      setAllTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  }, [tagInput, allTags, handleAddTag, supabase]);

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notes")
        .update({
          title: title.trim(),
          content: content || "",
          domain_id: selectedDomainId || null,
          topic_id: selectedTopicId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating note:", error);
        setSaving(false);
        return;
      }

      // Update note_tags: delete existing, insert new
      await supabase.from("note_tags").delete().eq("note_id", noteId);

      if (selectedTags.length > 0) {
        const noteTagInserts = selectedTags.map((tag) => ({
          note_id: noteId,
          tag_id: tag.id,
        }));
        await supabase.from("note_tags").insert(noteTagInserts);
      }

      router.push(`/notes/${noteId}`);
    } catch (err) {
      console.error("Error saving note:", err);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from("note_tags").delete().eq("note_id", noteId);
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/notes/${noteId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">노트 편집</h1>
        </div>
        <div className="flex items-center gap-2">
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
                  이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            <Save className="size-4" />
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            placeholder="노트 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Domain & Topic */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>도메인</Label>
            <Select
              value={selectedDomainId}
              onValueChange={(value) => {
                setSelectedDomainId(value);
                // Clear topic when domain changes
                if (value !== selectedDomainId) {
                  setSelectedTopicId("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="도메인 선택" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2">
            <Label>토픽</Label>
            <Select
              value={selectedTopicId}
              onValueChange={setSelectedTopicId}
              disabled={!selectedDomainId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedDomainId
                      ? "토픽 선택"
                      : "도메인을 먼저 선택하세요"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredTopics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title_ko}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>태그</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-1">
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="relative">
            <Input
              placeholder="태그 입력 (Enter로 추가)"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (tagInput.length > 0) setShowTagSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowTagSuggestions(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateAndAddTag();
                }
              }}
            />
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                {tagSuggestions.slice(0, 8).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAddTag(tag);
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            {tagInput.trim() &&
              !allTags.some(
                (t) =>
                  t.name.toLowerCase() === tagInput.trim().toLowerCase()
              ) && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateAndAddTag();
                  }}
                >
                  <Plus className="size-3" />
                  새 태그 생성
                </button>
              )}
          </div>
        </div>

        {/* Markdown Editor */}
        <div className="space-y-2">
          <Label>내용</Label>
          <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
            <MDEditor
              value={content}
              onChange={setContent}
              height={500}
              preview="edit"
              textareaProps={{
                placeholder: "마크다운으로 노트를 작성하세요...",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
