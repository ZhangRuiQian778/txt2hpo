import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import type { HPODataItem, HPOSearchOption } from '@/types';

// 默认搜索配置
const DEFAULT_LIMIT = 20;
const DEFAULT_THRESHOLD = 0.3; // 0-1，越小越精确
const MIN_SEARCH_LENGTH = 1; // 最小搜索长度

// Fuse.js 配置类型
interface FuseOptions {
  keys: Array<{ name: string; weight: number }>;
  threshold: number;
  ignoreLocation: boolean;
  includeScore: boolean;
  minMatchCharLength: number;
}

// Fuse.js 配置
const FUSE_OPTIONS: FuseOptions = {
  keys: [
    { name: 'hpoId', weight: 2 },      // HPO ID 权重最高
    { name: 'nameCn', weight: 1.5 },   // 中文名称次之
    { name: 'nameEn', weight: 1 },     // 英文名称
    { name: 'definitionZh', weight: 0.5 }, // 中文描述
    { name: 'definition', weight: 0.3 },   // 英文描述
  ],
  threshold: DEFAULT_THRESHOLD,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: MIN_SEARCH_LENGTH,
};

interface UseHPOSearchResult {
  options: HPOSearchOption[];
  loading: boolean;
  error: string | null;
  search: (query: string, immediate?: boolean) => void;
  dataLoaded: boolean;
}

/**
 * HPO 搜索 Hook
 * 使用 Fuse.js 实现前端模糊搜索
 * 支持防抖和立即搜索
 */
export function useHPOSearch(
  limit: number = DEFAULT_LIMIT,
  threshold: number = DEFAULT_THRESHOLD,
  debounceDelay: number = 200
): UseHPOSearchResult {
  const [hpoData, setHpoData] = useState<HPODataItem[]>([]);
  const [options, setOptions] = useState<HPOSearchOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fuseRef = useRef<Fuse<HPODataItem> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQueryRef = useRef('');

  // 加载 HPO 数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/hpo_data.json');
        if (!response.ok) {
          throw new Error(`Failed to load HPO data: ${response.statusText}`);
        }
        const data: HPODataItem[] = await response.json();
        setHpoData(data);

        // 初始化 Fuse 实例
        fuseRef.current = new Fuse(data, {
          ...FUSE_OPTIONS,
          threshold,
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to load HPO data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [threshold]);

  // 执行实际的搜索
  const performSearch = useCallback((query: string) => {
    if (!query.trim() || query.length < MIN_SEARCH_LENGTH) {
      setOptions([]);
      return;
    }

    if (!fuseRef.current || hpoData.length === 0) {
      return;
    }

    // 使用 Fuse 进行模糊搜索
    const results = fuseRef.current.search(query, { limit });

    // 转换为 AutoComplete 选项格式
    const searchOptions: HPOSearchOption[] = results.map((result) => {
      const item = result.item;
      return {
        value: item.hpoId,
        label: `${item.hpoId} - ${item.nameCn} (${item.nameEn})`,
        hpoId: item.hpoId,
        nameEn: item.nameEn,
        nameCn: item.nameCn,
        definition: item.definition,
        definitionZh: item.definitionZh,
      };
    });

    setOptions(searchOptions);
  }, [hpoData, limit]);

  // 搜索函数（支持防抖和立即搜索）
  const search = useCallback((query: string, immediate: boolean = false) => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 立即清空结果（如果查询为空）
    if (!query.trim() || query.length < MIN_SEARCH_LENGTH) {
      setOptions([]);
      currentQueryRef.current = '';
      return;
    }

    // 保存当前查询
    currentQueryRef.current = query;

    if (immediate) {
      // 立即搜索（如按回车键时）
      performSearch(query);
    } else {
      // 防抖搜索
      timeoutRef.current = setTimeout(() => {
        // 确保搜索的是最新的查询
        if (currentQueryRef.current === query) {
          performSearch(query);
        }
      }, debounceDelay);
    }
  }, [performSearch, debounceDelay]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    options,
    loading,
    error,
    search,
    dataLoaded: hpoData.length > 0,
  };
}
