import { message } from 'antd';
import { exportToCSV, exportToJSON, generateHPOText, copyToClipboard } from '@/utils/export';
import type { SmartMatchResult } from '@/types';

/**
 * 导出功能的Hook
 */
export function useExport() {
  const [messageApi, contextHolder] = message.useMessage();

  const exportCSV = (data: SmartMatchResult, filename?: string) => {
    try {
      exportToCSV(data.hpoEntries, filename);
      messageApi.success('CSV文件导出成功');
    } catch (error) {
      messageApi.error('导出失败，请检查数据');
    }
  };

  const exportJSON = (data: SmartMatchResult, filename?: string) => {
    try {
      exportToJSON(data, filename);
      messageApi.success('JSON文件导出成功');
    } catch (error) {
      messageApi.error('导出失败，请检查数据');
    }
  };

  const copyResults = (data: SmartMatchResult) => {
    const text = generateHPOText(data.hpoEntries);
    copyToClipboard(text).then(success => {
      if (success) {
        messageApi.success('已复制到剪贴板');
      } else {
        messageApi.error('复制失败，请手动复制');
      }
    });
  };

  return {
    exportCSV,
    exportJSON,
    copyResults,
    MessageProvider: contextHolder,
  };
}
