import questions from '@/data/questions.json';
import { Question } from '@/types';
import SingleQuestionClient from './client';

export function generateStaticParams() {
  return (questions as Question[]).map((q) => ({
    id: String(q.id),
  }));
}

export default function SingleQuestionPage() {
  return <SingleQuestionClient />;
}
