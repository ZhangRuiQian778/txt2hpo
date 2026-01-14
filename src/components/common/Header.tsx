import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Badge } from 'antd';
import {
  FileSearchOutlined,
  SearchOutlined,
  ExperimentOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ConfigModal } from '@/components/common/ConfigModal';
import { useConfig } from '@/hooks/useConfig';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'HPO智能转换工具' }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useConfig();
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const menuItems = useMemo(() => [
    {
      key: '/',
      icon: <FileSearchOutlined />,
      label: '医嘱智能转换',
    },
    {
      key: '/exact-match',
      icon: <SearchOutlined />,
      label: '精确匹配',
    },
  ], []);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const hasConfig = !!config?.apiKey;

  return (
    <>
      <AntHeader style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--container-padding)',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        height: 'var(--header-height)',
        lineHeight: 'var(--header-height)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Desktop Logo */}
          <div
            className="hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              cursor: 'pointer',
              marginRight: 'var(--spacing-xl)',
            }}
            onClick={() => navigate('/')}
          >
            <ExperimentOutlined style={{ fontSize: '20px', color: 'var(--color-primary)' }} />
            <span style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}>
              {title}
            </span>
          </div>

          {/* Mobile Logo */}
          <div
            className="hide-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              cursor: 'pointer',
              marginRight: 'var(--spacing-md)',
            }}
            onClick={() => navigate('/')}
          >
            <ExperimentOutlined style={{ fontSize: '18px', color: 'var(--color-primary)' }} />
            <span style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}>
              HPO转换
            </span>
          </div>

          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              border: 'none',
              background: 'transparent',
            }}
          />
        </div>

        {/* 配置按钮 */}
        <Badge dot={hasConfig} offset={[-4, 4]}>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setConfigModalOpen(true)}
            style={{
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="hide-mobile" style={{ marginLeft: 'var(--spacing-xs)' }}>
              配置
            </span>
          </Button>
        </Badge>
      </AntHeader>

      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </>
  );
}
