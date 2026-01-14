import { Input, Button, Space, Typography, Alert } from 'antd';
import {
  ClearOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onConvert: () => void;
  onClear: () => void;
  loading?: boolean;
  disabled?: boolean;
  maxLength?: number;
}

export function TextInputArea({
  value,
  onChange,
  onConvert,
  onClear,
  loading = false,
  disabled = false,
  maxLength = 5000,
}: TextInputAreaProps) {
  const remainingChars = maxLength - value.length;
  const showWarning = remainingChars < 500 && remainingChars > 0;
  const showError = remainingChars <= 0;

  return (
    <div style={{ width: '100%' }}>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="请输入医嘱或病例描述，例如：患者出现发热、咳嗽和胸痛，伴有呼吸困难，体温38.5℃"
        autoSize={{ minRows: 6, maxRows: 12 }}
        disabled={disabled || loading}
        style={{
          fontSize: 'var(--font-size-md)',
          lineHeight: 'var(--line-height-lg)',
          resize: 'vertical',
        }}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'var(--spacing-md)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-sm)',
      }}>
        <Space size={8}>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={onConvert}
            loading={loading}
            disabled={disabled || !value.trim()}
            size="middle"
            style={{ minWidth: loading ? '140px' : '100px' }}
          >
            识别转换
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
            disabled={disabled || loading || !value}
            size="middle"
          >
            清空
          </Button>
        </Space>

        <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
          {value.length} / {maxLength} 字符
        </Text>
      </div>

      {showWarning && (
        <Alert
          message={`即将达到字符限制，剩余 ${remainingChars} 个字符`}
          type="warning"
          showIcon
          style={{ marginTop: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-md)' }}
        />
      )}

      {showError && (
        <Alert
          message="已达到最大字符限制，请精简输入内容"
          type="error"
          showIcon
          style={{ marginTop: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-md)' }}
        />
      )}
    </div>
  );
}
