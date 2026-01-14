import type { SmartMatchResult, SearchResponse, SearchMode, LLMOutputEntry, HPOEntry } from '@/types';
import { loadConfigStatic } from '@/hooks/useConfig';
import { callLLM } from './llmClient';
import { calibrateHPOStrict, isValidatorReady, type CalibrationResult } from './hpoValidator';
import {
  mockSearch,
  mockGetHPODetail,
  mockAutocomplete,
} from './mock/mockApi';

// Debug 日志前缀
const LOG_PREFIX = '[HPO-DEBUG]';

/**
 * 格式化时间戳
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19) + '.' + now.getMilliseconds().toString().padStart(3, '0');
}

/**
 * Debug 日志工具
 */
class DebugLogger {
  private sessionId: string;

  constructor() {
    this.sessionId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
  }

  /** 获取会话ID */
  getSessionId(): string {
    return this.sessionId;
  }

  /** 原始输出日志 */
  logRawOutput(data: {
    model: string;
    inputText: string;
    userPrompt: string;
    rawResponse: string;
  }) {
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== LLM RAW OUTPUT ====================`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Session: ${this.sessionId}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Model: ${data.model}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] User Prompt:`, data.userPrompt);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Input Text:`, data.inputText);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Raw Response Length: ${data.rawResponse.length} chars`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Raw Response:`, data.rawResponse);
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== END RAW OUTPUT ====================\n`
    );
  }

  /** 解析结果日志 */
  logParseResult(data: {
    cleanedResponse: string;
    parsedEntries: LLMOutputEntry[] | unknown;
    parseError?: string;
  }) {
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ------------------- PARSE RESULT -------------------`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Cleaned Response:`, data.cleanedResponse);
    if (data.parseError) {
      console.warn(`${LOG_PREFIX} [${getTimestamp()}] Parse Error:`, data.parseError);
    } else {
      console.log(`${LOG_PREFIX} [${getTimestamp()}] Parsed Entries Count:`, Array.isArray(data.parsedEntries) ? data.parsedEntries.length : 'N/A');
      console.log(`${LOG_PREFIX} [${getTimestamp()}] Parsed Entries:`, data.parsedEntries);
    }
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ------------------- END PARSE -------------------\n`
    );
  }

  /** 验证结果日志 */
  logValidationResult(data: {
    totalRaw: number;
    validHPOIds: number;
    invalidHPOIds: string[];
    missingFields: number;
  }) {
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ------------------- VALIDATION -------------------`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Total Raw Entries: ${data.totalRaw}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Valid HPO IDs: ${data.validHPOIds}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Invalid HPO IDs:`, data.invalidHPOIds);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Missing Required Fields: ${data.missingFields}`);
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ------------------- END VALIDATION -------------------\n`
    );
  }

  /** 索引修正日志 */
  logIndexCorrection(data: {
    originalEntry: LLMOutputEntry;
    correctedEntry: { startIndex?: number; endIndex?: number };
    reason: string;
  }) {
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] Index Correction for ${data.originalEntry.hpoId}: ${data.reason}`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}]   Original: [${data.originalEntry.startIndex}, ${data.originalEntry.endIndex}]`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}]   Corrected: [${data.correctedEntry.startIndex}, ${data.correctedEntry.endIndex}]`);
  }

  /** 最终展示内容日志 */
  logFinalResult(data: {
    originalText: string;
    hpoEntries: HPOEntry[];
    processTime: number;
  }) {
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== FINAL DISPLAY CONTENT ====================`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Session: ${this.sessionId}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Process Time: ${data.processTime}ms`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Final Entries Count: ${data.hpoEntries.length}`);

    data.hpoEntries.forEach((entry, idx) => {
      console.log(
        `${LOG_PREFIX} [${getTimestamp()}] Entry #${idx + 1}: ` +
        `HPO=${entry.hpoId} | ` +
        `CN=${entry.nameCn} | ` +
        `EN=${entry.nameEn} | ` +
        `Matched="${entry.matchedText}" | ` +
        `Pos=[${entry.startIndex}, ${entry.endIndex}] | `
      );
    });

    // 生成高亮预览
    let highlightedPreview = data.originalText;
    const sortedEntries = [...data.hpoEntries]
      .filter(e => e.startIndex !== undefined && e.endIndex !== undefined)
      .sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));

    let offset = 0;
    sortedEntries.forEach(entry => {
      if (entry.startIndex !== undefined && entry.endIndex !== undefined) {
        const before = highlightedPreview.substring(0, entry.startIndex + offset);
        const match = `[HPO:${entry.hpoId}]${entry.matchedText}[/HPO]`;
        const after = highlightedPreview.substring(entry.endIndex + offset);
        highlightedPreview = before + match + after;
        offset += match.length - (entry.endIndex - entry.startIndex);
      }
    });

    console.log(`${LOG_PREFIX} [${getTimestamp()}] Highlighted Preview:`, highlightedPreview);
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== END FINAL CONTENT ====================\n`
    );
  }

  /** 差异对比日志 */
  logDifferences(data: {
    rawEntries: LLMOutputEntry[];
    finalEntries: HPOEntry[];
    removed: string[];
    modified: Array<{ hpoId: string; field: string; before: unknown; after: unknown }>;
  }) {
    if (data.removed.length === 0 && data.modified.length === 0) {
      console.log(`${LOG_PREFIX} [${getTimestamp()}] No differences between raw and final output.`);
      return;
    }

    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== DIFFERENCES ====================`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Raw Entries: ${data.rawEntries.length}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Final Entries: ${data.finalEntries.length}`);

    if (data.removed.length > 0) {
      console.warn(`${LOG_PREFIX} [${getTimestamp()}] Removed Entries (${data.removed.length}):`, data.removed);
    }

    if (data.modified.length > 0) {
      console.warn(`${LOG_PREFIX} [${getTimestamp()}] Modified Entries (${data.modified.length}):`);
      data.modified.forEach(mod => {
        console.warn(`${LOG_PREFIX} [${getTimestamp()}]   ${mod.hpoId}: ${mod.field} changed from`, mod.before, 'to', mod.after);
      });
    }

    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== END DIFFERENCES ====================\n`
    );
  }
}

