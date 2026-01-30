'use client';

import { useEffect, useState, useCallback } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  markdown: string;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let h2Count = 0;
  let h3Count = 0;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let numberedText: string;
      if (level === 2) {
        h2Count++;
        h3Count = 0;
        numberedText = `${h2Count}. ${text}`;
      } else {
        h3Count++;
        numberedText = `${h2Count}.${h3Count} ${text}`;
      }
      items.push({ id: generateId(text), text: numberedText, level });
    }
  }

  return items;
}

export default function TableOfContents({ markdown }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const items = parseHeadings(markdown);

  const handleScroll = useCallback(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    let current = '';
    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= 120) {
        current = heading.id;
      }
    }
    setActiveId(current);
  }, [items]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav className="hidden xl:block w-56 flex-shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto toc-scrollbar">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            목차
          </p>
          <ul className="space-y-1 border-l-2 border-gray-200">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollTo(item.id)}
                  className={`block w-full text-left text-xs leading-snug py-1 transition-colors ${
                    item.level === 3 ? 'pl-5' : 'pl-3'
                  } ${
                    activeId === item.id
                      ? 'text-blue-600 font-semibold border-l-2 border-blue-600 -ml-[2px]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile: floating button + dropdown */}
      <div className="xl:hidden fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="absolute bottom-14 right-0 w-64 max-h-80 overflow-y-auto bg-white rounded-lg shadow-xl border p-3 toc-scrollbar">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              목차
            </p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className={`block w-full text-left text-xs leading-snug py-1 transition-colors ${
                      item.level === 3 ? 'pl-4' : 'pl-1'
                    } ${
                      activeId === item.id
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          aria-label="목차 열기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>
    </>
  );
}
