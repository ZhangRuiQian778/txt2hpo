# LLM 服务集成实现计划

## 目标
将 `医嘱智能转换` 功能从 mock 数据替换为真实的 LLM API 调用。

## 设计决策

| 项目 | 选择 |
|------|------|
| LLM 输出格式 | JSON 数组 |
| 位置定位 | LLM 返回字符索引 + fallback 机制 |
| 验证策略 | HPO ID 存在性检查 |

---

## 一、LLM Prompt 设计

### 1.1 输出 JSON 格式
```json
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
```

### 1.2 System Prompt 模板
```
你是一个医学术语标准化助手。你的任务是从医学文本中识别症状和体征，并将其映射到HPO（Human Phenotype Ontology）术语。

要求：
1. 只提取明确的症状或体征描述
2. 忽略否定表述（如"无发热"、"不咳嗽"）
3. 返回标准JSON数组格式
4. HPO ID必须符合格式 HP:XXXXXXX
5. startIndex和endIndex是matchedText在原文中的字符位置（从0开始）

输出格式（仅返回JSON，不要其他文字）：
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
```

---

## 二、实现步骤

### 2.1 创建 HPO 数据验证模块
**文件**: `src/services/hpoValidator.ts`

```typescript
import type { HPODataItem } from '@/types';

// 加载 HPO 数据并创建索引
let hpoDataSet: Set<string> | null = null;
let hpoDataMap: Map<string, HPODataItem> | null = null;

export async function initHPOValidator() {
  const response = await fetch('/hpo_data.json');
  const data: HPODataItem[] = await response.json();
  hpoDataSet = new Set(data.map(item => item.hpoId));
  hpoDataMap = new Map(data.map(item => [item.hpoId, item]));
}

export function isValidHPOId(hpoId: string): boolean {
  return hpoDataSet?.has(hpoId) ?? false;
}

export function getHPOById(hpoId: string): HPODataItem | undefined {
  return hpoDataMap?.get(hpoId);
}

export function isValidatorReady(): boolean {
  return hpoDataSet !== null && hpoDataMap !== null;
}
```

### 2.2 创建 LLM API 调用客户端
**文件**: `src/services/llmClient.ts`

```typescript
import type { LLMConfig } from '@/types';

export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const isAnthropic = config.apiUrl.includes('anthropic.com');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isAnthropic) {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const endpoint = isAnthropic
    ? `${config.apiUrl.replace(/\/$/, '')}/v1/messages`
    : `${config.apiUrl.replace(/\/$/, '')}/chat/completions`;

  const body = isAnthropic
    ? {
        model: config.modelName,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }
    : {
        model: config.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `LLM API error: ${response.status}`);
  }

  const data = await response.json();

  // 提取内容
  return isAnthropic
    ? data.content[0].text
    : data.choices[0].message.content;
}
```

### 2.3 添加类型定义
**文件**: `src/types/index.ts`

```typescript
/** LLM 输出的 HPO 条目格式 */
export interface LLMOutputEntry {
  hpoId: string;
  nameEn: string;
  nameCn: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}
```

### 2.4 修改 API 服务
**文件**: `src/services/api.ts`

```typescript
import type { SmartMatchResult, SearchResponse, SearchMode, LLMOutputEntry } from '@/types';
import { loadConfig } from '@/hooks/useConfig';
import { callLLM } from './llmClient';
import { isValidHPOId, getHPOById, isValidatorReady } from './hpoValidator';
import {
  mockSearch,
  mockGetHPODetail,
  mockAutocomplete,
} from './mock/mockApi';

// System prompt
const SYSTEM_PROMPT = `你是一个医学术语标准化助手。你的任务是从医学文本中识别症状和体征，并将其映射到HPO（Human Phenotype Ontology）术语。

要求：
1. 只提取明确的症状或体征描述
2. 忽略否定表述（如"无发热"、"不咳嗽"）
3. 返回标准JSON数组格式
4. HPO ID必须符合格式 HP:XXXXXXX
5. startIndex和endIndex是matchedText在原文中的字符位置（从0开始）

输出格式（仅返回JSON，不要其他文字）：
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

