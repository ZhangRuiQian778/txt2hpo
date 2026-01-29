import React, { useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { AutoComplete, Input, Spin, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHPOSearch } from '@/hooks/useHPOSearch';
import type { HPOSearchOption, HPOSearchRef } from '@/types';
import './index.css';

export interface HPOSearchProps {
  /** 占位符文本 */
  placeholder?: string;
  /** 搜索结果限制数量 */
  limit?: number;
  /** 模糊匹配阈值 (0-1) */
  threshold?: number;
  /** 防抖延迟 (ms) */
  debounceDelay?: number;
  /** 选择回调 */
  onSelect?: (option: HPOSearchOption) => void;
  /** 搜索变化回调 */
  onSearch?: (value: string) => void;
  /** 默认值 */
  defaultValue?: string;
  /** 是否显示详情 */
  showDetail?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 尺寸 */
  size?: 'small' | 'middle' | 'large';
}

/**
 * HPO 搜索组件
 * 支持通过 HPO ID、英文名称、中文名称进行模糊搜索
 *
 * 触发方式：
 * - 输入时自动触发（带防抖）
 * - 按回车键立即触发
 * - 通过 ref 调用 setValueAndSearch 方法
 */
const HPOSearch = forwardRef<HPOSearchRef, HPOSearchProps>(({
  placeholder = '',
  limit = 20,
  threshold = 0.3,
  debounceDelay = 200,
  onSelect,
  onSearch,
  defaultValue,
  showDetail = true,
  className,
  disabled,
  size = 'middle',
}, ref) => {
  const [value, setValue] = useState<string>(defaultValue || '');
  const [isOpen, setIsOpen] = useState(false);

  const { options, loading, dataLoaded, search } = useHPOSearch(
    limit,
    threshold,
    debounceDelay
  );

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setValueAndSearch: (newValue: string) => {
      setValue(newValue);
      search(newValue, true); // 立即搜索
      setIsOpen(true);
    },
    clear: () => {
      setValue('');
      search('', true);
      setIsOpen(false);
    },
  }), [search]);

  // 处理输入变化（防抖搜索）
  const handleChange = useCallback(
    (inputValue: string) => {
      setValue(inputValue);
      // 输入时使用防抖搜索
      search(inputValue, false);
      onSearch?.(inputValue);
    },
    [search, onSearch]
  );

  // 处理回车键（立即搜索）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // 按回车时立即搜索，不等待防抖
        search(value, true);
        setIsOpen(true);
      }
    },
    [search, value]
  );

  // 处理选择
  const handleSelect = useCallback(
    (selectedValue: string, option: unknown) => {
      const hpoOption = option as HPOSearchOption;
      setValue(selectedValue);
      setIsOpen(false);
      onSelect?.(hpoOption);
    },
    [onSelect]
  );

  // 处理焦点
  const handleFocus = useCallback(() => {
    if (dataLoaded && value.trim()) {
      setIsOpen(true);
    }
  }, [dataLoaded, value]);

  const handleBlur = useCallback(() => {
    // 延迟关闭，允许点击选项
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  // 自定义下拉选项渲染
  const renderOption = useCallback((option: HPOSearchOption) => {
    return {
      value: option.value,
      label: (
        <div className="hpo-search-option">
          <div className="hpo-search-option-header">
            <Tag color="blue">{option.hpoId}</Tag>
            <span className="hpo-name-cn">{option.nameCn}</span>
          </div>
          {showDetail && option.definitionZh && (
            <div className="hpo-search-option-detail">{option.definitionZh}</div>
          )}
        </div>
      ),
    };
  }, [showDetail]);

  // 下拉选项列表
  const dropdownOptions = useMemo(() => {
    return options.map((option) => ({
      ...option,
      ...renderOption(option),
    }));
  }, [options, renderOption]);

  // 未加载时的空状态
  const notFoundContent = useMemo(() => {
    if (loading) {
      return (
        <div className="hpo-search-loading">
          <Spin size="small" /> 加载中...
        </div>
      );
    }
    if (!dataLoaded) {
      return <div className="hpo-search-not-found">数据加载中...</div>;
    }
    return <div className="hpo-search-not-found">未找到匹配结果</div>;
  }, [loading, dataLoaded]);

  return (
    <div className={`hpo-search ${className || ''}`}>
      <AutoComplete
        value={value}
        options={dropdownOptions}
        onSearch={handleChange}
        onSelect={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        open={isOpen}
        placeholder={placeholder}
        disabled={disabled || !dataLoaded}
        size={size}
        allowClear
        notFoundContent={notFoundContent}
        filterOption={false} // 关闭本地过滤，使用 Fuse.js
        className="hpo-search-input"
        popupClassName="hpo-search-dropdown"
      >
        <Input
          prefix={<SearchOutlined />}
          suffix={loading && <Spin size="small" />}
          onKeyDown={handleKeyDown}
        />
      </AutoComplete>
    </div>
  );
});

HPOSearch.displayName = 'HPOSearch';

export default HPOSearch;
