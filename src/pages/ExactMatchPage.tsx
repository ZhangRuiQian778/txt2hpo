import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Card, Typography, Space, Button, message, Modal, Spin } from 'antd';
import { SearchOutlined, DownloadOutlined, ExclamationCircleOutlined, ClearOutlined, AppstoreOutlined } from '@ant-design/icons';
import HPOSearch from '@/components/HPOSearch';
import { useHPOCategories } from '@/hooks/useHPOCategories';
import type { ExactMatchResult, HPOCategory, HPODataItem, HPOSearchOption, HPOSearchRef } from '@/types';
import { ResultTable } from '@/components/ExactMatch/ResultTable';
import { getHpoData } from '@/services/hpoDataStore';
import { exportHPOResults } from '@/utils/exportUtils';

const { Content } = Layout;
const { Text } = Typography;

export function ExactMatchPage() {
  const [manualResults, setManualResults] = useState<ExactMatchResult[]>([]);
  const searchRef = useRef<HPOSearchRef>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [excludedHpoIds, setExcludedHpoIds] = useState<string[]>([]);

  const { categories, loading: categoriesLoading, error: categoriesError } = useHPOCategories();
  const [hpoData, setHpoData] = useState<HPODataItem[]>([]);
  const [hpoDataLoading, setHpoDataLoading] = useState(true);
  const [hpoDataError, setHpoDataError] = useState<string | null>(null);

  // 加载 HPO 明细数据（用于将分类里的 HPO ID 映射到名称/定义等完整信息）
  useEffect(() => {
    let cancelled = false;

    const loadHpoData = async () => {
      try {
        setHpoDataLoading(true);
        const data: HPODataItem[] = await getHpoData();
        if (!cancelled) {
          setHpoData(data);
          setHpoDataError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setHpoData([]);
          setHpoDataError(err instanceof Error ? err.message : 'Unknown error');
        }
        console.error('Failed to load HPO data:', err);
      } finally {
        if (!cancelled) {
          setHpoDataLoading(false);
        }
      }
    };

    loadHpoData();
    return () => {
      cancelled = true;
    };
  }, []);

  const excludedHpoIdSet = useMemo(() => new Set(excludedHpoIds), [excludedHpoIds]);
  const categoryById = useMemo(() => {
    return new Map<string, HPOCategory>(categories.map((c) => [c.categoryId, c]));
  }, [categories]);
  const hpoDataById = useMemo(() => {
    return new Map<string, HPODataItem>(hpoData.map((item) => [item.hpoId, item]));
  }, [hpoData]);

  // 处理 HPO 选择
  const handleSelect = (option: HPOSearchOption) => {
    // 转换为 ExactMatchResult 格式并添加到历史记录
    const result: ExactMatchResult = {
      hpoId: option.hpoId,
      nameEn: option.nameEn,
      nameCn: option.nameCn,
      description: option.definitionZh,    // 中文描述
      definition: option.definition,       // 英文描述
    };

    // 若该 HPO 曾被“删除=排除”，用户通过搜索再次选择时应视为恢复
    setExcludedHpoIds(prev => prev.includes(result.hpoId) ? prev.filter(id => id !== result.hpoId) : prev);

    setManualResults(prev => {
      const filtered = prev.filter(h => h.hpoId !== option.hpoId);
      return [result, ...filtered];
    });
  };

  // 处理删除（删除=排除，避免在当前分类选择下回弹）
  const handleDelete = (hpoId: string) => {
    setExcludedHpoIds(prev => prev.includes(hpoId) ? prev : [hpoId, ...prev]);
    setManualResults(prev => prev.filter(item => item.hpoId !== hpoId));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const clearAllResults = () => {
    setManualResults([]);
    setSelectedCategoryIds([]);
    setExcludedHpoIds([]);
  };

  const categoryResults = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return [] as ExactMatchResult[];
    }

    const results: ExactMatchResult[] = [];
    const seenHpoIds = new Set<string>();

    const pushResult = (hpoId: string, fallbackNameCn?: string) => {
      if (!hpoId || excludedHpoIdSet.has(hpoId) || seenHpoIds.has(hpoId)) {
        return;
      }
      seenHpoIds.add(hpoId);

      const detail = hpoDataById.get(hpoId);
      if (detail) {
        results.push({
          hpoId: detail.hpoId,
          nameEn: detail.nameEn,
          nameCn: detail.nameCn,
          description: detail.definitionZh,
          definition: detail.definition,
        });
        return;
      }

      // 兜底：若明细还在加载，先展示分类里的中文名；若已加载仍缺失，则提示缺失
      results.push({
        hpoId,
        nameEn: '',
        nameCn: fallbackNameCn || hpoId,
        description: hpoDataLoading ? '' : '（未在 hpo_data.json 找到明细）',
        definition: '',
      });
    };

    for (const categoryId of selectedCategoryIds) {
      const category = categoryById.get(categoryId);
      if (!category) {
        continue;
      }

      // 选中分类时，将“分类自身的 HPO ID”也加入结果（与其第三级子节点一起展示）
      pushResult(category.categoryId, category.categoryName);

      for (const item of category.hpoItems) {
        pushResult(item.hpoId, item.nameCn);
      }
    }

    return results;
  }, [categoryById, excludedHpoIdSet, hpoDataById, hpoDataLoading, selectedCategoryIds]);

  const displayResults = useMemo(() => {
    const results: ExactMatchResult[] = [];
    const seen = new Set<string>();

    for (const item of manualResults) {
      if (excludedHpoIdSet.has(item.hpoId) || seen.has(item.hpoId)) {
        continue;
      }
      seen.add(item.hpoId);
      results.push(item);
    }

    for (const item of categoryResults) {
      if (seen.has(item.hpoId)) {
        continue;
      }
      seen.add(item.hpoId);
      results.push(item);
    }

    return results;
  }, [categoryResults, excludedHpoIdSet, manualResults]);

  const resultsLoading = selectedCategoryIds.length > 0 && (categoriesLoading || hpoDataLoading);

  // 处理导出
  const handleExport = async () => {
    const resultsToExport = displayResults;

    // 检查是否有数据
    if (resultsToExport.length === 0) {
      message.warning('没有可导出的数据，请先进行搜索');
      return;
    }

    // 数据量大时显示确认对话框
    if (resultsToExport.length > 100) {
      Modal.confirm({
        title: '确认导出',
        icon: <ExclamationCircleOutlined />,
        content: `即将导出 ${resultsToExport.length} 条数据，这可能需要几秒钟，确定继续吗？`,
        okText: '确定导出',
        cancelText: '取消',
        onOk: () => performExport(resultsToExport),
      });
    } else {
      performExport(resultsToExport);
    }
  };

  // 执行导出
  const performExport = async (resultsToExport: ExactMatchResult[]) => {
    setExporting(true);
    setExportProgress(0);

    try {
      await exportHPOResults(resultsToExport, (current, total) => {
        const progress = Math.round((current / total) * 100);
        setExportProgress(progress);
      });

      message.success(`成功导出 ${resultsToExport.length} 条数据`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}，请重试`);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <Content style={{
      padding: 'var(--container-padding)',
      overflow: 'auto',
      minHeight: 'calc(100vh - var(--header-height) - var(--footer-height))',
    }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        {/* 页面标题（仅移动端显示） */}
        <div className="hide-desktop" style={{ marginBottom: 'var(--spacing-md)' }}>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
            HPO术语搜索
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            通过HPO ID或症状关键词查找术语
          </p>
        </div>

        {/* 搜索区域 */}
        <Card
          style={{
            marginBottom: 'var(--spacing-xl)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-xs)',
          }}
          bodyStyle={{ padding: 'var(--spacing-lg)' }}
        >
          <HPOSearch
            ref={searchRef}
            onSelect={handleSelect}
            showDetail={true}
            limit={20}
          />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              💡 支持搜索：HPO ID（如 HP:0000002）| 中文名称（如 身高）
            </Text>
          </div>
        </Card>

        {/* 热门疾病分类（23类，多选） */}
        <Card
          title={
            <Space>
              <AppstoreOutlined />
              <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}>热门疾病分类</span>
            </Space>
          }
          extra={
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                已选 {selectedCategoryIds.length} 类 / HPO {categoryResults.length} 个
              </Text>
            </Space>
          }
          style={{
            marginBottom: 'var(--spacing-xl)',
            borderRadius: 'var(--border-radius-lg)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)', display: 'block' }}>
            💡 支持多选：取消选择会从结果中移除；删除结果将加入排除列表（可通过“清空结果”恢复）
          </Text>

          {(categoriesLoading || categoriesError) && (
            <div style={{ padding: 'var(--spacing-md) 0' }}>
              {categoriesLoading && <Spin size="small" />}
              {categoriesError && (
                <Text type="danger" style={{ marginLeft: 'var(--spacing-sm)' }}>
                  分类数据加载失败：{categoriesError}
                </Text>
              )}
            </div>
          )}

          {!categoriesLoading && !categoriesError && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 'var(--spacing-sm)',
            }}>
              {categories.map((category) => {
                const selected = selectedCategoryIds.includes(category.categoryId);
                return (
                  <Button
                    key={category.categoryId}
                    type={selected ? 'primary' : 'default'}
                    onClick={() => toggleCategory(category.categoryId)}
                    aria-pressed={selected}
                    style={{
                      height: 'auto',
                      padding: '10px 12px',
                      textAlign: 'left',
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      borderRadius: 'var(--border-radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ flex: 1 }}>{category.categoryName}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.85 }}>
                        {category.childCount + 1}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {(hpoDataLoading || hpoDataError) && (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              {hpoDataLoading && (
                <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  HPO 明细数据加载中，结果将自动补全名称与定义...
                </Text>
              )}
              {hpoDataError && (
                <Text type="danger" style={{ fontSize: 'var(--font-size-xs)' }}>
                  HPO 明细数据加载失败：{hpoDataError}
                </Text>
              )}
            </div>
          )}
        </Card>

        {/* 搜索结果 */}
        {(manualResults.length > 0 || selectedCategoryIds.length > 0 || excludedHpoIds.length > 0) && (
          <Card
            title={
              <Space>
                <SearchOutlined />
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}>匹配结果</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal', marginLeft: 'var(--spacing-sm)' }}>
                  共 {displayResults.length} 条记录
                </span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  loading={exporting}
                  size="small"
                  disabled={displayResults.length === 0}
                >
                  {exporting ? `导出中 ${exportProgress > 0 ? `(${exportProgress}%)` : ''}` : '导出数据'}
                </Button>
                <Button
                  danger
                  icon={<ClearOutlined />}
                  onClick={clearAllResults}
                  size="small"
                  disabled={manualResults.length === 0 && selectedCategoryIds.length === 0 && excludedHpoIds.length === 0}
                >
                  清空结果
                </Button>
              </Space>
            }
            style={{ borderRadius: 'var(--border-radius-lg)' }}
          >
            {displayResults.length === 0 && excludedHpoIds.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  已排除 {excludedHpoIds.length} 个HPO；点击“清空结果”可恢复显示
                </Text>
              </div>
            )}
            <ResultTable
              results={displayResults}
              loading={resultsLoading}
              onDelete={handleDelete}
            />
          </Card>
        )}
      </div>
    </Content>
  );
}
