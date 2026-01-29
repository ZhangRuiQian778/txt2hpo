import { useEffect, useState } from 'react';
import type { HPOCategory } from '@/types';

interface UseHPOCategoriesResult {
  categories: HPOCategory[];
  loading: boolean;
  error: string | null;
}

/**
 * 加载热门疾病分类（23类）及其对应的第三级 HPO 列表。
 * 数据来源：public/hpo118_2_excel_friendly.json（由 CSV 转换脚本生成）。
 */
export function useHPOCategories(): UseHPOCategoriesResult {
  const [categories, setCategories] = useState<HPOCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch('/hpo118_2_excel_friendly.json');
        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.statusText}`);
        }
        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid categories data: expected array');
        }
        if (!cancelled) {
          setCategories(data as HPOCategory[]);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setCategories([]);
        }
        console.error('Failed to load categories:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}

