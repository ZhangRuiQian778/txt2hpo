import { useNavigate } from 'react-router-dom';
import { Layout, Button, Typography, Space, Card, Row, Col, Divider } from 'antd';
import {
  FileSearchOutlined,
  SearchOutlined,
  ExperimentOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileSearchOutlined style={{ fontSize: '32px', color: 'var(--color-primary)' }} />,
      title: '医嘱智能转换',
      description: '使用AI驱动的自然语言处理技术，自动将医嘱或病例描述转换为HPO ID列表，支持中英文混合输入。',
      action: () => navigate('/'),
      buttonText: '开始转换',
    },
    {
      icon: <SearchOutlined style={{ fontSize: '32px', color: 'var(--color-success)' }} />,
      title: '精确匹配',
      description: '通过HPO ID或症状关键词进行精确或模糊搜索，快速查找对应的HPO术语及其详细信息。',
      action: () => navigate('/exact-match'),
      buttonText: '开始搜索',
    },
  ];

  const examples = [
    { input: '患者出现发热、咳嗽和胸痛', output: 'HP:0001945, HP:0012735, HP:0001947' },
    { input: '呼吸困难、头痛、头晕', output: 'HP:0002094, HP:0002315, HP:0002386' },
    { input: '腹痛、恶心、呕吐、腹泻', output: 'HP:0002027, HP:0002014, HP:0002013, HP:0000952' },
  ];

  return (
    <Content style={{ padding: 'var(--container-padding)', overflow: 'auto' }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '60px var(--spacing-lg)' }}>
          <ExperimentOutlined style={{ fontSize: '48px', color: 'var(--color-primary)', marginBottom: 'var(--spacing-lg)' }} />
          <Title level={1} style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-xxl)' }}>
            HPO智能转换工具
          </Title>
          <Paragraph style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto var(--spacing-xl)', lineHeight: 'var(--line-height-lg)' }}>
            将临床医嘱和病例描述智能转换为Human Phenotype Ontology (HPO) ID，
            辅助医疗研究和诊断工作。
          </Paragraph>
          <Space size={12} wrap>
            <Button type="primary" size="middle" onClick={() => navigate('/')} style={{ minWidth: '100px' }}>
              <FileSearchOutlined />
              智能转换
            </Button>
            <Button size="middle" onClick={() => navigate('/exact-match')} style={{ minWidth: '100px' }}>
              <SearchOutlined />
              精确匹配
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: 'var(--spacing-xl) 0' }} />

        {/* 功能介绍 */}
        <Row gutter={[16, 16]} style={{ marginTop: 'var(--spacing-xl)' }}>
          {features.map((feature, index) => (
            <Col xs={24} md={12} key={index}>
              <Card
                hoverable
                onClick={feature.action}
                style={{ height: '100%', borderRadius: 'var(--border-radius-lg)' }}
                bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%', flex: 1 }} size={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    {feature.icon}
                    <Title level={4} style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                      {feature.title}
                    </Title>
                  </div>
                  <Paragraph type="secondary" style={{ flex: 1, marginBottom: 0, fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-base)' }}>
                    {feature.description}
                  </Paragraph>
                  <Button type="link" onClick={feature.action} style={{ padding: 0, alignSelf: 'flex-start' }}>
                    {feature.buttonText}
                    <ArrowRightOutlined />
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 使用示例 */}
        <div style={{ marginTop: 'var(--spacing-xxl)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-xl)' }}>
            使用示例
          </Title>
          <Row gutter={[16, 16]}>
            {examples.map((example, index) => (
              <Col xs={24} md={8} key={index}>
                <Card size="small" style={{ borderRadius: 'var(--border-radius-md)' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>输入：</Text>
                    <Text code style={{ display: 'block', padding: 'var(--spacing-sm)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)', fontSize: 'var(--font-size-xs)' }}>
                      {example.input}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>输出：</Text>
                    <Text code style={{ display: 'block', padding: 'var(--spacing-sm)', background: 'var(--color-success)', color: '#fff', borderRadius: 'var(--border-radius-sm)', fontSize: 'var(--font-size-xs)' }}>
                      {example.output}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 关于HPO */}
        <Card style={{ marginTop: 'var(--spacing-xxl)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
          <Title level={4} style={{ fontSize: 'var(--font-size-base)' }}>关于Human Phenotype Ontology (HPO)</Title>
          <Paragraph style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-base)', marginBottom: 'var(--spacing-sm)' }}>
            Human Phenotype Ontology (HPO) 是一个标准化的人类疾病表型术语系统，
            为临床表学描述提供了一个统一的词汇表。HPO目前包含超过13,000个术语，
            广泛应用于罕见病诊断、基因型-表型相关性研究等领域。
          </Paragraph>
          <Paragraph style={{ fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-base)', marginBottom: 0 }}>
            本工具使用Mock数据进行演示，如需使用真实的HPO数据库，请连接后端API服务。
          </Paragraph>
        </Card>
      </div>
    </Content>
  );
}
