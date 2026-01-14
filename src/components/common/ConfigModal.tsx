import { useState, useEffect } from 'react';
import { Drawer, Input, Select, Button, Alert, Space, Typography, Divider, Tag, message, AutoComplete } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  HistoryOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import type { LLMConfig, ServiceCheckStatus, ServiceCheckError, ConfigHistory } from '@/types';
import { useConfig, MODEL_OPTIONS, API_URL_OPTIONS } from '@/hooks/useConfig';

const { Text } = Typography;

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

// URL 验证正则
const URL_PATTERN = /^https?:\/\/.+/;

export function ConfigModal({ open, onClose }: ConfigModalProps) {
  const { configHistory, saveConfig, checkService, loadConfig } = useConfig();

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [checkStatus, setCheckStatus] = useState<ServiceCheckStatus>('idle');
  const [checkError, setCheckError] = useState<ServiceCheckError | null>(null);
  const [urlPreview, setUrlPreview] = useState('');

  // 初始化表单值
  useEffect(() => {
    if (open) {
      const savedConfig = loadConfig();
      if (savedConfig) {
        setApiKey(savedConfig.apiKey);
        // 检查是否是预设地址
        const isPresetUrl = API_URL_OPTIONS.some(opt => opt.value === savedConfig.apiUrl);
        if (isPresetUrl) {
          setApiUrl(savedConfig.apiUrl);
          setCustomApiUrl('');
        } else {
          setApiUrl('');
          setCustomApiUrl(savedConfig.apiUrl);
        }
        setModelName(savedConfig.modelName);
      } else {
        setApiKey('');
        setApiUrl(API_URL_OPTIONS[0].value);
        setCustomApiUrl('');
        setModelName('gpt-4o');
        setUrlPreview(API_URL_OPTIONS[0].value);
      }
      setCheckStatus('idle');
      setCheckError(null);
    }
  }, [open, loadConfig]);

  // 更新 URL 预览（显示实际请求的完整端点）
  useEffect(() => {
    const baseUrl = apiUrl || customApiUrl;
    if (!baseUrl) {
      setUrlPreview('');
      return;
    }

    // 去除末尾斜杠
    const cleanUrl = baseUrl.replace(/\/$/, '');

    // 根据服务商类型构建实际端点
    let endpoint: string;
    if (cleanUrl.includes('anthropic.com')) {
      endpoint = `${cleanUrl}/v1/messages`;
    } else {
      endpoint = `${cleanUrl}/chat/completions`;
    }

    setUrlPreview(endpoint);
  }, [apiUrl, customApiUrl]);

  // 获取实际的 API URL
  const getActualApiUrl = () => {
    return apiUrl || customApiUrl;
  };

  // 判断是否为自定义模式
  const isCustomUrl = apiUrl === '';

  // 处理 API 地址选项变更
  const handleApiUrlChange = (value: string) => {
    setApiUrl(value);
    setCustomApiUrl('');
  };

  // 处理自定义 URL 输入
  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomApiUrl(e.target.value);
  };

  // 验证表单
  const validateForm = (): { valid: boolean; error?: string } => {
    const actualUrl = getActualApiUrl();
    if (!actualUrl.trim()) {
      return { valid: false, error: 'API 地址不能为空' };
    }
    if (!URL_PATTERN.test(actualUrl)) {
      return { valid: false, error: 'API 地址格式不正确，应以 http:// 或 https:// 开头' };
    }
    if (!apiKey.trim()) {
      return { valid: false, error: 'API 密钥不能为空' };
    }
    if (!modelName.trim()) {
      return { valid: false, error: '模型名称不能为空' };
    }
    return { valid: true };
  };

  // 检测服务
  const handleCheckService = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      message.error(validation.error);
      return;
    }

    setCheckStatus('checking');
    setCheckError(null);

    const checkConfig: LLMConfig = {
      apiKey: apiKey.trim(),
      apiUrl: getActualApiUrl().trim(),
      modelName: modelName.trim(),
    };

    const result = await checkService(checkConfig);

    if (result.success) {
      setCheckStatus('success');
      setCheckError(null);
      message.success('服务连接成功！');
    } else {
      setCheckStatus('error');
      setCheckError(result.error || null);
    }
  };

  // 保存配置
  const handleSave = () => {
    if (checkStatus !== 'success') {
      message.warning('请先检测服务连接成功后再保存');
      return;
    }

    const newConfig: LLMConfig = {
      apiKey: apiKey.trim(),
      apiUrl: getActualApiUrl().trim(),
      modelName: modelName.trim(),
    };

    saveConfig(newConfig);
    message.success('配置已保存');
    handleClose();
  };

  // 关闭模态框
  const handleClose = () => {
    setCheckStatus('idle');
    setCheckError(null);
    onClose();
  };

  // 恢复历史配置
  const handleRestoreHistory = (historyItem: ConfigHistory) => {
    setApiKey(historyItem.config.apiKey);
    const isPresetUrl = API_URL_OPTIONS.some(opt => opt.value === historyItem.config.apiUrl);
    if (isPresetUrl) {
      setApiUrl(historyItem.config.apiUrl);
      setCustomApiUrl('');
    } else {
      setApiUrl('');
      setCustomApiUrl(historyItem.config.apiUrl);
    }
    setModelName(historyItem.config.modelName);
    setUrlPreview(historyItem.config.apiUrl);
    setCheckStatus('idle');
    setCheckError(null);
    message.info('已加载历史配置，请点击检测服务验证');
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} 天前`;
    } else if (hours > 0) {
      return `${hours} 小时前`;
    } else {
      return '刚刚';
    }
  };

  const canSave = checkStatus === 'success';

  return (
    <Drawer
      title={
        <Space>
          <span>大模型服务配置</span>
          {checkStatus === 'success' && (
            <Tag icon={<CheckCircleOutlined />} color="success">已验证</Tag>
          )}
          {checkStatus === 'error' && (
            <Tag icon={<CloseCircleOutlined />} color="error">验证失败</Tag>
          )}
        </Space>
      }
      open={open}
      onClose={handleClose}
      placement="right"
      width={480}
      styles={{
        body: { padding: 'var(--spacing-lg)' },
        footer: {
          borderTop: '1px solid var(--color-border-light)',
          padding: 'var(--spacing-md) var(--spacing-lg)',
        },
      }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            保存配置
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 配置表单 */}
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* API 地址 */}
          <div>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>
              <Text strong>API 地址</Text>
              <Text type="secondary" style={{ marginLeft: 'var(--spacing-xs)' }}>*</Text>
            </div>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Select
                value={isCustomUrl ? '' : apiUrl}
                onChange={handleApiUrlChange}
                options={API_URL_OPTIONS}
                placeholder="选择预设地址"
                style={{ width: '100%' }}
              />
              {isCustomUrl && (
                <Input
                  value={customApiUrl}
                  onChange={handleCustomUrlChange}
                  placeholder="输入自定义 API 地址，如：https://api.example.com/v1"
                  status={customApiUrl && !URL_PATTERN.test(customApiUrl) ? 'error' : undefined}
                />
              )}
              {urlPreview && (
                <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  实际请求地址: <Text code style={{ fontSize: 'var(--font-size-xs)' }}>{urlPreview}</Text>
                </Text>
              )}
            </Space>
            <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              选择预设或输入自定义 API 服务地址
            </Text>
          </div>

          {/* API 密钥 */}
          <div>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>
              <Text strong>API 密钥</Text>
              <Text type="secondary" style={{ marginLeft: 'var(--spacing-xs)' }}>*</Text>
            </div>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type={showApiKey ? 'text' : 'password'}
              placeholder="输入 API 密钥"
              suffix={
                <Button
                  type="text"
                  size="small"
                  icon={showApiKey ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{ padding: '0 4px' }}
                />
              }
            />
            <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              密钥将加密存储在本地浏览器中
            </Text>
          </div>

          {/* 模型名称 */}
          <div>
            <div style={{ marginBottom: 'var(--spacing-xs)' }}>
              <Text strong>模型名称</Text>
              <Text type="secondary" style={{ marginLeft: 'var(--spacing-xs)' }}>*</Text>
            </div>
            <AutoComplete
              value={modelName}
              onChange={setModelName}
              options={MODEL_OPTIONS}
              showSearch
              placeholder="选择或输入模型名称"
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
            <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              选择预设模型或输入自定义模型名称
            </Text>
          </div>

          {/* 检测服务按钮 */}
          <Button
            block
            type="default"
            onClick={handleCheckService}
            loading={checkStatus === 'checking'}
            icon={checkStatus === 'checking' ? <LoadingOutlined /> : undefined}
          >
            {checkStatus === 'checking' ? '检测中...' : '检测服务'}
          </Button>

          {/* 检测结果提示 */}
          {checkStatus === 'success' && (
            <Alert
              message="服务连接成功"
              description="配置已验证，可以保存使用"
              type="success"
              showIcon
            />
          )}
          {checkStatus === 'error' && checkError && (
            <Alert
              message="服务连接失败"
              description={checkError.message}
              type="error"
              showIcon
              closable
              onClose={() => setCheckError(null)}
            />
          )}
        </Space>

        {/* 配置历史 */}
        {configHistory.length > 0 && (
          <>
            <Divider style={{ margin: 'var(--spacing-sm) 0' }} />
            <div>
              <Space style={{ marginBottom: 'var(--spacing-sm)' }}>
                <HistoryOutlined />
                <Text strong>配置历史</Text>
              </Space>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {configHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 'var(--spacing-sm)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'all var(--transition-base)',
                    }}
                    onClick={() => handleRestoreHistory(item)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Text style={{ fontSize: 'var(--font-size-sm)' }}>
                          {item.config.modelName}
                        </Text>
                        {item.isConnected && (
                          <Tag color="success" style={{ fontSize: 'var(--font-size-xs)', margin: 0 }}>
                            已验证
                          </Tag>
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }} ellipsis>
                      {item.config.apiUrl}
                    </Text>
                  </div>
                ))}
              </Space>
            </div>
          </>
        )}
      </Space>
    </Drawer>
  );
}
