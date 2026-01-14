import { Table, Tag, Empty, Typography, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ExactMatchResult } from '@/types';

const { Text } = Typography;

interface ResultTableProps {
  results: ExactMatchResult[];
  loading?: boolean;
  onDelete?: (hpoId: string) => void;
}

export function ResultTable({
  results,
  loading = false,
  onDelete,
}: ResultTableProps) {
  const columns: ColumnsType<ExactMatchResult> = [
    {
      title: 'HPO ID',
      dataIndex: 'hpoId',
      key: 'hpoId',
      width: 130,
      render: (hpoId: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
          {hpoId}
        </Tag>
      ),
      sorter: (a, b) => a.hpoId.localeCompare(b.hpoId),
    },
    {
      title: '名称',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 'var(--font-size-base)' }}>{record.nameCn}</div>
          <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
            {record.nameEn}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.nameCn.localeCompare(b.nameCn),
    },
    {
      title: '详情',
      key: 'description',
      render: (_, record) => {
        const cnDesc = record.description || '';
        const enDesc = record.definition || '';

        if (!cnDesc && !enDesc) {
          return <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>暂无描述</Text>;
        }

        return (
          <div>
            {cnDesc && (
              <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '2px' }}>
                {cnDesc}
              </div>
            )}
            {enDesc && (
              <Text type="secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                {enDesc}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description="确定要删除这条记录吗？"
          onConfirm={() => onDelete?.(record.hpoId)}
          okText="确定"
          cancelText="取消"
        >
          <span style={{ color: '#ff4d4f', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <DeleteOutlined style={{ fontSize: '16px' }} />
            <span>删除</span>
          </span>
        </Popconfirm>
      ),
    },
  ];

  if (!loading && results.length === 0) {
    return (
      <div style={{ padding: 'var(--spacing-xxl) 0', textAlign: 'center' }}>
        <Empty description="未找到匹配的HPO术语" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={results}
      rowKey="hpoId"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条结果`,
        showQuickJumper: true,
      }}
      size="small"
      style={{ marginTop: 'var(--spacing-md)' }}
    />
  );
}
