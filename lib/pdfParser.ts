import { Question } from '@/types';

interface ParsedQuestion {
  id: number;
  examPart: string;
  question: string;
  options: Record<string, string>;
  correctAnswer: string | string[];
  type: 'single' | 'multiple' | 'dragdrop';
}

export async function parsePdfText(text: string): Promise<ParsedQuestion[]> {
  const questions: ParsedQuestion[] = [];

  // Split by exam sections
  const examASectionMatch = text.match(/Exam A([\s\S]*?)(?=Exam B|Drag Drop|$)/i);
  const examBSectionMatch = text.match(/Exam B([\s\S]*?)(?=Drag Drop|$)/i);
  const dragDropSectionMatch = text.match(/Drag Drop([\s\S]*?)$/i);

  if (examASectionMatch) {
    const examAQuestions = parseQuestionsFromSection(examASectionMatch[1], 'Exam A');
    questions.push(...examAQuestions);
  }

  if (examBSectionMatch) {
    const examBQuestions = parseQuestionsFromSection(examBSectionMatch[1], 'Exam B');
    questions.push(...examBQuestions);
  }

  if (dragDropSectionMatch) {
    const dragDropQuestions = parseQuestionsFromSection(dragDropSectionMatch[1], 'Drag Drop');
    questions.push(...dragDropQuestions);
  }

  // Assign sequential IDs
  return questions.map((q, index) => ({
    ...q,
    id: index + 1,
  }));
}

function parseQuestionsFromSection(sectionText: string, examPart: string): Omit<ParsedQuestion, 'id'>[] {
  const questions: Omit<ParsedQuestion, 'id'>[] = [];

  // Pattern to match each question block
  const questionPattern = /QUESTION\s*(\d+)\s*([\s\S]*?)(?=QUESTION\s*\d+|$)/gi;
  let match;

  while ((match = questionPattern.exec(sectionText)) !== null) {
    const questionBlock = match[2];
    const parsed = parseQuestionBlock(questionBlock, examPart);
    if (parsed) {
      questions.push(parsed);
    }
  }

  return questions;
}

function parseQuestionBlock(block: string, examPart: string): Omit<ParsedQuestion, 'id'> | null {
  try {
    // Extract question text (everything before options)
    const optionStartMatch = block.match(/\n\s*A\.\s/);
    if (!optionStartMatch) return null;

    const questionText = block
      .substring(0, optionStartMatch.index)
      .trim()
      .replace(/\s+/g, ' ');

    // Determine question type
    const isMultiple = /choose\s+(two|three|all)/i.test(questionText) ||
                       /select\s+(two|three|all)/i.test(questionText);
    const isDragDrop = examPart === 'Drag Drop' || /drag/i.test(questionText);

    // Extract options
    const options: Record<string, string> = {};
    const optionPattern = /([A-F])\.\s*([\s\S]*?)(?=\n\s*[A-F]\.\s|\nCorrect Answer|\n\n|$)/gi;
    let optionMatch;

    while ((optionMatch = optionPattern.exec(block)) !== null) {
      const letter = optionMatch[1].toUpperCase();
      const optionText = optionMatch[2].trim().replace(/\s+/g, ' ');
      options[letter] = optionText;
    }

    // Extract correct answer
    const answerMatch = block.match(/Correct Answer[:\s]*([A-F]+)/i);
    let correctAnswer: string | string[];

    if (answerMatch) {
      const answerStr = answerMatch[1].toUpperCase();
      if (answerStr.length > 1) {
        correctAnswer = answerStr.split('');
      } else {
        correctAnswer = answerStr;
      }
    } else {
      return null; // No answer found
    }

    // Determine final type
    let type: 'single' | 'multiple' | 'dragdrop';
    if (isDragDrop) {
      type = 'dragdrop';
    } else if (isMultiple || Array.isArray(correctAnswer)) {
      type = 'multiple';
    } else {
      type = 'single';
    }

    return {
      examPart,
      question: questionText,
      options,
      correctAnswer,
      type,
    };
  } catch (error) {
    console.error('Error parsing question block:', error);
    return null;
  }
}

// API endpoint helper for browser usage
export async function parseUploadedPdf(file: File): Promise<Question[]> {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch('/api/parse-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to parse PDF');
  }

  const data = await response.json();
  return data.questions;
}

// Utility to validate parsed questions
export function validateQuestions(questions: Question[]): {
  valid: Question[];
  invalid: { index: number; reason: string }[];
} {
  const valid: Question[] = [];
  const invalid: { index: number; reason: string }[] = [];

  questions.forEach((q, index) => {
    const reasons: string[] = [];

    if (!q.question || q.question.length < 10) {
      reasons.push('Question text too short');
    }

    if (!q.options || Object.keys(q.options).length < 2) {
      reasons.push('Not enough options');
    }

    if (!q.correctAnswer) {
      reasons.push('No correct answer');
    }

    if (reasons.length > 0) {
      invalid.push({ index, reason: reasons.join(', ') });
    } else {
      valid.push(q);
    }
  });

  return { valid, invalid };
}
