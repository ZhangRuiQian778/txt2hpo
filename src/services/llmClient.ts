import type { LLMConfig } from '@/types';

/**
 * 调用 LLM API
 * @param config LLM 配置
 * @param systemPrompt 系统提示词
 * @param userPrompt 用户提示词
 * @param timeout 超时时间（毫秒），默认 60000
 */
export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string,
  timeout = 60000
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

  // 创建超时控制器
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // 提取内容（Anthropic 和 OpenAI 格式不同）
    if (isAnthropic) {
      return data.content?.[0]?.text || '';
    } else {
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
    throw new Error('未知错误');
  }
}
