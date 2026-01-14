import { useState, useEffect } from 'react';
import { Button, Space, AutoComplete, Typography } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { autocomplete } from '@/services/api';

const { Text } = Typography;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  loading = false,
  disabled = false,
}: SearchBarProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedValue || debouncedValue.length < 2) {
        setOptions([]);
        return;
      }

      try {
        const results = await autocomplete(debouncedValue);
        setOptions(results.map(r => ({ value: r.value, label: r.label })));
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    fetchSuggestions();
  }, [debouncedValue]);

  const handleSelect = () => {
    onSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Space.Compact style={{ width: '100%', display: 'flex' }}>
        <AutoComplete
          value={value}
          onChange={onChange}
          options={options}
          onSelect={handleSelect}
          onInputKeyDown={handleKeyPress}
          placeholder="输入HPO ID (如 HP:0001945) 或症状关键词 (如 发热/Fever)"
          disabled={disabled || loading}
          style={{ flex: 1 }}
          allowClear={false}
          filterOption={false}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={onSearch}
          loading={loading}
          disabled={disabled || !value.trim()}
          size="middle"
          style={{ minWidth: '80px' }}
        >
          搜索
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={onClear}
          disabled={disabled || loading || !value}
          size="middle"
        >
          清空
        </Button>
      </Space.Compact>

      <div style={{ marginTop: 'var(--spacing-sm)' }}>
        <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
          💡 提示：支持HPO ID精确匹配和症状关键词模糊搜索
        </Text>
      </div>
    </div>
  );
}
