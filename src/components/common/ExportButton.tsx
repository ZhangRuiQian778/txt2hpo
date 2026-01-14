import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  FileTextOutlined,
  FileOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { SmartMatchResult } from '@/types';

interface ExportButtonProps {
  data: SmartMatchResult | null;
  disabled?: boolean;
}

export function ExportButton({ data, disabled }: ExportButtonProps) {
  const handleExportCSV = () => {
    if (!data) return;

    const headers = ['HPO ID', 'Name (EN)', 'Name (CN)', 'Confidence (%)', 'Matched Text'];
    const rows = data.hpoEntries.map(item => [
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

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hpo-results-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!data) return;

    const jsonContent = JSON.stringify({
      timestamp: new Date().toISOString(),
      originalText: data.originalText,
      hpoEntries: data.hpoEntries,
      processTime: data.processTime,
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hpo-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!data) return;

    const text = data.hpoEntries.map(entry => {
      return `${entry.hpoId}\t${entry.nameCn} / ${entry.nameEn}\t置信度: ${entry.confidence}%`;
    }).join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'csv',
      icon: <FileTextOutlined />,
      label: '导出CSV',
      onClick: handleExportCSV,
    },
    {
      key: 'json',
      icon: <FileOutlined />,
      label: '导出JSON',
      onClick: handleExportJSON,
    },
    {
      type: 'divider',
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: '复制结果',
      onClick: handleCopy,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} disabled={disabled || !data}>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        size="small"
        style={{
          minWidth: 'auto',
          fontSize: 'var(--font-size-base)',
          fontWeight: 500,
          height: '25px',
          padding: '0 7px',
        }}
      >
        导出结果
      </Button>
    </Dropdown>
  );
}
