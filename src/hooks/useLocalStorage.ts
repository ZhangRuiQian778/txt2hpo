import { useState } from 'react';

/**
 * 使用localStorage的Hook
 * @param key 存储键名
 * @param initialValue 初始值
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue] as const;
}

/**
 * 使用搜索历史的Hook
 */
export function useSearchHistory(maxHistory = 10) {
  const [history, setHistory] = useLocalStorage<string[]>('hpo-search-history', []);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    setHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)];
      return newHistory.slice(0, maxHistory);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addToHistory, clearHistory };
}

/**
 * 使用转换结果的Hook
 */
export function useConversionHistory() {
  type ConversionHistoryItem = Record<string, unknown> & { timestamp: string };
  const [conversions, setConversions] = useLocalStorage<ConversionHistoryItem[]>('hpo-conversions', []);

  const addConversion = (result: Record<string, unknown>) => {
    setConversions(prev => [
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 20)); // 最多保存20条
  };

  const clearConversions = () => {
    setConversions([]);
  };

  return { conversions, addConversion, clearConversions };
}
