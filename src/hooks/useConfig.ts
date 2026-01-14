import { useState, useCallback, useEffect } from 'react';
import type { LLMConfig, ConfigHistory, ServiceCheckError } from '@/types';

const CONFIG_STORAGE_KEY = 'hpo_llm_config';
const CONFIG_HISTORY_KEY = 'hpo_llm_config_history';
const MAX_HISTORY_COUNT = 5;

// 简单加密/解密（仅用于防止明文存储，非安全加密）
const ENCRYPTION_KEY = 'hpo_tool_2024';
const simpleEncrypt = (text: string): string => {
  return btoa(text.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
  ).join(''));
};

const simpleDecrypt = (encoded: string): string => {
  try {
    const text = atob(encoded);
    return text.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join('');
  } catch {
    return '';
  }
};

/**
 * 加载配置（独立函数，可在组件外使用）
 */
export function loadConfigStatic(): LLMConfig | null {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const decrypted = simpleDecrypt(saved);
      return JSON.parse(decrypted);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return null;
}

// 服务检测返回类型
type ServiceCheckResult = { success: boolean; error?: ServiceCheckError };

interface UseConfigReturn {
  config: LLMConfig | null;
  configHistory: ConfigHistory[];
  saveConfig: (config: LLMConfig) => void;
  loadConfig: () => LLMConfig | null;
  clearConfig: () => void;
  checkService: (config: LLMConfig) => Promise<ServiceCheckResult>;
}

// 默认配置
const DEFAULT_CONFIG: LLMConfig = {
  apiKey: '',
  apiUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-4o',
};

// 预设模型选项
export const MODEL_OPTIONS = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
  { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
];

// 常用 API 地址
export const API_URL_OPTIONS = [
  { label: 'OpenAI (官方)', value: 'https://api.openai.com/v1' },
  { label: 'Azure OpenAI', value: 'https://YOUR_RESOURCE.openai.azure.com' },
  { label: 'Anthropic (Claude)', value: 'https://api.anthropic.com' },
  { label: '自定义', value: '' },
];

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [configHistory, setConfigHistory] = useState<ConfigHistory[]>([]);

  // 加载配置（内部版本，同时更新 state）
  const loadConfigAndUpdateState = useCallback((): LLMConfig | null => {
    const loaded = loadConfigStatic();
    if (loaded) {
      setConfig(loaded);
    }
    return loaded;
  }, []);

  // 保存配置
  const saveConfig = useCallback((newConfig: LLMConfig) => {
    setConfig(newConfig);
    try {
      const encrypted = simpleEncrypt(JSON.stringify(newConfig));
      localStorage.setItem(CONFIG_STORAGE_KEY, encrypted);

      // 添加到历史记录
      const historyItem: ConfigHistory = {
        id: Date.now().toString(),
        config: newConfig,
        timestamp: Date.now(),
        isConnected: false,
      };

      setConfigHistory(prev => {
        const newHistory = [historyItem, ...prev].slice(0, MAX_HISTORY_COUNT);
        localStorage.setItem(CONFIG_HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }, []);

  // 清除配置
  const clearConfig = useCallback(() => {
    setConfig(null);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }, []);

  // 检测服务
  const checkService = useCallback(async (checkConfig: LLMConfig): Promise<ServiceCheckResult> => {
    const { apiUrl, apiKey, modelName } = checkConfig;

    // 验证 URL 格式
    let validUrl: string;
    try {
      validUrl = new URL(apiUrl).href;
    } catch {
      return {
        success: false,
        error: { type: 'invalid_url', message: 'API 地址格式不正确' }
      };
    }

    if (!apiKey.trim()) {
      return {
        success: false,
        error: { type: 'auth', message: 'API 密钥不能为空' }
      };
    }

    if (!modelName.trim()) {
      return {
        success: false,
        error: { type: 'unknown', message: '模型名称不能为空' }
      };
    }

    // 根据不同的服务商构建测试请求
    const isAnthropic = validUrl.includes('anthropic.com');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isAnthropic) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    try {
      // 发送一个简单的测试请求
      const endpoint = isAnthropic
        ? `${validUrl.replace(/\/$/, '')}/v1/messages`
        : `${validUrl.replace(/\/$/, '')}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
          ...(isAnthropic && { max_tokens: 1 }),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: { type: 'auth', message: '认证失败，请检查 API 密钥是否正确' }
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: { type: 'unknown', message: '模型不存在，请检查模型名称' }
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: { type: 'unknown', message: '服务器错误，请稍后重试' }
        };
      }

      // 只要不返回认证错误，就算检测通过（即使返回模型相关错误）
      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: { type: 'unknown', message: errorData.error?.message || '未知错误' }
      };

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: { type: 'timeout', message: '连接超时，请检查网络或 API 地址' }
          };
        }
        if (error.message.includes('fetch')) {
          return {
            success: false,
            error: { type: 'network', message: '网络错误，请检查 API 地址是否可访问' }
          };
        }
      }
      return {
        success: false,
        error: { type: 'unknown', message: '未知错误：' + (error instanceof Error ? error.message : '未知') }
      };
    }
  }, []);

  // 初始化加载配置和历史
  useEffect(() => {
    loadConfigAndUpdateState();
    try {
      const history = localStorage.getItem(CONFIG_HISTORY_KEY);
      if (history) {
        setConfigHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load config history:', error);
    }
  }, [loadConfigAndUpdateState]);

  return {
    config,
    configHistory,
    saveConfig,
    loadConfig: loadConfigAndUpdateState,
    clearConfig,
    checkService,
  };
}

export { DEFAULT_CONFIG };