// 智能转换API
export async function smartMatch(text: string): Promise<SmartMatchResult> {
  const startTime = Date.now();

  // 1. 检查 HPO 验证器是否已初始化
  if (!isValidatorReady()) {
    throw new Error('HPO 数据尚未加载完成，请稍后重试');
  }

  // 2. 获取用户配置
  const config = loadConfig();
  if (!config?.apiKey) {
    throw new Error('NOT_CONFIGURED');
  }

  // 3. 构建 Prompt
  const userPrompt = `请分析以下医学文本：\n\n${text}`;

  // 4. 调用 LLM API
  let llmResponse: string;
  try {
    llmResponse = await callLLM(config, SYSTEM_PROMPT, userPrompt);
  } catch (error) {
    console.error('LLM API call failed:', error);
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
  } catch (e) {
    console.error('Failed to parse LLM response:', llmResponse);
    throw new Error('LLM 返回格式错误，无法解析为 JSON');
  }

  // 6. 验证和补全数据
  const hpoEntries: HPOEntry[] = [];
  for (const entry of rawEntries) {
    // 验证 HPO ID 是否存在
    if (!isValidHPOId(entry.hpoId)) {
      console.warn(`Invalid HPO ID: ${entry.hpoId}, skipping`);
      continue;
    }

    // 获取完整 HPO 信息
    const hpoData = getHPOById(entry.hpoId);
    if (!hpoData) continue;

    // Fallback: 如果索引无效，使用文本搜索
    let { startIndex, endIndex } = entry;
    if (startIndex === undefined || endIndex === undefined ||
        text.substring(startIndex, endIndex) !== entry.matchedText) {
      const foundIndex = text.indexOf(entry.matchedText);
      if (foundIndex !== -1) {
        startIndex = foundIndex;
        endIndex = foundIndex + entry.matchedText.length;
      } else {
        // 完全找不到，设置为 undefined
        startIndex = undefined;
        endIndex = undefined;
      }
    }

    hpoEntries.push({
      hpoId: entry.hpoId,
      nameEn: hpoData.nameEn,
      nameCn: hpoData.nameCn,
      matchedText: entry.matchedText,
      startIndex,
      endIndex,
    });
  }

  return {
    originalText: text,
    hpoEntries,
    processTime: Date.now() - startTime,
  };
}

// 其他 API 保持不变...
```

### 2.5 更新 SmartMatchPage 错误处理
**文件**: `src/pages/SmartMatchPage.tsx`

```typescript
const handleConvert = async () => {
  if (!inputText.trim()) {
    message.warning('请输入医嘱内容');
    return;
  }

  setLoading(true);
  try {
    const response = await smartMatch(inputText);
    setResult(response);

    if (response.hpoEntries.length === 0) {
      message.warning('未识别到相关症状，请尝试使用更规范的医学术语');
    } else {
      message.success(`成功识别 ${response.hpoEntries.length} 个HPO术语`);
    }
  } catch (error) {
    // 检查是否是配置错误
    if (error instanceof Error && error.message === 'NOT_CONFIGURED') {
      Modal.confirm({
        title: '请先配置 LLM 服务',
        content: '使用智能转换功能需要配置 API 密钥和服务地址',
        okText: '去配置',
        onOk: () => setConfigModalOpen(true),
      });
      return;
    }

    message.error(error instanceof Error ? error.message : '转换失败，请稍后重试');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### 2.6 在 App.tsx 中初始化验证器
**文件**: `src/App.tsx`

```typescript
import { useEffect } from 'react';
import { ConfigProvider, Layout, message } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import { initHPOValidator } from '@/services/hpoValidator';
// ... 其他 imports

function App() {
  useEffect(() => {
    // 启动时初始化 HPO 验证器
    initHPOValidator().catch(() => {
      message.error('HPO 数据加载失败，部分功能可能不可用');
    });
  }, []);

  return (
    // ... 原有代码
  );
}
```

---

## 三、需要修改的文件

| 文件 | 操作 |
|------|------|
| `src/types/index.ts` | 修改 - 添加 LLMOutputEntry 类型 |
| `src/services/hpoValidator.ts` | 新建 - HPO 数据验证 |
| `src/services/llmClient.ts` | 新建 - LLM API 调用 |
| `src/services/api.ts` | 修改 - 替换 smartMatch 实现 |
| `src/pages/SmartMatchPage.tsx` | 修改 - 添加配置检查 Modal |
| `src/App.tsx` | 修改 - 初始化 HPO 验证器 |

---

## 四、测试计划

### 4.1 手动测试用例

| 输入 | 预期输出 |
|------|----------|
| "患者出现发热、咳嗽" | 识别出发热、咳嗽的 HPO |
| "无发热，不咳嗽" | 识别为空（否定词） |
| "胸骨后疼痛" | 识别出胸痛相关 HPO |
| 长文本（>1000字） | 正常处理，无超时 |

### 4.2 错误处理测试

| 场景 | 预期行为 |
|------|----------|
| 未配置 API | 显示配置提示弹窗 |
| API 密钥错误 | 显示认证失败错误 |
| LLM 返回非 JSON | 显示格式错误 |
| HPO ID 不存在 | 跳过该条目，记录警告 |

---

## 五、依赖关系

```
App 启动
    ↓
initHPOValidator() → 加载 hpo_data.json
    ↓
用户点击"识别转换"
    ↓
检查配置 → 调用 LLM API
    ↓
解析 JSON → 验证 HPO ID
    ↓
Fallback 修正索引 → 返回结果
```

---

## 六、注意事项

1. **HPO 数据文件**: `public/hpo_data.json` 约 136,000 条数据，加载可能需要 1-2 秒
2. **API 超时**: 建议设置 60 秒超时
3. **错误处理**: 需要优雅处理各种错误场景
4. **Fallback 机制**: LLM 返回的索引可能不准确，需要用文本搜索修正
