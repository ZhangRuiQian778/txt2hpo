import { Card, Tag, Space, Typography, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { HPOEntry } from '@/types';

const { Text } = Typography;

interface ResultCardProps {
  entry: HPOEntry;
  index: number;
  onHighlight?: (index: number) => void;
  onDelete?: () => void;
}

export function ResultCard({ entry, index, onHighlight, onDelete }: ResultCardProps) {
  return (
    <Card
      size="small"
      className="result-card"
      style={{ marginBottom: 'var(--spacing-md)' }}
      extra={
        onDelete && (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onDelete}
            style={{
              color: 'var(--color-text-tertiary)',
              padding: '4px 8px',
            }}
            size="small"
          />
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* HPO ID 和名称 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Tag color="blue">{entry.hpoId}</Tag>
          <Text strong style={{ fontSize: 'var(--font-size-base)' }}>
            {entry.nameCn}
          </Text>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            / {entry.nameEn}
          </Text>
        </div>

        {/* 匹配文本 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)', minWidth: '56px' }}>
            匹配文本:
          </Text>
          <Tag
            color="orange"
            style={{
              cursor: onHighlight ? 'pointer' : 'default',
              fontSize: 'var(--font-size-xs)',
            }}
            onClick={() => onHighlight?.(index)}
          >
            {entry.matchedText}
          </Tag>
        </div>
      </Space>
    </Card>
  );
}
