import { Card, Empty, Typography, Space, Alert, Spin } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import type { SmartMatchResult } from '@/types';
import { ResultCard } from '@/components/common/ResultCard';

const { Text } = Typography;

interface HPOResultListProps {
  result: SmartMatchResult | null;
  loading?: boolean;
  onRemoveEntry?: (hpoId: string) => void;
  onHighlightClick?: (index: number) => void;
}

// 格式化处理时间
function formatProcessTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return remainingSeconds === '0' ? `${minutes}min` : `${minutes}min ${remainingSeconds}s`;
}

export function HPOResultList({
  result,
  loading = false,
  onRemoveEntry,
  onHighlightClick,
}: HPOResultListProps) {
  const handleHighlightClick = (index: number) => {
    onHighlightClick?.(index);
  };

  if (loading) {
    return (
      <Card
        style={{ height: '100%', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        bodyStyle={{ width: '100%' }}
      >
        <Space direction="vertical" align="center" size={12}>
          <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: '24px' }} spin />} />
          <Text type="secondary">正在识别转换中...</Text>
        </Space>
      </Card>
    );
  }

  if (!result || !result.originalText) {
    return (
      <Card
        style={{ height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        bodyStyle={{ width: '100%' }}
      >
        <Empty
          description="请输入医嘱内容后点击「识别转换」按钮"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  if (result.hpoEntries.length === 0) {
    return (
      <Card
        style={{ height: '100%' }}
      >
        <Alert
          message="未能从输入内容中识别出标准的HPO术语"
          description="请尝试使用更规范的医学术语描述"
          type="warning"
          showIcon
          style={{ marginBottom: 'var(--spacing-md)', borderRadius: 'var(--border-radius-md)' }}
        />
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: 'var(--spacing-sm)' }}>
            <strong>常见症状示例：</strong>
          </Text>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 'var(--spacing-sm)',
          }}>
            {['发热', '咳嗽', '胸痛', '呼吸困难', '头痛', '头晕', '腹痛', '恶心', '呕吐', '腹泻', '高血压', '心悸', '水肿', '皮疹', '疲劳'].map(symptom => (
              <span
                key={symptom}
                style={{
                  padding: '4px 8px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                }}
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 结果统计卡片 */}
      <Card
        size="small"
        style={{ marginBottom: 'var(--spacing-md)' }}
        bodyStyle={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            <Space size={8}>
              <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: '16px' }} />
              <Text strong style={{ fontSize: 'var(--font-size-base)' }}>识别完成</Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              处理时间: {formatProcessTime(result.processTime)}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            共识别出 <Text strong style={{ color: 'var(--color-primary)' }}>{result.hpoEntries.length}</Text> 个HPO术语
          </Text>
        </Space>
      </Card>

      {/* 结果列表 */}
      <div style={{ flex: 1 }}>
        {result.hpoEntries.map((entry, index) => (
          <ResultCard
            key={entry.hpoId}
            entry={entry}
            index={index}
            onHighlight={() => handleHighlightClick(index)}
            onDelete={() => onRemoveEntry?.(entry.hpoId)}
          />
        ))}
      </div>
    </div>
  );
}
