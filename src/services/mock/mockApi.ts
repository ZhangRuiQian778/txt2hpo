import type { SmartMatchResult, SearchResponse, SearchMode } from '@/types';
import { hpoDatabase, findHPOByKeyword, fuzzySearchHPO } from './hpoData';

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 生成随机延迟（300-800ms）
const randomDelay = () => delay(300 + Math.random() * 500);

// 关键词映射（用于智能识别）
const keywordPatterns: Array<{
  keywords: string[];
  hpoId: string;
  nameEn: string;
  nameCn: string;
  baseConfidence: number;
}> = [
  { keywords: ['发热', '发烧', '体温高', '高热'], hpoId: 'HP:0001945', nameEn: 'Fever', nameCn: '发热', baseConfidence: 95 },
  { keywords: ['咳嗽', '干咳'], hpoId: 'HP:0012735', nameEn: 'Cough', nameCn: '咳嗽', baseConfidence: 92 },
  { keywords: ['胸痛', '胸口痛', '胸部不适'], hpoId: 'HP:0001947', nameEn: 'Chest pain', nameCn: '胸痛', baseConfidence: 90 },
  { keywords: ['呼吸困难', '气促', '气短', '喘', '呼吸费力'], hpoId: 'HP:0002094', nameEn: 'Dyspnea', nameCn: '呼吸困难', baseConfidence: 88 },
  { keywords: ['头痛', '头疼', '头部疼痛'], hpoId: 'HP:0002315', nameEn: 'Headache', nameCn: '头痛', baseConfidence: 93 },
  { keywords: ['头晕', '眩晕', '头昏'], hpoId: 'HP:0002386', nameEn: 'Dizziness', nameCn: '头晕', baseConfidence: 85 },
  { keywords: ['腹痛', '肚子痛', '腹部疼痛', '胃痛'], hpoId: 'HP:0002027', nameEn: 'Abdominal pain', nameCn: '腹痛', baseConfidence: 91 },
  { keywords: ['恶心', '反胃', '想吐'], hpoId: 'HP:0002014', nameEn: 'Nausea', nameCn: '恶心', baseConfidence: 87 },
  { keywords: ['呕吐', '吐'], hpoId: 'HP:0002013', nameEn: 'Vomiting', nameCn: '呕吐', baseConfidence: 90 },
  { keywords: ['腹泻', '拉肚子', '稀便'], hpoId: 'HP:0000952', nameEn: 'Diarrhea', nameCn: '腹泻', baseConfidence: 94 },
  { keywords: ['便秘', '排便困难', '大便干结'], hpoId: 'HP:0000950', nameEn: 'Constipation', nameCn: '便秘', baseConfidence: 89 },
  { keywords: ['高血压', '血压高'], hpoId: 'HP:0001680', nameEn: 'Hypertension', nameCn: '高血压', baseConfidence: 96 },
  { keywords: ['低血压', '血压低'], hpoId: 'HP:0004322', nameEn: 'Hypotension', nameCn: '低血压', baseConfidence: 93 },
  { keywords: ['心悸', '心慌', '心跳快'], hpoId: 'HP:0001951', nameEn: 'Palpitations', nameCn: '心悸', baseConfidence: 86 },
  { keywords: ['水肿', '浮肿', '肿胀'], hpoId: 'HP:0001682', nameEn: 'Edema', nameCn: '水肿', baseConfidence: 88 },
  { keywords: ['皮疹', '疹子'], hpoId: 'HP:0000953', nameEn: 'Rash', nameCn: '皮疹', baseConfidence: 84 },
  { keywords: ['瘙痒', '痒'], hpoId: 'HP:0000989', nameEn: 'Pruritus', nameCn: '瘙痒', baseConfidence: 82 },
  { keywords: ['黄疸', '皮肤黄', '巩膜黄染'], hpoId: 'HP:0001409', nameEn: 'Jaundice', nameCn: '黄疸', baseConfidence: 91 },
  { keywords: ['关节痛', '关节炎', '关节肿'], hpoId: 'HP:0001369', nameEn: 'Arthritis', nameCn: '关节炎', baseConfidence: 85 },
  { keywords: ['肌肉痛', '肌痛', '肌肉酸痛'], hpoId: 'HP:0003326', nameEn: 'Myalgia', nameCn: '肌痛', baseConfidence: 83 },
  { keywords: ['疲劳', '乏力', '疲倦', '累'], hpoId: 'HP:0004317', nameEn: 'Fatigue', nameCn: '疲劳', baseConfidence: 80 },
  { keywords: ['失眠', '睡不着', '睡眠障碍'], hpoId: 'HP:0003325', nameEn: 'Insomnia', nameCn: '失眠', baseConfidence: 81 },
  { keywords: ['贫血', '血红蛋白低'], hpoId: 'HP:0001893', nameEn: 'Anemia', nameCn: '贫血', baseConfidence: 92 },
  { keywords: ['消瘦', '体重下降', '体重减轻'], hpoId: 'HP:0001518', nameEn: 'Weight loss', nameCn: '体重减轻', baseConfidence: 86 },
];

