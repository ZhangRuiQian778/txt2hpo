import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

export function Footer() {
  return (
    <AntFooter style={{
      textAlign: 'center',
      background: 'var(--color-bg-secondary)',
      borderTop: '1px solid var(--color-border-light)',
      height: 'var(--footer-height)',
      lineHeight: 'var(--footer-height)',
      fontSize: 'var(--font-size-xs)',
      padding: '0 var(--spacing-lg)',
    }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>
        HPO智能转换工具 © 2026 | 辅助医疗研究和诊断
      </span>
    </AntFooter>
  );
}
