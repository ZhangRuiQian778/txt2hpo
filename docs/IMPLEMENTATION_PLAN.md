# 医嘱信息到HPO ID智能转换工具 - 实施计划

## 项目概述

**技术栈确认：**
- 前端框架：React 18 + TypeScript
- UI组件库：Ant Design 5.x
- 构建工具：Vite 5.x
- 路由：React Router 6.x
- 状态管理：React Hooks + Context API
- 数据请求：Axios
- 后端：Mock数据（后续对接真实API）

**暂不实现：**
- 用户认证系统
- 后端API服务

---

## 项目目录结构

```
txt2hpo/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/              # 静态资源
│   ├── components/          # 组件
│   │   ├── common/          # 通用组件
│   │   │   ├── Header.tsx       # 顶部导航
│   │   │   ├── Footer.tsx       # 底部信息
│   │   │   └── ExportButton.tsx # 导出功能
│   │   ├── SmartMatch/      # 医嘱智能转换模块
│   │   │   ├── TextInputArea.tsx    # 文本输入区
│   │   │   ├── HighlightText.tsx    # 原文高亮显示
│   │   │   ├── HPOResultList.tsx    # HPO结果列表
│   │   │   └── ResultCard.tsx       # 单个结果卡片
│   │   └── ExactMatch/      # 精确匹配模块
│   │       ├── SearchBar.tsx        # 搜索栏
│   │       ├── ModeSelector.tsx     # 模式选择
│   │       └── ResultTable.tsx      # 结果表格
│   ├── hooks/               # 自定义Hooks
│   │   ├── useExport.ts           # 导出功能
│   │   └── useLocalStorage.ts     # 本地存储
│   ├── pages/               # 页面
│   │   ├── SmartMatchPage.tsx  # 智能转换页面
│   │   ├── ExactMatchPage.tsx  # 精确匹配页面
│   │   └── HomePage.tsx        # 首页
│   ├── services/            # API服务层
│   │   ├── mock/
│   │   │   ├── hpoData.ts        # Mock HPO数据
│   │   │   └── mockApi.ts        # Mock API响应
│   │   └── api.ts                # API接口定义
│   ├── styles/              # 样式
│   │   ├── global.css
│   │   └── variables.css
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── export.ts             # CSV/JSON导出
│   │   └── highlight.ts          # 文本高亮
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口文件
│   └── vite-env.d.ts        # Vite类型声明
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 核心文件设计

### 1. 类型定义 (src/types/index.ts)

```typescript
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
  matchScore: number;      // 匹配分数 0-1
  description?: string;
  parents?: string[];
  children?: string[];
}

// 搜索响应类型
export interface SearchResponse {
  results: ExactMatchResult[];
  total: number;
  query: string;
}
```

### 2. Mock数据服务 (src/services/mock/hpoData.ts)

包含常用HPO术语的模拟数据，涵盖常见症状描述：
- 发热 (HP:0001945)
- 咳嗽 (HP:0012735)
- 胸痛 (HP:0001947)
- 呼吸困难 (HP:0002094)
- 头痛 (HP:0002315)
等约50+常见临床表型

### 3. Mock API (src/services/mock/mockApi.ts)

```typescript
// 智能转换API模拟（带延迟）
export const mockSmartMatch = (text: string): Promise<SmartMatchResult>

// 精确/模糊搜索API模拟
export const mockSearch = (
  query: string,
  mode: SearchMode
): Promise<SearchResponse>

