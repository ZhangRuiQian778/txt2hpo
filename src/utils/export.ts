import type { HPOEntry, SmartMatchResult } from '@/types';

/**
 * 将HPO数据导出为CSV格式
 */
export function exportToCSV(data: HPOEntry[], filename = 'hpo-results.csv') {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据');
  }

  const headers = ['HPO ID', 'Name (EN)', 'Name (CN)', 'Confidence (%)', 'Matched Text'];
  const rows = data.map(item => [
    item.hpoId,
    `"${item.nameEn}"`,
    `"${item.nameCn}"`,
    item.confidence.toString(),
    `"${item.matchedText}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // 添加BOM以支持Excel正确显示中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, filename);
}

/**
 * 将HPO数据导出为JSON格式
 */
export function exportToJSON(result: SmartMatchResult, filename = 'hpo-results.json') {
  if (!result) {
    throw new Error('没有可导出的数据');
  }

  const jsonContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    originalText: result.originalText,
    hpoEntries: result.hpoEntries,
    processTime: result.processTime,
  }, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

  downloadBlob(blob, filename);
}

/**
 * 下载Blob文件
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * 生成HPO列表的文本格式
 */
export function generateHPOText(hpoEntries: HPOEntry[]): string {
  return hpoEntries.map(entry => {
    return `${entry.hpoId}\t${entry.nameCn} / ${entry.nameEn}\t置信度: ${entry.confidence}%`;
  }).join('\n');
}
