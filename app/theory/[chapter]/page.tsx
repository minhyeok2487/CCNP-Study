import chapters from '@/data/chapters.json';
import { Chapter } from '@/types';
import ChapterClient from './client';

export function generateStaticParams() {
  return (chapters as Chapter[]).map((c) => ({
    chapter: String(c.id),
  }));
}

export default function ChapterPage() {
  return <ChapterClient />;
}
