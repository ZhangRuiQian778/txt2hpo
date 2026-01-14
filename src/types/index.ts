// HPO条目类型
export interface HPOEntry {
  hpoId: string;           // HP:0001259
  nameEn: string;          // Fever
  nameCn: string;          // 发热
  confidence: number;      // 0-100 置信度
  matchedText: string;     // 对应的原文片段
  startIndex?: number;     // 在原文中的起始位置
  endIndex?: number;       // 在原文中的结束位置
  description?: string;    // 详细描述
  parents?: string[];      // 父HPO
  children?: string[];     // 子HPO
}

// 智能转换结果类型
export interface SmartMatchResult {
  originalText: string;
  hpoEntries: HPOEntry[];
  processTime: number;     // 处理时间(ms)
}

// 搜索模式类型
export type SearchMode = 'exact' | 'fuzzy';

// 精确匹配结果类型
export interface ExactMatchResult {
  hpoId: string;
  nameEn: string;
  nameCn: string;
  matchScore?: number;     // 匹配分数 0-1（可选）
  description?: string;     // 中文描述
  definition?: string;      // 英文描述
  parents?: string[];
  children?: string[];
}

// 搜索响应类型
export interface SearchResponse {
  results: ExactMatchResult[];
  total: number;
  query: string;
}

// 文本高亮匹配项
export interface TextMatch {
  text: string;
  color: string;
  startIndex: number;
  endIndex: number;
}

// HPO 数据条目类型（来自 hpo_data.json）
export interface HPODataItem {
  hpoId: string;
  nameEn: string;
  nameCn: string;
  definition: string;
  definitionZh: string;
}

// 搜索结果项类型（用于 AutoComplete 下拉选项）
export interface HPOSearchOption {
  value: string;          // 使用 hpoId 作为 value
  label: string;          // 显示文本：hpoId - nameCn (nameEn)
  hpoId: string;
  nameEn: string;
  nameCn: string;
  definition: string;
  definitionZh: string;
}

// 搜索参数类型
export interface HPOSearchParams {
  query: string;
  limit?: number;
  threshold?: number;     // 模糊匹配阈值 0-1，越小越精确
}

// HPO 搜索组件 Ref 类型
export interface HPOSearchRef {
  /** 设置值并触发搜索 */
  setValueAndSearch: (value: string) => void;
  /** 清空输入 */
  clear: () => void;
}

// ========== 大模型配置类型 ==========

/** 大模型服务配置 */
export interface LLMConfig {
  apiKey: string;
  apiUrl: string;
  modelName: string;
}

/** 配置历史记录 */
export interface ConfigHistory {
  id: string;
  config: LLMConfig;
  timestamp: number;
  isConnected: boolean; // 是否曾经连接成功过
}

/** 服务检测状态 */
export type ServiceCheckStatus = 'idle' | 'checking' | 'success' | 'error';

/** 服务检测错误类型 */
export interface ServiceCheckError {
  type: 'network' | 'timeout' | 'auth' | 'invalid_url' | 'unknown';
  message: string;
}

/** LLM 输出的 HPO 条目格式 */
export interface LLMOutputEntry {
  hpoId: string;
  nameEn: string;
  nameCn: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  confidence: number; // 0-1
}
