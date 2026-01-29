import type { HPODataItem } from '@/types';

let cachedData: HPODataItem[] | null = null;
let inFlight: Promise<HPODataItem[]> | null = null;

/**
 * 加载并缓存 HPO 明细数据（public/hpo_data.json）。
 * - 避免页面内多个组件/Hook 重复 fetch 同一份大 JSON。
 */
export async function getHpoData(): Promise<HPODataItem[]> {
  if (cachedData) {
    return cachedData;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const response = await fetch('/hpo_data.json');
    if (!response.ok) {
      throw new Error(`Failed to load HPO data: ${response.statusText}`);
    }
    const data: HPODataItem[] = await response.json();
    cachedData = data;
    return data;
  })();

  try {
    return await inFlight;
  } finally {
    // 无论成功失败都清理 inFlight，避免永久挂起
    inFlight = null;
  }
}

