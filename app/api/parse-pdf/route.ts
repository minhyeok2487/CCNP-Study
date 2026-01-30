import { NextRequest, NextResponse } from 'next/server';

interface ParsedQuestion {
  id: number;
  examPart: string;
  question: string;
  options: Record<string, string>;
  correctAnswer: string | string[];
  type: 'single' | 'multiple' | 'dragdrop';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Read file content
    // const bytes = await file.arrayBuffer();
    // const buffer = Buffer.from(bytes);

    // For server-side PDF parsing, you would use pdf-parse
    // This is a placeholder that shows the expected structure
    // In production, install pdf-parse: npm install pdf-parse

    // const pdfParse = require('pdf-parse');
    // const pdfData = await pdfParse(buffer);
    // const text = pdfData.text;

    // For now, return a message about how to use the feature
    return NextResponse.json({
      message: 'PDF parsing endpoint ready',
      note: 'To enable PDF parsing, install pdf-parse package: npm install pdf-parse',
      instructions: [
        '1. Install pdf-parse: npm install pdf-parse',
        '2. Uncomment the pdf-parse code in this file',
        '3. Upload your PDF file to parse questions',
      ],
      questions: [],
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file' },
      { status: 500 }
    );
  }
}

// Helper function to parse text into questions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Split by exam sections
  const examASectionMatch = text.match(/Exam A([\s\S]*?)(?=Exam B|Drag Drop|$)/i);
  const examBSectionMatch = text.match(/Exam B([\s\S]*?)(?=Drag Drop|$)/i);
  const dragDropSectionMatch = text.match(/Drag Drop([\s\S]*?)$/i);

  let idCounter = 1;

  if (examASectionMatch) {
    const sectionQuestions = parseSection(examASectionMatch[1], 'Exam A', idCounter);
    questions.push(...sectionQuestions);
    idCounter += sectionQuestions.length;
  }

  if (examBSectionMatch) {
    const sectionQuestions = parseSection(examBSectionMatch[1], 'Exam B', idCounter);
    questions.push(...sectionQuestions);
    idCounter += sectionQuestions.length;
  }

  if (dragDropSectionMatch) {
    const sectionQuestions = parseSection(dragDropSectionMatch[1], 'Drag Drop', idCounter);
    questions.push(...sectionQuestions);
  }

  return questions;
}

function parseSection(sectionText: string, examPart: string, startId: number): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const questionPattern = /QUESTION\s*(\d+)\s*([\s\S]*?)(?=QUESTION\s*\d+|$)/gi;
  let match;
  let id = startId;

  while ((match = questionPattern.exec(sectionText)) !== null) {
    const block = match[2];
    const parsed = parseQuestionBlock(block, examPart, id);
    if (parsed) {
      questions.push(parsed);
      id++;
    }
  }

  return questions;
}

function parseQuestionBlock(block: string, examPart: string, id: number): ParsedQuestion | null {
  try {
    const optionStartMatch = block.match(/\n\s*A\.\s/);
    if (!optionStartMatch || optionStartMatch.index === undefined) return null;

    const questionText = block
      .substring(0, optionStartMatch.index)
      .trim()
      .replace(/\s+/g, ' ');

    const isMultiple = /choose\s+(two|three|all)/i.test(questionText) ||
                       /select\s+(two|three|all)/i.test(questionText);
    const isDragDrop = examPart === 'Drag Drop' || /drag/i.test(questionText);

    const options: Record<string, string> = {};
    const optionPattern = /([A-F])\.\s*([\s\S]*?)(?=\n\s*[A-F]\.\s|\nCorrect Answer|\n\n|$)/gi;
    let optionMatch;

    while ((optionMatch = optionPattern.exec(block)) !== null) {
      const letter = optionMatch[1].toUpperCase();
      const optionText = optionMatch[2].trim().replace(/\s+/g, ' ');
      options[letter] = optionText;
    }

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
      return null;
    }

    let type: 'single' | 'multiple' | 'dragdrop';
    if (isDragDrop) {
      type = 'dragdrop';
    } else if (isMultiple || Array.isArray(correctAnswer)) {
      type = 'multiple';
    } else {
      type = 'single';
    }

    return {
      id,
      examPart,
      question: questionText,
      options,
      correctAnswer,
      type,
    };
  } catch {
    return null;
  }
}