// 获取HPO详情
export const mockGetHPODetail = (hpoId: string): Promise<HPOEntry>
```

---

## 实施步骤

### 第一步：项目初始化

**文件操作：**
1. 创建 `package.json` - 定义项目依赖
2. 创建 `vite.config.ts` - Vite配置
3. 创建 `tsconfig.json` - TypeScript配置
4. 创建 `index.html` - HTML入口
5. 创建 `src/main.tsx` - React入口

**安装依赖：**
```bash
npm install react react-dom
npm install react-router-dom antd
npm install @ant-design/icons
npm install axios
```

---

### 第二步：基础框架搭建

**创建文件：**
1. `src/App.tsx` - 路由配置和布局
2. `src/styles/global.css` - 全局样式
3. `src/components/common/Header.tsx` - 顶部导航（Tab切换）

**Header组件设计：**
- 左侧：Logo + 项目名称 "HPO智能转换工具"
- 右侧：两个Tab切换按钮
  - "医嘱智能转换"
  - "精确匹配"

---

### 第三步：类型定义和Mock服务

**创建文件：**
1. `src/types/index.ts` - TypeScript类型定义
2. `src/services/mock/hpoData.ts` - 50+条HPO模拟数据
3. `src/services/mock/mockApi.ts` - 模拟API函数（带300-800ms延迟）

---

### 第四步：医嘱智能转换模块

**创建文件：**
1. `src/pages/SmartMatchPage.tsx` - 主页面组件
2. `src/components/SmartMatch/TextInputArea.tsx` - 文本输入区
3. `src/components/SmartMatch/HighlightText.tsx` - 原文高亮显示
4. `src/components/SmartMatch/HPOResultList.tsx` - 结果列表容器
5. `src/components/SmartMatch/ResultCard.tsx` - 单个HPO卡片

**页面布局：**
```
┌─────────────────────────────────────────────────────────┐
│  输入区域                                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 多行文本输入框 (placeholder: "请输入医嘱...")     │  │
│  └──────────────────────────────────────────────────┘  │
│  [识别转换] [清空] [批量上传]                           │
├─────────────────────────────────────────────────────────┤
│  结果区域 (转换后显示)                                   │
│  ┌──────────────┬────────────────────────────────────┐ │
│  │  原文 (40%)   │  HPO结果列表 (60%)                 │ │
│  │  ┌────────┐  │  ┌──────────────────────────────┐ │ │
│  │  │带高亮的 │  │  │ HP:0001945  发热/Fever       │ │ │
│  │  │原文显示 │  │  │ 置信度: 95%                 │ │ │
│  │  │        │  │  │ 匹配文本: "发热"            │ │ │
│  │  └────────┘  │  └──────────────────────────────┘ │ │
│  │              │  ...                               │ │
│  └──────────────┴────────────────────────────────────┘ │
│  [导出CSV] [导出JSON]                                   │
└─────────────────────────────────────────────────────────┘
```

**交互逻辑：**
1. 用户输入 → 点击"识别转换" → 显示loading → 800ms后显示结果
2. 点击结果卡片中的"匹配文本" → 左侧原文滚动到对应高亮位置
3. 支持删除单个HPO项
4. 支持清空重新输入

---

### 第五步：精确匹配模块

**创建文件：**
1. `src/pages/ExactMatchPage.tsx` - 主页面组件
2. `src/components/ExactMatch/SearchBar.tsx` - 搜索栏（含模式选择）
3. `src/components/ExactMatch/ResultTable.tsx` - 结果表格（含分页）

**页面布局：**
```
┌─────────────────────────────────────────────────────────┐
│  搜索栏                                                  │
│  ┌──────────────────────┐ ┌─────────┐ ┌────────────┐  │
│  │ 搜索框 (支持HPO ID或 │ │精确匹配▼│ │  [搜索]   │  │
│  │  症状关键词)          │ │模糊匹配 │ │            │  │
│  └──────────────────────┘ └─────────┘ └────────────┘  │
├─────────────────────────────────────────────────────────┤
│  结果表格                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ HPO ID    │ 名称(EN/CN) │ 匹配分数 │ 操作        │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ HP:0001945│ Fever/发热 │ 100%     │ [详情][添加]│ │
│  │ HP:0012735│ Cough/咳嗽 │ 98%      │ [详情][添加]│ │
│  │ ...       │ ...        │ ...      │ ...         │ │
│  └───────────────────────────────────────────────────┘ │
│  共 X 条结果  [<] 1/5 [>]                               │
└─────────────────────────────────────────────────────────┘
```

**交互逻辑：**
1. 输入时实时显示autocomplete建议（最多5条）
2. 点击搜索或回车 → 显示loading → 300ms后显示结果
3. 点击"详情" → 展开显示父/子HPO关系
4. 点击"添加" → 添加到智能转换的结果列表（跨模块联动）

---

### 第六步：导出功能

**创建文件：**
1. `src/utils/export.ts` - 导出工具函数
2. `src/components/common/ExportButton.tsx` - 导出按钮组件

**导出格式：**

CSV格式：
```csv
HPO ID,Name (EN),Name (CN),Confidence,Matched Text
HP:0001945,Fever,发热,95,发热
HP:0012735,Cough,咳嗽,88,咳嗽
```

JSON格式：
```json
{
  "timestamp": "2026-01-13T12:00:00Z",
  "originalText": "患者出现发热、咳嗽...",
  "hpoEntries": [...]
}
```

---

### 第七步：样式和响应式

**创建文件：**
1. `src/styles/variables.css` - CSS变量定义
2. `src/styles/global.css` - 全局样式

**响应式断点：**
- 移动端 (< 768px)：上下布局，原文在上，结果在下
- 平板 (768-1024px)：左右布局，比例 50:50
- 桌面 (> 1024px)：左右布局，比例 40:60

---

## 关键技术实现

### 文本高亮实现

```typescript
// 将原文转换为带高亮的HTML
const highlightText = (
  text: string,
  matches: {text: string; color: string}[]
): string => {
  let result = text;
  matches.forEach((match, index) => {
    const regex = new RegExp(match.text, 'gi');
    result = result.replace(
      regex,
      `<mark class="highlight-${index % 5}">$&</mark>`
    );
  });
  return result;
};
```

### 导出功能实现

```typescript
const exportToCSV = (data: HPOEntry[], filename: string) => {
  const headers = ['HPO ID', 'Name (EN)', 'Name (CN)', 'Confidence', 'Matched Text'];
  const rows = data.map(item => [
    item.hpoId,
    item.nameEn,
    item.nameCn,
    item.confidence.toString(),
    item.matchedText
  ]);
  // ... 生成CSV并触发下载
};
```

---

## 验证测试

### 启动项目
```bash
npm install
npm run dev
```

### 测试用例

1. **智能转换模块**
   - 输入: "患者出现发热、咳嗽和胸痛"
   - 预期: 识别出3个HPO项，显示置信度，原文高亮

2. **精确匹配模块**
   - 搜索: "发热" / 模糊匹配
   - 预期: 返回包含"发热"的HPO列表，按相关度排序

3. **导出功能**
   - 点击"导出CSV"
   - 预期: 下载CSV文件，包含所有HPO结果

4. **响应式**
   - 调整浏览器窗口大小
   - 预期: 布局自动适应，移动端为上下布局

---

## 后续扩展

1. **对接真实后端API** - 替换mockApi.ts中的模拟函数
2. **添加用户认证** - 实现登录/注册功能
3. **历史记录** - 使用localStorage保存搜索历史
4. **批量上传** - 支持TXT/CSV文件批量转换
5. **国际化** - 添加完整的i18n支持

---

## 文件清单

**需要创建的核心文件（约30个）：**

```
package.json
vite.config.ts
tsconfig.json
index.html
src/main.tsx
src/App.tsx
src/types/index.ts
src/styles/global.css
src/styles/variables.css
src/services/mock/hpoData.ts
src/services/mock/mockApi.ts
src/services/api.ts
src/utils/export.ts
src/utils/highlight.ts
src/hooks/useExport.ts
src/hooks/useLocalStorage.ts
src/components/common/Header.tsx
src/components/common/Footer.tsx
src/components/common/ExportButton.tsx
src/components/SmartMatch/TextInputArea.tsx
src/components/SmartMatch/HighlightText.tsx
src/components/SmartMatch/HPOResultList.tsx
src/components/SmartMatch/ResultCard.tsx
src/components/ExactMatch/SearchBar.tsx
src/components/ExactMatch/ResultTable.tsx
src/pages/HomePage.tsx
src/pages/SmartMatchPage.tsx
src/pages/ExactMatchPage.tsx
```
