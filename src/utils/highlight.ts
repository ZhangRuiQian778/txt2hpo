import type { HPOEntry, TextMatch } from '@/types';

// 统一的高亮颜色
const HIGHLIGHT_COLOR = '#ffc53d';

/**
 * 为文本添加高亮标记（使用统一颜色）
 * @param text 原始文本
 * @param matches 匹配项列表
 * @returns 带高亮标记的HTML字符串
 */
export function highlightText(
  text: string,
  matches: Array<{ text: string; startIndex: number; endIndex: number }>
): { html: string; matches: TextMatch[] } {
  if (!matches || matches.length === 0) {
    return { html: text, matches: [] };
  }

  // 按起始位置排序
  const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

  // 处理重叠的匹配
  const nonOverlappingMatches: typeof sortedMatches = [];
  for (const match of sortedMatches) {
    if (nonOverlappingMatches.length === 0) {
      nonOverlappingMatches.push(match);
    } else {
      const lastMatch = nonOverlappingMatches[nonOverlappingMatches.length - 1];
      if (match.startIndex > lastMatch.endIndex) {
        nonOverlappingMatches.push(match);
      }
    }
  }

  // 构建HTML
  let html = '';
  let lastIndex = 0;

  const textMatches: TextMatch[] = [];

  nonOverlappingMatches.forEach((match) => {
    // 添加匹配前的文本
    html += escapeHtml(text.substring(lastIndex, match.startIndex));

    // 添加高亮的文本（统一颜色）
    const matchedText = text.substring(match.startIndex, match.endIndex);
    html += `<mark style="background-color: ${HIGHLIGHT_COLOR}; color: #333;">${escapeHtml(matchedText)}</mark>`;

    textMatches.push({
      text: match.text,
      color: HIGHLIGHT_COLOR,
      startIndex: match.startIndex,
      endIndex: match.endIndex,
    });

    lastIndex = match.endIndex;
  });

  // 添加剩余的文本
  html += escapeHtml(text.substring(lastIndex));

  return { html, matches: textMatches };
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 从HPO条目中提取匹配位置信息
 */
export function extractMatchesFromHPO(
  _text: string,
  hpoEntries: HPOEntry[]
): Array<{ text: string; startIndex: number; endIndex: number }> {
  return hpoEntries
    .filter(entry => entry.startIndex !== undefined && entry.endIndex !== undefined)
    .map(entry => ({
      text: entry.matchedText,
      startIndex: entry.startIndex!,
      endIndex: entry.endIndex!,
    }));
}

/**
 * 滚动到指定高亮位置
 */
export function scrollToHighlight(element: HTMLElement, index: number) {
  const highlights = element.querySelectorAll('mark');
  if (index >= 0 && index < highlights.length) {
    const target = highlights[index] as HTMLElement;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 添加临时高亮效果
    target.style.transition = 'transform 0.3s ease';
    target.style.transform = 'scale(1.1)';
    setTimeout(() => {
      target.style.transform = '';
    }, 300);
  }
}

/**
 * 查找所有高亮标记的位置
 */
export function getHighlightPositions(container: HTMLElement): number[] {
  const highlights = container.querySelectorAll('mark');
  const positions: number[] = [];

  highlights.forEach(mark => {
    positions.push(mark.getBoundingClientRect().top);
  });

  return positions;
}
