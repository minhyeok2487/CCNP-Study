'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Chapter, Question } from '@/types';
import TableOfContents from './TableOfContents';

interface TheoryContentProps {
  chapter: Chapter;
  relatedQuestions: Question[];
  onMarkComplete?: () => void;
  isCompleted?: boolean;
}

export default function TheoryContent({
  chapter,
  relatedQuestions,
  onMarkComplete,
  isCompleted = false,
}: TheoryContentProps) {
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        const response = await fetch(`/theory/chapter${chapter.id}.md`);
        if (response.ok) {
          const text = await response.text();
          setMarkdownContent(text);
        } else {
          setMarkdownContent(null);
        }
      } catch (error) {
        console.error('Failed to fetch markdown:', error);
        setMarkdownContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [chapter.id]);

  // Fallback content for chapters without markdown
  const getChapterContent = (id: number) => {
    const contents: Record<number, { topics: string[]; keyPoints: string[] }> = {
      1: {
        topics: [
          'CEF (Cisco Express Forwarding) 동작 원리',
          'FIB (Forwarding Information Base)와 Adjacency Table',
          'Process Switching vs Fast Switching vs CEF',
          'Distributed CEF와 Centralized CEF',
          'CEF 문제 해결 및 검증',
        ],
        keyPoints: [
          'CEF는 라우팅 테이블과 ARP 캐시 정보를 미리 계산하여 FIB와 Adjacency Table에 저장',
          'FIB는 라우팅 테이블의 미러 이미지로, 목적지 기반 포워딩 결정에 사용',
          'Adjacency Table은 Layer 2 헤더 재작성 정보를 포함',
          'CEF는 첫 패킷부터 하드웨어 기반 고속 스위칭 제공',
        ],
      },
      2: {
        topics: [
          'STP 기본 동작 (IEEE 802.1D)',
          'Bridge ID와 Root Bridge 선출',
          'Port Roles: Root Port, Designated Port, Blocking Port',
          'STP Convergence와 Timers',
          'RSTP (Rapid Spanning Tree Protocol) 개선사항',
        ],
        keyPoints: [
          'Root Bridge는 가장 낮은 Bridge ID를 가진 스위치',
          'Bridge ID = Priority (4비트) + Extended System ID (12비트) + MAC Address',
          'STP 기본 타이머: Hello(2s), Forward Delay(15s), Max Age(20s)',
          'RSTP는 수렴 시간을 50초에서 수 초로 단축',
        ],
      },
      3: {
        topics: [
          'PortFast와 BPDU Guard',
          'Root Guard와 Loop Guard',
          'UDLD (Unidirectional Link Detection)',
          'STP 최적화 기법',
        ],
        keyPoints: [
          'PortFast는 엔드 디바이스 연결 포트에서 STP 수렴 시간 단축',
          'BPDU Guard는 PortFast 포트에서 BPDU 수신 시 포트 차단',
          'Root Guard는 지정된 포트에서 우수 BPDU 수신 시 root-inconsistent 상태로 전환',
          'Loop Guard는 BPDU 수신 중단 시 loop-inconsistent 상태로 전환',
        ],
      },
      4: {
        topics: [
          'MST (Multiple Spanning Tree Protocol) 개요',
          'MST Region과 IST (Internal Spanning Tree)',
          'MST Instance와 VLAN 매핑',
          'MST 설정 및 검증',
          'PVST+와 MST 상호 운용',
        ],
        keyPoints: [
          'MST는 여러 VLAN을 하나의 STP 인스턴스로 그룹화하여 리소스 효율성 향상',
          'MST Region은 동일한 이름, 리비전, VLAN-Instance 매핑을 가진 스위치 그룹',
          'IST (Instance 0)는 MST Region의 기본 인스턴스로 CIST와 상호작용',
          'MST는 최대 16개 인스턴스 지원 (0-15), Instance 0은 IST로 예약',
        ],
      },
      5: {
        topics: [
          'VLAN Trunking (802.1Q)',
          'DTP (Dynamic Trunking Protocol)',
          'EtherChannel 개요와 이점',
          'LACP (Link Aggregation Control Protocol)',
          'PAgP (Port Aggregation Protocol)',
          'EtherChannel 로드 밸런싱',
        ],
        keyPoints: [
          '802.1Q는 표준 트렁킹 프로토콜로 Native VLAN 프레임은 태그 없이 전송',
          'DTP는 Cisco 전용 프로토콜로 자동 트렁크 협상 담당',
          'EtherChannel은 최대 8개 물리 링크를 하나의 논리적 링크로 묶음',
          'LACP는 IEEE 802.3ad 표준, PAgP는 Cisco 전용 프로토콜',
        ],
      },
    };

    return contents[id] || null;
  };

  const fallbackContent = getChapterContent(chapter.id);

  const generateId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const markdownComponents: Components = useMemo(() => ({
    h2: ({ children, ...props }) => {
      const text = String(children);
      const id = generateId(text);
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      const id = generateId(text);
      return <h3 id={id} {...props}>{children}</h3>;
    },
  }), []);

  return (
    <div className="max-w-4xl xl:max-w-none mx-auto flex gap-6">
      <div className="flex-1 min-w-0 max-w-4xl">
      {/* Chapter Header */}
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <p className="text-xs lg:text-sm text-blue-600 font-medium mb-1">{chapter.part}</p>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              Chapter {chapter.id}: {chapter.title}
            </h1>
            {chapter.description && (
              <p className="text-sm lg:text-base text-gray-600">{chapter.description}</p>
            )}
          </div>
          {isCompleted && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs lg:text-sm font-medium self-start">
              완료됨
            </span>
          )}
        </div>
      </div>

      {/* Markdown Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-6">
          <p className="text-gray-500">콘텐츠 로딩 중...</p>
        </div>
      ) : markdownContent ? (
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-8 mb-4 lg:mb-6 markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      ) : fallbackContent ? (
        <>
          {/* Topics */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">학습 주제</h2>
            <ul className="space-y-2">
              {fallbackContent.topics.map((topic, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Points */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">핵심 포인트</h2>
            <ul className="space-y-3">
              {fallbackContent.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-blue-800">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 rounded-lg p-6 mb-6">
          <p className="text-yellow-800">이 챕터의 상세 내용이 준비 중입니다.</p>
        </div>
      )}

      {/* Related Questions */}
      {relatedQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            관련 문제 ({relatedQuestions.length}문제)
          </h2>
          <div className="space-y-2">
            {relatedQuestions.slice(0, 5).map((q) => (
              <Link
                key={q.id}
                href={`/quiz/${q.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm text-gray-700 line-clamp-2">{q.question}</p>
              </Link>
            ))}
            {relatedQuestions.length > 5 && (
              <Link
                href={`/quiz?category=${encodeURIComponent(chapter.title)}`}
                className="block text-center text-blue-600 hover:text-blue-700 py-2"
              >
                더 많은 문제 보기 →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Mark Complete Button */}
      {onMarkComplete && !isCompleted && (
        <button
          onClick={onMarkComplete}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          이 챕터 학습 완료
        </button>
      )}
      </div>

      {/* Table of Contents */}
      {markdownContent && <TableOfContents markdown={markdownContent} />}
    </div>
  );
}