/**
 * 智能转换API - 将医嘱文本转换为HPO ID列表
 */
export async function mockSmartMatch(text: string): Promise<SmartMatchResult> {
  await randomDelay();

  const startTime = Date.now();
  const hpoEntries: SmartMatchResult['hpoEntries'] = [];
  const processedIds = new Set<string>();

  // 遍历所有关键词模式进行匹配
  for (const pattern of keywordPatterns) {
    for (const keyword of pattern.keywords) {
      const index = text.indexOf(keyword);
      if (index !== -1 && !processedIds.has(pattern.hpoId)) {
        // 计算置信度（基础置信度 + 随机波动）
        const confidence = Math.min(98, Math.max(60, pattern.baseConfidence + (Math.random() * 10 - 5)));

        hpoEntries.push({
          hpoId: pattern.hpoId,
          nameEn: pattern.nameEn,
          nameCn: pattern.nameCn,
          confidence: Math.round(confidence),
          matchedText: keyword,
          startIndex: index,
          endIndex: index + keyword.length,
        });
        processedIds.add(pattern.hpoId);
        break;
      }
    }
  }

  // 如果没有找到任何匹配，返回空结果
  return {
    originalText: text,
    hpoEntries: hpoEntries.sort((a, b) => b.confidence - a.confidence),
    processTime: Date.now() - startTime,
  };
}

/**
 * 搜索API - 精确匹配或模糊搜索HPO
 */
export async function mockSearch(query: string, mode: SearchMode): Promise<SearchResponse> {
  await randomDelay();

  if (!query.trim()) {
    return { results: [], total: 0, query };
  }

  let results: typeof hpoDatabase;

  if (mode === 'exact') {
    // 精确匹配：优先匹配ID，然后是英文名，最后是中文名
    const exactMatch = findHPOByKeyword(query);
    results = exactMatch ? [exactMatch] : [];
  } else {
    // 模糊搜索
    results = fuzzySearchHPO(query);

    // 计算匹配分数
    results = results.map(item => {
      let score = 0;

      if (item.hpoId.toLowerCase().includes(query.toLowerCase())) {
        score = Math.max(score, 0.9);
      }
      if (item.nameEn.toLowerCase().includes(query.toLowerCase())) {
        score = Math.max(score, 0.85);
      }
      if (item.nameCn.includes(query)) {
        score = Math.max(score, 0.95);
      }

      // 计算编辑距离相似度
      const enSimilarity = calculateSimilarity(query.toLowerCase(), item.nameEn.toLowerCase());
      const cnSimilarity = calculateSimilarity(query, item.nameCn);
      score = Math.max(score, enSimilarity * 0.7, cnSimilarity * 0.8);

      return { ...item, matchScore: Math.round(score * 100) / 100 };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  return {
    results,
    total: results.length,
    query,
  };
}

/**
 * 获取HPO详情
 */
export async function mockGetHPODetail(hpoId: string) {
  await delay(200);

  const hpo = hpoDatabase.find(item => item.hpoId === hpoId);
  if (!hpo) {
    throw new Error(`HPO ${hpoId} not found`);
  }

  return {
    ...hpo,
    parents: generateParentHPOs(hpoId),
    children: generateChildHPOs(hpoId),
  };
}

// 计算字符串相似度（Levenshtein距离的简化版）
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLen = Math.max(str1.length, str2.length);
  return 1 - matrix[str2.length][str1.length] / maxLen;
}

// 生成父HPO（模拟数据）
function generateParentHPOs(hpoId: string): string[] {
  const parentMap: Record<string, string[]> = {
    'HP:0001945': ['HP:0012387', 'HP:0001947'],
    'HP:0012735': ['HP:0012734', 'HP:0002100'],
    'HP:0001947': ['HP:0012387', 'HP:0002027'],
    'HP:0002094': ['HP:0002795', 'HP:0002091'],
  };
  return parentMap[hpoId] || [];
}

// 生成子HPO（模拟数据）
function generateChildHPOs(hpoId: string): string[] {
  const childMap: Record<string, string[]> = {
    'HP:0001945': ['HP:0001946', 'HP:0001958'],
    'HP:0012735': ['HP:0012736'],
    'HP:0001947': ['HP:0001948', 'HP:0001949'],
  };
  return childMap[hpoId] || [];
}

/**
 * 获取自动补全建议
 */
export async function mockAutocomplete(query: string, limit = 5) {
  await delay(100);

  if (!query.trim()) return [];

  return fuzzySearchHPO(query)
    .slice(0, limit)
    .map(item => ({
      value: item.hpoId,
      label: `${item.hpoId} - ${item.nameCn} / ${item.nameEn}`,
      hpo: item,
    }));
}
