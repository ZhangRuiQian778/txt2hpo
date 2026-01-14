import type { HPODataItem } from '@/types';

// 加载 HPO 数据并创建索引
let hpoDataSet: Set<string> | null = null;
let hpoDataMap: Map<string, HPODataItem> | null = null;
let hpoDataArray: HPODataItem[] = []; // 用于模糊匹配的数组

let initPromise: Promise<void> | null = null;

// 模糊匹配相似度阈值
const FUZZY_THRESHOLD = 0.75;

/**
 * 计算字符串相似度（使用 Levenshtein 距离）
 * @returns 0-1 之间的值，1 表示完全匹配
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // 短字符串直接相等比较
  if (maxLen < 4) {
    return str1 === str2 ? 1 : 0;
  }

  // Levenshtein 距离算法
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // 删除
        matrix[i][j - 1] + 1,     // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / maxLen;
}

/**
 * 模糊查找最匹配的 HPO 条目
 * @param query 查询字符串
 * @param field 要匹配的字段 ('nameCn' | 'nameEn')
 * @param threshold 相似度阈值（默认 0.75）
 * @returns 最佳匹配项及相似度，如果未找到返回 null
 */
function fuzzyFindBestMatch(
  query: string,
  field: 'nameCn' | 'nameEn',
  threshold: number = FUZZY_THRESHOLD
): { item: HPODataItem; similarity: number } | null {
  if (!hpoDataArray.length || !query?.trim()) {
    return null;
  }

  const trimmedQuery = query.trim();
  let bestMatch: HPODataItem | null = null;
  let bestSimilarity = 0;

  for (const item of hpoDataArray) {
    const fieldValue = item[field];
    if (!fieldValue) continue;

    // 首先检查精确匹配
    if (fieldValue === trimmedQuery) {
      return { item, similarity: 1 };
    }

    // 计算相似度
    const similarity = calculateSimilarity(trimmedQuery, fieldValue);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = item;
    }
  }

  // 检查是否达到阈值
  if (bestSimilarity >= threshold && bestMatch) {
    return { item: bestMatch, similarity: bestSimilarity };
  }

  return null;
}

/**
 * 初始化 HPO 验证器
 * 加载 HPO 数据并创建索引，支持幂等调用
 */
