'use client';

import { useState } from 'react';
import { Question } from '@/types';
import OptionButton from './OptionButton';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string | string[]) => void;
  showResult?: boolean;
  userAnswer?: string | string[] | null;
}

// Drag Drop 사용자 답변 타입
type DragDropAnswer = Record<string, string[]>;

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showResult = false,
  userAnswer = null,
}: QuestionCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    userAnswer && question.type !== 'dragdrop'
      ? Array.isArray(userAnswer)
        ? userAnswer
        : [userAnswer]
      : []
  );

  // Drag Drop 상태
  const [dragDropAnswers, setDragDropAnswers] = useState<DragDropAnswer>(() => {
    if (question.type === 'dragdrop' && userAnswer && typeof userAnswer === 'object') {
      return userAnswer as unknown as DragDropAnswer;
    }
    // 초기화: 각 드롭 타겟에 빈 배열
    const initial: DragDropAnswer = {};
    if (question.dropTargets) {
      Object.keys(question.dropTargets).forEach(target => {
        initial[target] = [];
      });
    }
    return initial;
  });
  const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);

  const isMultiple = question.type === 'multiple';
  const isDragDrop = question.type === 'dragdrop';
  const correctAnswers = question.correctAnswer
    ? (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer])
    : [];

  const handleOptionClick = (option: string) => {
    if (showResult) return;

    let newSelected: string[];

    if (isMultiple) {
      if (selectedOptions.includes(option)) {
        newSelected = selectedOptions.filter((o) => o !== option);
      } else {
        newSelected = [...selectedOptions, option];
      }
    } else {
      newSelected = [option];
    }

    setSelectedOptions(newSelected);
  };

  // Drag Drop 핸들러
  const handleDragItemClick = (item: string) => {
    if (showResult) return;

    // 이미 배치된 아이템인 경우 해제
    for (const target of Object.keys(dragDropAnswers)) {
      if (dragDropAnswers[target].includes(item)) {
        setDragDropAnswers(prev => ({
          ...prev,
          [target]: prev[target].filter(i => i !== item)
        }));
        return;
      }
    }

    // 선택/해제 토글
    setSelectedDragItem(selectedDragItem === item ? null : item);
  };

  const handleDropTargetClick = (target: string) => {
    if (showResult || !selectedDragItem) return;

    // 이미 다른 타겟에 있으면 제거
    const newAnswers = { ...dragDropAnswers };
    for (const t of Object.keys(newAnswers)) {
      newAnswers[t] = newAnswers[t].filter(i => i !== selectedDragItem);
    }

    // 새 타겟에 추가
    newAnswers[target] = [...newAnswers[target], selectedDragItem];
    setDragDropAnswers(newAnswers);
    setSelectedDragItem(null);
  };

  const handleSubmit = () => {
    if (isDragDrop) {
      // 모든 아이템이 배치되었는지 확인
      const placedItems = Object.values(dragDropAnswers).flat();
      if (placedItems.length === 0) return;
      onAnswer(dragDropAnswers as unknown as string[]);
    } else {
      if (selectedOptions.length === 0) return;
      if (isMultiple) {
        onAnswer(selectedOptions.sort());
      } else {
        onAnswer(selectedOptions[0]);
      }
    }
  };

  const getOptionState = (option: string): 'default' | 'selected' | 'correct' | 'wrong' => {
    if (!showResult) {
      return selectedOptions.includes(option) ? 'selected' : 'default';
    }

    const isCorrect = correctAnswers.includes(option);
    const isSelected = selectedOptions.includes(option);

    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'wrong';
    return 'default';
  };

  // Drag Drop 정답 체크
  const checkDragDropAnswer = (): boolean => {
    if (!question.dropTargets) return false;
    for (const target of Object.keys(question.dropTargets)) {
      const correct = question.dropTargets[target].sort();
      const user = (dragDropAnswers[target] || []).sort();
      if (JSON.stringify(correct) !== JSON.stringify(user)) {
        return false;
      }
    }
    return true;
  };

  const isCorrectAnswer = showResult && (
    isDragDrop
      ? checkDragDropAnswer()
      : JSON.stringify(selectedOptions.sort()) === JSON.stringify(correctAnswers.sort())
  );

  // 배치되지 않은 드래그 아이템
  const unplacedItems = (question.dragItems || []).filter(
    item => !Object.values(dragDropAnswers).flat().includes(item)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <span className="text-xs lg:text-sm text-gray-500">
          문제 {questionNumber} / {totalQuestions}
        </span>
        <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${
          question.type === 'single'
            ? 'bg-blue-100 text-blue-700'
            : question.type === 'multiple'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-orange-100 text-orange-700'
        }`}>
          {question.type === 'single'
            ? '단일 선택'
            : question.type === 'multiple'
            ? '복수 선택'
            : '드래그 앤 드롭'}
        </span>
      </div>

      {/* Question Text */}
      <div className="mb-4 lg:mb-6">
        <p className="text-base lg:text-lg font-medium text-gray-900 leading-relaxed">
          {question.question}
        </p>
        {isMultiple && !showResult && (
          <p className="text-xs lg:text-sm text-gray-500 mt-2">
            * 해당되는 항목을 모두 선택하세요
          </p>
        )}
      </div>

      {/* Options - Single/Multiple Choice */}
      {!isDragDrop && question.options && (
        <div className="space-y-2 lg:space-y-3 mb-4 lg:mb-6">
          {Object.entries(question.options).map(([key, value]) => (
            <OptionButton
              key={key}
              label={key}
              text={value}
              state={getOptionState(key)}
              onClick={() => handleOptionClick(key)}
              disabled={showResult}
            />
          ))}
        </div>
      )}

      {/* Drag Drop UI */}
      {isDragDrop && question.dragItems && question.dropTargets && (
        <div className="mb-4 lg:mb-6">
          {/* 안내 문구 */}
          {!showResult && (
            <p className="text-xs lg:text-sm text-gray-500 mb-3 lg:mb-4">
              * 항목을 클릭하여 선택한 후, 해당 카테고리를 클릭하세요
            </p>
          )}

          {/* 드래그 아이템 (배치되지 않은 것들) */}
          {unplacedItems.length > 0 && (
            <div className="mb-3 lg:mb-4">
              <p className="text-xs lg:text-sm font-medium text-gray-700 mb-2">항목:</p>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {unplacedItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleDragItemClick(item)}
                    disabled={showResult}
                    className={`px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm transition-colors border ${
                      selectedDragItem === item
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    } ${showResult ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 드롭 타겟 영역 */}
          <div className="grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2">
            {Object.keys(question.dropTargets).map((target) => {
              const correctItems = question.dropTargets![target];
              const userItems = dragDropAnswers[target] || [];
              const isTargetCorrect = showResult &&
                JSON.stringify(correctItems.sort()) === JSON.stringify(userItems.sort());

              return (
                <div
                  key={target}
                  onClick={() => handleDropTargetClick(target)}
                  className={`p-3 lg:p-4 rounded-lg border-2 min-h-[100px] lg:min-h-[120px] transition-colors ${
                    showResult
                      ? isTargetCorrect
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                      : selectedDragItem
                        ? 'border-blue-400 bg-blue-50 cursor-pointer hover:border-blue-500'
                        : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <p className={`text-sm lg:text-base font-medium mb-2 ${
                    showResult
                      ? isTargetCorrect ? 'text-green-700' : 'text-red-700'
                      : 'text-gray-800'
                  }`}>
                    {target}
                  </p>

                  {/* 배치된 아이템들 */}
                  <div className="flex flex-wrap gap-1">
                    {userItems.map((item, idx) => {
                      const isItemCorrect = correctItems.includes(item);
                      return (
                        <span
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDragItemClick(item);
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            showResult
                              ? isItemCorrect
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                              : 'bg-blue-200 text-blue-800 cursor-pointer hover:bg-blue-300'
                          }`}
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>

                  {/* 정답 표시 (오답인 경우) */}
                  {showResult && !isTargetCorrect && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">정답:</p>
                      <div className="flex flex-wrap gap-1">
                        {correctItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className={`p-3 lg:p-4 rounded-lg mb-4 lg:mb-6 ${
          isCorrectAnswer
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            <span className={`text-base lg:text-lg font-bold ${
              isCorrectAnswer ? 'text-green-700' : 'text-red-700'
            }`}>
              {isCorrectAnswer ? '정답입니다!' : '오답입니다'}
            </span>
          </div>
          {!isCorrectAnswer && (
            <p className="text-xs lg:text-sm text-gray-700">
              정답: <span className="font-semibold">{correctAnswers.join(', ')}</span>
            </p>
          )}
          {question.explanation && (
            <div className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-200">
              <p className="text-xs lg:text-sm font-medium text-gray-700 mb-1">해설:</p>
              <p className="text-xs lg:text-sm text-gray-600">{question.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={
            isDragDrop
              ? Object.values(dragDropAnswers).flat().length === 0
              : selectedOptions.length === 0
          }
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            (isDragDrop ? Object.values(dragDropAnswers).flat().length > 0 : selectedOptions.length > 0)
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          정답 확인
        </button>
      )}
    </div>
  );
}
