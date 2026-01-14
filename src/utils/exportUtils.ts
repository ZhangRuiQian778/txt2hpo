/**
 * 导出工具函数
 */

/**
 * 格式化导出时间
 */
export function formatExportTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * 生成导出文件名
 */
export function generateExportFileName(): string {
  return `${formatExportTime()}.csv`;
}

/**
 * 导出数据为 CSV 文件
 * @param data 要导出的数据
 * @param fileName 文件名（可选，默认使用时间戳）
 * @param onProgress 进度回调（可选）
 */
export function exportToTxt<T>(
  data: T[],
  fileName: string = generateExportFileName(),
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 使用 requestIdleCallback 或 setTimeout 分批处理大数据量
      const chunkSize = 1000;
      let currentIndex = 0;
      const lines: string[] = [];

      function processChunk() {
        const endIndex = Math.min(currentIndex + chunkSize, data.length);

        for (let i = currentIndex; i < endIndex; i++) {
          const item = data[i];
          // 处理每一行数据，由调用者提供格式化逻辑
          lines.push(String(item));
        }

        currentIndex = endIndex;

        // 报告进度
        if (onProgress) {
          onProgress(currentIndex, data.length);
        }

        if (currentIndex < data.length) {
          // 继续处理下一批
          if (typeof window.requestIdleCallback !== 'undefined') {
            window.requestIdleCallback(processChunk);
          } else {
            setTimeout(processChunk, 0);
          }
        } else {
          // 完成处理，生成文件
          try {
            const content = lines.join('\n');
            downloadFile(content, fileName, 'text/plain;charset=utf-8');
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      }

      processChunk();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 直接下载文件（使用 Blob）
 * @param content 文件内容
 * @param fileName 文件名
 * @param mimeType MIME 类型
 */
export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string = 'text/csv;charset=utf-8'
): void {
  // 添加 UTF-8 BOM 以确保 Excel 正确显示中文
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: mimeType });

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 同步导出（用于小数据量）
 * @param content 文件内容
 * @param fileName 文件名
 */
export function exportTxtSync(content: string, fileName: string = generateExportFileName()): void {
  downloadFile(content, fileName);
}

/**
 * CSV 字段转义：如果包含逗号、引号或换行，用引号包裹并转义内部引号
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * 将 HPO 搜索结果格式化为 CSV（使用逗号分隔）
 */
export function formatHPOResultsAsTable(
  results: Array<{
    hpoId: string;
    nameCn: string;
    nameEn: string;
    description?: string;
    definition?: string;
  }>
): string[] {
  const lines: string[] = [];

  // 表头
  lines.push(['HPO ID', '中文名称', '英文名称', '中文描述', '英文描述'].map(escapeCsvField).join(','));

  // 数据行
  for (const result of results) {
    const row = [
      result.hpoId,
      result.nameCn,
      result.nameEn,
      result.description || '',
      result.definition || '',
    ].map(escapeCsvField);
    lines.push(row.join(','));
  }

  return lines;
}

/**
 * 导出 HPO 搜索结果为表格格式
 */
export function exportHPOResults(
  results: Array<{
    hpoId: string;
    nameCn: string;
    nameEn: string;
    description?: string;
    definition?: string;
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (results.length === 0) {
    return Promise.reject(new Error('没有可导出的数据'));
  }

  // 格式化为表格
  const tableLines = formatHPOResultsAsTable(results);

  // 导出
  return exportToTxt(tableLines, generateExportFileName(), onProgress);
}