export async function initHPOValidator(): Promise<void> {
  // 如果已经初始化，直接返回
  if (hpoDataSet !== null && hpoDataMap !== null && hpoDataArray.length > 0) {
    return;
  }

  // 如果正在初始化，等待完成
  if (initPromise) {
    return initPromise;
  }

  // 开始初始化
  initPromise = (async () => {
    try {
      const response = await fetch('/hpo_data.json');
      if (!response.ok) {
        throw new Error(`Failed to load HPO data: ${response.status}`);
      }
      const data: HPODataItem[] = await response.json();
      hpoDataArray = data; // 保存为数组用于模糊匹配
      hpoDataSet = new Set(data.map(item => item.hpoId));
      hpoDataMap = new Map(data.map(item => [item.hpoId, item]));
      console.log(`[HPO-VALIDATOR] Loaded ${data.length} HPO entries`);
    } catch (error) {
      console.error('[HPO-VALIDATOR] Failed to initialize:', error);
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * 验证 HPO ID 是否存在于数据库中
 */
export function isValidHPOId(hpoId: string): boolean {
  return hpoDataSet?.has(hpoId) ?? false;
}

/**
 * 根据 HPO ID 获取完整信息
 */
export function getHPOById(hpoId: string): HPODataItem | undefined {
  return hpoDataMap?.get(hpoId);
}

/**
 * 检查验证器是否已准备就绪
 */
export function isValidatorReady(): boolean {
  return hpoDataSet !== null && hpoDataMap !== null && hpoDataArray.length > 0;
}

/**
 * 获取已加载的 HPO 数据总数
 */
export function getHPOCount(): number {
  return hpoDataArray.length;
}

/**
 * 模糊匹配查找 HPO（按中文名称）
 * @param nameCn 中文名称
 * @param threshold 相似度阈值（默认 0.75）
 * @returns 匹配结果，包含 HPO 条目和相似度
 */
export function findByNameCnFuzzy(
  nameCn: string,
  threshold: number = FUZZY_THRESHOLD
): { item: HPODataItem; similarity: number } | null {
  return fuzzyFindBestMatch(nameCn, 'nameCn', threshold);
}

/**
 * 模糊匹配查找 HPO（按英文名称）
 * @param nameEn 英文名称
 * @param threshold 相似度阈值（默认 0.75）
 * @returns 匹配结果，包含 HPO 条目和相似度
 */
export function findByNameEnFuzzy(
  nameEn: string,
  threshold: number = FUZZY_THRESHOLD
): { item: HPODataItem; similarity: number } | null {
  return fuzzyFindBestMatch(nameEn, 'nameEn', threshold);
}

/**
 * 校准结果类型
 */
export interface CalibrationResult {
  success: boolean;
  hpoData: HPODataItem | null;
  matchType: 'exact_cn' | 'fuzzy_cn' | 'exact_en' | 'fuzzy_en' | 'failed';
  similarity?: number;
  reason?: string;
}

/**
 * 严格的 HPO 校准流程
 * 完全不依赖 LLM 返回的 hpoId，仅使用 nameCn/nameEn 进行匹配
 *
 * @param nameCn LLM 返回的中文名称
 * @param nameEn LLM 返回的英文名称（可选）
 * @param originalHpoId LLM 返回的原始 HPO ID（仅用于日志，不用于校准）
 * @returns 校准结果
 */
export function calibrateHPOStrict(
  nameCn: string,
  nameEn?: string,
  originalHpoId?: string
): CalibrationResult {
  // 记录输入
  const logPrefix = `[HPO-CALIBRATION] "${nameCn}"${nameEn ? ` (${nameEn})` : ''}`;

  // 如果没有提供任何名称，直接失败
  if (!nameCn?.trim() && !nameEn?.trim()) {
    console.warn(`${logPrefix} Skipped: No name provided`);
    return {
      success: false,
      hpoData: null,
      matchType: 'failed',
      reason: 'No name provided',
    };
  }

  // === 步骤 1: 模糊匹配 nameCn ===
  if (nameCn?.trim()) {
    const cnMatch = findByNameCnFuzzy(nameCn);
    if (cnMatch) {
      const matchType = cnMatch.similarity === 1 ? 'exact_cn' : 'fuzzy_cn';
      console.log(`${logPrefix} ✓ Matched by ${matchType} (similarity: ${cnMatch.similarity.toFixed(3)}) → ${cnMatch.item.hpoId}`);
      if (originalHpoId && originalHpoId !== cnMatch.item.hpoId) {
        console.log(`${logPrefix}   Original HPO ID ${originalHpoId} was INCORRECT`);
      }
      return {
        success: true,
        hpoData: cnMatch.item,
        matchType,
        similarity: cnMatch.similarity,
      };
    }
  }

  // === 步骤 2: 备选匹配 nameEn ===
  if (nameEn?.trim()) {
    const enMatch = findByNameEnFuzzy(nameEn);
    if (enMatch) {
      const matchType = enMatch.similarity === 1 ? 'exact_en' : 'fuzzy_en';
      console.log(`${logPrefix} ✓ Matched by ${matchType} (similarity: ${enMatch.similarity.toFixed(3)}) → ${enMatch.item.hpoId}`);
      if (originalHpoId && originalHpoId !== enMatch.item.hpoId) {
        console.log(`${logPrefix}   Original HPO ID ${originalHpoId} was INCORRECT`);
      }
      return {
        success: true,
        hpoData: enMatch.item,
        matchType,
        similarity: enMatch.similarity,
      };
    }
  }

  // === 步骤 3: 跳过无效条目 ===
  console.warn(`${logPrefix} ✗ No match found in HPO database (skipped)`);
  if (originalHpoId) {
    console.warn(`${logPrefix}   LLM provided HPO ID: ${originalHpoId} (NOT USED)`);
  }

  return {
    success: false,
    hpoData: null,
    matchType: 'failed',
    reason: 'No match found in HPO database',
  };
}

/**
 * 导出相似度阈值，便于外部配置
 */
export const FUZZY_MATCH_THRESHOLD = FUZZY_THRESHOLD;