// System prompt
const SYSTEM_PROMPT = `You are an expert clinical phenotype extraction assistant. Read the user instructions, extract only medically relevant phenotypes, and reply with valid JSON.

Requirements:
1. Return the information in a standard JSON array format.
2. The startIndex and endIndex represent the character positions of matchedText in the original text (starting from 0).

EXAMPLE JSON OUTPUT:
[
  {
    "hpoId": "HP:0001259",
    "nameEn": "Fever",
    "nameCn": "发热",
    "matchedText": "发热",
    "startIndex": 5,
    "endIndex": 7,
  }
]`;

/**
 * 智能转换API - 使用 LLM 识别症状并映射到 HPO
 */
export async function smartMatch(text: string): Promise<SmartMatchResult> {
  const logger = new DebugLogger();
  const startTime = Date.now();

  console.log(`${LOG_PREFIX} [${getTimestamp()}] ========== Starting SmartMatch Session: ${logger.getSessionId()} ==========`);

  // 1. 检查 HPO 验证器是否已初始化
  if (!isValidatorReady()) {
    throw new Error('HPO 数据尚未加载完成，请稍后重试');
  }

  // 2. 获取用户配置
  const config = loadConfigStatic();
  if (!config?.apiKey) {
    throw new Error('NOT_CONFIGURED');
  }

  // 3. 构建 Prompt
  const userPrompt = `Given a paragraph of patient information from discharge note, please extract the phenotype about this patient only.
  Check the Human Phenotype Ontology (HPO) database to determine the phenotype.
  Only output the extracted phenotypes.
  EXAMPLE JSON OUTPUT:
  [
  {
    "hpoId": "HP:0001259",
    "nameEn": "Fever",
    "nameCn": "发热",
    "matchedText": "发热",
    "startIndex": 5,
    "endIndex": 7,
  }
]
  Patient information: ${text}`;

  // 4. 调用 LLM API
  let llmResponse: string;
  try {
    llmResponse = await callLLM(config, SYSTEM_PROMPT, userPrompt);

    // 日志 1: LLM 原始输出
    logger.logRawOutput({
      model: config.modelName,
      inputText: text,
      userPrompt: userPrompt,
      rawResponse: llmResponse,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} [${getTimestamp()}] LLM API call failed:`, error);
    throw new Error(error instanceof Error ? error.message : 'LLM 调用失败');
  }

  // 5. 解析 JSON
  let rawEntries: LLMOutputEntry[];

  try {
    // 清理可能的 markdown 代码块标记
    const cleanedResponse = llmResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    rawEntries = JSON.parse(cleanedResponse);

    // 日志 2: 解析结果
    logger.logParseResult({
      cleanedResponse: cleanedResponse,
      parsedEntries: rawEntries,
    });
  } catch (e) {
    // 日志 2: 解析失败
    logger.logParseResult({
      cleanedResponse: llmResponse,
      parsedEntries: llmResponse,
      parseError: e instanceof Error ? e.message : 'Unknown error',
    });
    console.error(`${LOG_PREFIX} [${getTimestamp()}] Failed to parse LLM response:`, llmResponse);
    throw new Error('LLM 返回格式错误，无法解析为 JSON');
  }

  // 6. 验证和补全数据（严格校准流程 - 不依赖 LLM 返回的 hpoId）
  const hpoEntries: HPOEntry[] = [];
  const calibrationRecords: Array<{
    originalId: string; // LLM 返回的 hpoId（仅用于日志对比）
    calibratedId: string | null;
    nameCn: string;
    nameEn: string;
    matchType: CalibrationResult['matchType'];
    similarity?: number;
  }> = [];
  const removedEntries: Array<{
    hpoId: string; // LLM 返回的 hpoId
    nameCn: string;
    nameEn: string;
    reason: string;
  }> = [];
  const indexCorrections: Array<{
    hpoId: string;
    field: string;
    before: unknown;
    after: unknown;
  }> = [];

  // 确保 rawEntries 是数组
  if (!Array.isArray(rawEntries)) {
    console.warn(`${LOG_PREFIX} [${getTimestamp()}] LLM response is not an array`);
    rawEntries = [];
  }

  for (const entry of rawEntries) {
    // 验证必需字段：nameCn 和 matchedText
    if (!entry.nameCn?.trim() || !entry.matchedText?.trim()) {
      console.warn(`${LOG_PREFIX} [${getTimestamp()}] Invalid entry, missing required fields:`, entry);
      removedEntries.push({
        hpoId: entry.hpoId || '(none)',
        nameCn: entry.nameCn || '(none)',
        nameEn: entry.nameEn || '(none)',
        reason: 'Missing required fields (nameCn or matchedText)',
      });
      continue;
    }

    // === 严格 HPO ID 校准步骤（完全不使用 LLM 的 hpoId） ===
    const calibrationResult = calibrateHPOStrict(
      entry.nameCn,
      entry.nameEn,
      entry.hpoId // 仅用于日志记录，不参与校准
    );

    if (!calibrationResult.success || !calibrationResult.hpoData) {
      console.warn(`${LOG_PREFIX} [${getTimestamp()}] Calibration failed for "${entry.nameCn}"`);
      removedEntries.push({
        hpoId: entry.hpoId || '(none)',
        nameCn: entry.nameCn,
        nameEn: entry.nameEn || '(none)',
        reason: calibrationResult.reason || 'Calibration failed',
      });
      calibrationRecords.push({
        originalId: entry.hpoId || '(none)',
        calibratedId: null,
        nameCn: entry.nameCn,
        nameEn: entry.nameEn || '(none)',
        matchType: calibrationResult.matchType,
        similarity: calibrationResult.similarity,
      });
      continue;
    }

    const calibratedData = calibrationResult.hpoData;

    // 记录校准结果
    calibrationRecords.push({
      originalId: entry.hpoId || '(none)',
      calibratedId: calibratedData.hpoId,
      nameCn: entry.nameCn,
      nameEn: entry.nameEn || '(none)',
      matchType: calibrationResult.matchType,
      similarity: calibrationResult.similarity,
    });

    // Fallback: 如果索引无效，使用文本搜索
    let startIndex: number | undefined = entry.startIndex;
    let endIndex: number | undefined = entry.endIndex;

    if (startIndex === undefined || endIndex === undefined ||
        text.substring(startIndex, endIndex) !== entry.matchedText) {
      const foundIndex = text.indexOf(entry.matchedText);
      if (foundIndex !== -1) {
        const before = { startIndex, endIndex };
        startIndex = foundIndex;
        endIndex = foundIndex + entry.matchedText.length;
        const after = { startIndex, endIndex };

        // 记录索引修正
        logger.logIndexCorrection({
          originalEntry: entry,
          correctedEntry: after,
          reason: 'Original index did not match text, using text search',
        });

        indexCorrections.push({
          hpoId: calibratedData.hpoId,
          field: 'startIndex/endIndex',
          before,
          after,
        });
      } else {
        // 完全找不到，设置为 undefined
        const before = { startIndex, endIndex };
        startIndex = undefined;
        endIndex = undefined;

        indexCorrections.push({
          hpoId: calibratedData.hpoId,
          field: 'startIndex/endIndex',
          before,
          after: { startIndex: undefined, endIndex: undefined },
        });
      }
    }

    hpoEntries.push({
      hpoId: calibratedData.hpoId, // 使用校准后的 hpoId，绝不使用 LLM 的原始值
      nameEn: calibratedData.nameEn,
      nameCn: calibratedData.nameCn,
      confidence: Math.round((entry.confidence ?? 0.8) * 100),
      matchedText: entry.matchedText,
      startIndex,
      endIndex,
    });
  }

  // === 步骤 4: 去重处理（基于 hpoId） ===
  // 使用 Map 按 hpoId 分组，保留置信度最高的记录
  const hpoEntriesMap = new Map<string, HPOEntry>();
  const duplicates: Array<{
    hpoId: string;
    removed: HPOEntry[];
    kept: HPOEntry;
  }> = [];

  for (const entry of hpoEntries) {
    const existing = hpoEntriesMap.get(entry.hpoId);
    if (!existing) {
      // 第一次出现该 hpoId，直接保留
      hpoEntriesMap.set(entry.hpoId, entry);
    } else {
      // 已存在相同 hpoId，比较置信度
      if (entry.confidence > existing.confidence) {
        // 新记录置信度更高，替换旧记录
        duplicates.push({
          hpoId: entry.hpoId,
          removed: [existing],
          kept: entry,
        });
        hpoEntriesMap.set(entry.hpoId, entry);
      } else {
        // 旧记录置信度更高或相等，跳过新记录
        duplicates.push({
          hpoId: entry.hpoId,
          removed: [entry],
          kept: existing,
        });
      }
    }
  }

  // 将 Map 转换为数组
  const deduplicatedEntries = Array.from(hpoEntriesMap.values());

  // 日志：去重结果
  if (duplicates.length > 0) {
    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== DEDUPLICATION RESULTS ====================`
    );
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Entries Before Deduplication: ${hpoEntries.length}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Entries After Deduplication: ${deduplicatedEntries.length}`);
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Duplicates Removed: ${duplicates.length}`);

    duplicates.forEach(d => {
      const removedInfo = d.removed
        .map(e => `"${e.matchedText}" (confidence: ${e.confidence}%)`)
        .join(', ');
      console.log(
        `${LOG_PREFIX} [${getTimestamp()}]   ${d.hpoId}: Kept "${d.kept.matchedText}" (confidence: ${d.kept.confidence}%), Removed [${removedInfo}]`
      );
    });

    console.log(
      `${LOG_PREFIX} [${getTimestamp()}] ==================== END DEDUPLICATION ====================\n`
    );
  }

  // 使用去重后的结果
  const finalHpoEntries = deduplicatedEntries;

  // 日志 3: 验证结果
  logger.logValidationResult({
    totalRaw: rawEntries.length,
    validHPOIds: finalHpoEntries.length,
    invalidHPOIds: removedEntries.map(e => e.hpoId),
    missingFields: removedEntries.filter(e => e.reason.includes('Missing required fields')).length,
  });

  // 日志 3.5: 校准结果（详细）
  console.log(
    `${LOG_PREFIX} [${getTimestamp()}] ==================== CALIBRATION RESULTS ====================`
  );
  console.log(`${LOG_PREFIX} [${getTimestamp()}] Total Entries from LLM: ${rawEntries.length}`);
  console.log(`${LOG_PREFIX} [${getTimestamp()}] Calibrated Successfully: ${finalHpoEntries.length}`);
  console.log(`${LOG_PREFIX} [${getTimestamp()}] Removed (No Match): ${removedEntries.length}`);

  // 按匹配类型分组统计
  const matchTypeStats: Record<string, number> = {};
  calibrationRecords.forEach(r => {
    if (r.calibratedId) {
      matchTypeStats[r.matchType] = (matchTypeStats[r.matchType] || 0) + 1;
    }
  });
  console.log(`${LOG_PREFIX} [${getTimestamp()}] Match Types:`, matchTypeStats);

  // 详细展示每个校准结果
  if (calibrationRecords.length > 0) {
    console.log(`${LOG_PREFIX} [${getTimestamp()}] Detailed Calibration Log:`);
    calibrationRecords.forEach(r => {
      if (r.calibratedId) {
        const similarityStr = r.similarity !== undefined ? ` (similarity: ${r.similarity.toFixed(3)})` : '';
        console.log(
          `${LOG_PREFIX} [${getTimestamp()}]   ✓ "${r.nameCn}" [${r.matchType}]${similarityStr}`
        );
        if (r.originalId !== '(none)' && r.originalId !== r.calibratedId) {
          console.warn(
            `${LOG_PREFIX} [${getTimestamp()}]     LLM HPO "${r.originalId}" was INCORRECT → Corrected to ${r.calibratedId}`
          );
        }
      } else {
        console.warn(
          `${LOG_PREFIX} [${getTimestamp()}]   ✗ "${r.nameCn}" → Skipped (${r.matchType})`
        );
      }
    });
  }

  if (removedEntries.length > 0) {
    console.warn(`${LOG_PREFIX} [${getTimestamp()}] Removed Entries (Reasons):`);
    removedEntries.forEach(e => {
      console.warn(`${LOG_PREFIX} [${getTimestamp()}]   "${e.nameCn}": ${e.reason}`);
    });
  }

  console.log(
    `${LOG_PREFIX} [${getTimestamp()}] ==================== END CALIBRATION ====================\n`
  );

  const result: SmartMatchResult = {
    originalText: text,
    hpoEntries: finalHpoEntries,
    processTime: Date.now() - startTime,
  };

  // 日志 4: 最终展示内容
  logger.logFinalResult(result);

  // 日志 5: 差异对比
  const removedIds = removedEntries.map(e => e.hpoId);
  const calibrations = calibrationRecords
    .filter(r => r.calibratedId !== null && r.calibratedId !== r.originalId)
    .map(r => ({
      hpoId: r.nameCn,
      field: 'hpoId',
      before: r.originalId,
      after: r.calibratedId,
    }));

  logger.logDifferences({
    rawEntries,
    finalEntries: finalHpoEntries,
    removed: removedIds,
    modified: [...calibrations, ...indexCorrections],
  });

  console.log(`${LOG_PREFIX} [${getTimestamp()}] ========== SmartMatch Session Complete: ${logger.getSessionId()} ==========\n`);

  return result;
}

/**
 * 搜索API（mode可选，默认智能匹配）
 * 仍使用 mock 实现，因为精确匹配功能已经使用真实 hpo_data.json
 */
export async function searchHPO(query: string, mode?: SearchMode): Promise<SearchResponse> {
  return mockSearch(query, mode || 'fuzzy');
}

/**
 * 获取HPO详情API
 */
export async function getHPODetail(hpoId: string) {
  return mockGetHPODetail(hpoId);
}

/**
 * 自动补全API
 */
export async function autocomplete(query: string, limit = 5) {
  return mockAutocomplete(query, limit);
}

// 导出类型供外部使用
export type { SmartMatchResult, SearchResponse, SearchMode };
