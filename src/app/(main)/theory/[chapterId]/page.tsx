"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { getChapterById, CHAPTERS } from "@/lib/constants/chapters";

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = Number(params.chapterId);
  const chapter = getChapterById(chapterId);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapter) return;

    fetch(`/theory/chapter${chapterId}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("# 콘텐츠를 불러올 수 없습니다.");
        setLoading(false);
      });
  }, [chapterId, chapter]);

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">존재하지 않는 챕터입니다.</p>
        <Link href="/theory" className="text-primary hover:underline">
          이론 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const prevChapter = chapterId > 1 ? getChapterById(chapterId - 1) : null;
  const nextChapter = chapterId < CHAPTERS.length ? getChapterById(chapterId + 1) : null;

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
      <div className="flex items-center gap-3">
        <Link
          href="/theory"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          이론 목록
        </Link>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">{chapter.part}</p>
        <h1 className="text-2xl font-bold">
          Chapter {chapter.id}: {chapter.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {chapter.description}
        </p>
      </div>

      {/* Markdown Content */}
      <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none prose-table:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </article>

      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        {prevChapter ? (
          <Link
            href={`/theory/${prevChapter.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <div>
              <p className="text-xs text-muted-foreground">이전</p>
              <p className="font-medium">Ch.{prevChapter.id} {prevChapter.title}</p>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextChapter ? (
          <Link
            href={`/theory/${nextChapter.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground text-right"
          >
            <div>
              <p className="text-xs text-muted-foreground">다음</p>
              <p className="font-medium">Ch.{nextChapter.id} {nextChapter.title}</p>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
