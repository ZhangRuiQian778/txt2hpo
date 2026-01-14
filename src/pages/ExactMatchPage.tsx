import { useState, useRef } from 'react';
import { Layout, Card, Typography, Space, Button, message, Modal } from 'antd';
import { SearchOutlined, ExperimentOutlined, DownloadOutlined, ExclamationCircleOutlined, ClearOutlined } from '@ant-design/icons';
import HPOSearch from '@/components/HPOSearch';
import type { HPOSearchRef, HPOSearchOption } from '@/types';
import { ResultTable } from '@/components/ExactMatch/ResultTable';
import type { ExactMatchResult } from '@/types';
import { exportHPOResults } from '@/utils/exportUtils';

const { Content } = Layout;
const { Text } = Typography;

export function ExactMatchPage() {
  const [searchHistory, setSearchHistory] = useState<ExactMatchResult[]>([]);
  const searchRef = useRef<HPOSearchRef>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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

    // 检查是否已存在，如果存在则移到最前面
    const filtered = searchHistory.filter(h => h.hpoId !== option.hpoId);
    setSearchHistory([result, ...filtered]);
  };

  // 处理删除
  const handleDelete = (hpoId: string) => {
    setSearchHistory(prev => prev.filter(item => item.hpoId !== hpoId));
  };

  // 处理热门 HPO 点击
  const handlePopularHPOClick = (hpoId: string) => {
    searchRef.current?.setValueAndSearch(hpoId);
  };

  // 处理导出
  const handleExport = async () => {
    // 检查是否有数据
    if (searchHistory.length === 0) {
      message.warning('没有可导出的数据，请先进行搜索');
      return;
    }

    // 数据量大时显示确认对话框
    if (searchHistory.length > 100) {
      Modal.confirm({
        title: '确认导出',
        icon: <ExclamationCircleOutlined />,
        content: `即将导出 ${searchHistory.length} 条数据，这可能需要几秒钟，确定继续吗？`,
        okText: '确定导出',
        cancelText: '取消',
        onOk: performExport,
      });
    } else {
      performExport();
    }
  };

  // 执行导出
  const performExport = async () => {
    setExporting(true);
    setExportProgress(0);

    try {
      await exportHPOResults(searchHistory, (current, total) => {
        const progress = Math.round((current / total) * 100);
        setExportProgress(progress);
      });

      message.success(`成功导出 ${searchHistory.length} 条数据`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}，请重试`);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const popularHPOs = [
    { id: 'HP:0001945', label: '发热 / Fever' },
    { id: 'HP:0012735', label: '咳嗽 / Cough' },
    { id: 'HP:0001947', label: '胸痛 / Chest pain' },
    { id: 'HP:0002094', label: '呼吸困难 / Dyspnea' },
    { id: 'HP:0002315', label: '头痛 / Headache' },
    { id: 'HP:0002027', label: '腹痛 / Abdominal pain' },
    { id: 'HP:0001680', label: '高血压 / Hypertension' },
    { id: 'HP:0004317', label: '疲劳 / Fatigue' },
  ];

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

        {/* 热门HPO */}
        {searchHistory.length === 0 && (
          <Card
            title={
              <Space>
                <ExperimentOutlined />
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}>热门HPO术语</span>
              </Space>
            }
            style={{
              marginBottom: 'var(--spacing-xl)',
              borderRadius: 'var(--border-radius-lg)',
            }}
          >
            <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)', display: 'block' }}>
              点击以下术语可快速搜索：
            </Text>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 'var(--spacing-sm)',
            }}>
              {popularHPOs.map((hpo) => (
                <span
                  key={hpo.id}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    fontSize: 'var(--font-size-sm)',
                    textAlign: 'center',
                  }}
                  onClick={() => handlePopularHPOClick(hpo.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-secondary)';
                    e.currentTarget.style.color = 'inherit';
                  }}
                >
                  {hpo.label}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 搜索结果 */}
        {searchHistory.length > 0 && (
          <Card
            title={
              <Space>
                <SearchOutlined />
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}>搜索结果</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal', marginLeft: 'var(--spacing-sm)' }}>
                  共 {searchHistory.length} 条记录
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
                  disabled={searchHistory.length === 0}
                >
                  {exporting ? `导出中 ${exportProgress > 0 ? `(${exportProgress}%)` : ''}` : '导出数据'}
                </Button>
                <Button
                  danger
                  icon={<ClearOutlined />}
                  onClick={() => setSearchHistory([])}
                  size="small"
                  disabled={searchHistory.length === 0}
                >
                  清空结果
                </Button>
              </Space>
            }
            style={{ borderRadius: 'var(--border-radius-lg)' }}
          >
            <ResultTable
              results={searchHistory}
              loading={false}
              onDelete={handleDelete}
            />
          </Card>
        )}
      </div>
    </Content>
  );
}
