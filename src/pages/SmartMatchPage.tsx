import { useState } from 'react';
import { Layout, Row, Col, message, Empty, Typography, Modal } from 'antd';
import { smartMatch } from '@/services/api';
import type { SmartMatchResult } from '@/types';
import { TextInputArea } from '@/components/SmartMatch/TextInputArea';
import { HighlightText } from '@/components/SmartMatch/HighlightText';
import { HPOResultList } from '@/components/SmartMatch/HPOResultList';
import { ExportButton } from '@/components/common/ExportButton';
import { ConfigModal } from '@/components/common/ConfigModal';

const { Content } = Layout;
const { Title } = Typography;

export function SmartMatchPage() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<SmartMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | undefined>();
  const [configModalOpen, setConfigModalOpen] = useState(false);

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
          cancelText: '取消',
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

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setActiveHighlightIndex(undefined);
  };

  const handleRemoveEntry = (hpoId: string) => {
    if (result) {
      setResult({
        ...result,
        hpoEntries: result.hpoEntries.filter(entry => entry.hpoId !== hpoId),
      });
    }
  };

  const handleHighlightClick = (index: number) => {
    setActiveHighlightIndex(index);
  };

  return (
    <>
    <Content style={{
      padding: 'var(--container-padding)',
      overflow: 'auto',
      minHeight: 'calc(100vh - var(--header-height) - var(--footer-height))',
    }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        {/* 页面标题（仅移动端显示） */}
        <div className="hide-desktop" style={{ marginBottom: 'var(--spacing-md)' }}>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>
            医嘱智能转换
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            输入医嘱或病例描述，自动转换为HPO术语
          </p>
        </div>

        {/* 输入区域 */}
        <div style={{ marginBottom: 'var(--spacing-xl)', background: 'var(--color-bg)', borderRadius: 'var(--border-radius-lg)', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border-light)' }}>
          <TextInputArea
            value={inputText}
            onChange={setInputText}
            onConvert={handleConvert}
            onClear={handleClear}
            loading={loading}
          />
        </div>

        {/* 结果区域 */}

        {/* 无结果时的空状态 */}
        {!loading && inputText && result && result.hpoEntries.length === 0 && (
          <div style={{
            padding: 'var(--spacing-xxl) 0',
            textAlign: 'center',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                    未识别到相关症状
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                    请尝试使用更规范的医学术语，如：发热、咳嗽、胸痛、呼吸困难等
                  </p>
                </div>
              }
            />
          </div>
        )}

        {/* 结果展示区域 */}
        <Row gutter={[16, 16]}>
          {/* 左侧：原文高亮显示 */}
          <Col xs={24} lg={10}>
            <Title
              level={4}
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 500,
                color: 'var(--color-primary)',
                marginBottom: 'var(--spacing-md)',
                marginLeft: 'var(--spacing-xs)'
              }}
            >
              原文显示
            </Title>
            <HighlightText
              originalText={result?.originalText || inputText}
              hpoEntries={result?.hpoEntries || []}
              activeHighlightIndex={activeHighlightIndex}
            />
          </Col>

          {/* 右侧：HPO结果列表 */}
          <Col xs={24} lg={14}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
              <Title
                level={4}
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  marginBottom: 0,
                  marginLeft: 'var(--spacing-xs)'
                }}
              >
                识别结果
              </Title>
              {result && result.hpoEntries.length > 0 && (
                <ExportButton data={result} />
              )}
            </div>
            <HPOResultList
              result={result}
              loading={loading}
              onRemoveEntry={handleRemoveEntry}
              onHighlightClick={handleHighlightClick}
            />
          </Col>
        </Row>
      </div>
    </Content>
    <ConfigModal
      open={configModalOpen}
      onClose={() => setConfigModalOpen(false)}
    />
    </>
  );
}
