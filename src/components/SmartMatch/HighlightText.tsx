import { useRef, useEffect } from 'react';
import { Card, Typography, Empty } from 'antd';
import type { HPOEntry } from '@/types';
import { extractMatchesFromHPO, highlightText } from '@/utils/highlight';

const { Text } = Typography;

interface HighlightTextProps {
  originalText: string;
  hpoEntries: HPOEntry[];
  activeHighlightIndex?: number;
}

export function HighlightText({
  originalText,
  hpoEntries,
  activeHighlightIndex,
}: HighlightTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = extractMatchesFromHPO(originalText, hpoEntries);
  const { html } = highlightText(originalText, matches);

  useEffect(() => {
    if (activeHighlightIndex !== undefined && containerRef.current) {
      const highlights = containerRef.current.querySelectorAll('mark');
      if (activeHighlightIndex >= 0 && activeHighlightIndex < highlights.length) {
        const target = highlights[activeHighlightIndex] as HTMLElement;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        target.classList.add('highlight-animate');
        const timeout = setTimeout(() => {
          target.classList.remove('highlight-animate');
        }, 600);

        return () => clearTimeout(timeout);
      }
    }
  }, [activeHighlightIndex]);

  if (!originalText) {
    return (
      <Card
        style={{ height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Empty description="暂无原文内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  if (hpoEntries.length === 0) {
    return (
      <Card
        style={{ height: '100%' }}
      >
        <div style={{ padding: 'var(--spacing-md) 0' }}>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>原文内容：</Text>
          <p style={{
            marginTop: 'var(--spacing-sm)',
            lineHeight: 'var(--line-height-lg)',
            whiteSpace: 'pre-wrap',
            fontSize: 'var(--font-size-md)',
          }}>
            {originalText}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{ height: '100%', overflow: 'hidden' }}
      bodyStyle={{
        maxHeight: 'calc(100vh - 280px)',
        overflow: 'auto',
        padding: 'var(--spacing-md) var(--spacing-lg)',
      }}
    >
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          lineHeight: '1.8',
          fontSize: 'var(--font-size-md)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />
    </Card>
  );
}
