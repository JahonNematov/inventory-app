import { useSearchParams } from 'react-router-dom'
import { Table, Tabs, Typography, Tag, Avatar, Space, Spin } from 'antd'
import { Link } from 'react-router-dom'
import { useSearchQuery } from '../store/api/inventoryApi'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { data, isLoading, isFetching } = useSearchQuery(query, { skip: query.length < 2 })

  if (query.length < 2) {
    return <Text type="secondary">Enter at least 2 characters to search.</Text>
  }

  const inventoryColumns = [
    {
      title: 'Inventory',
      dataIndex: 'title',
      render: (text: string, record: any) => (
        <Link to={`/inventory/${record.id}`}>
          <strong>{text}</strong>
        </Link>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (d: string) => (d ? d.slice(0, 80) + '...' : '—'),
    },
    {
      title: 'Owner',
      render: (record: any) => (
        <Space>
          <Avatar src={record.ownerAvatar} size="small" />
          {record.ownerName}
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
  ]

  const itemColumns = [
    {
      title: 'Item ID',
      dataIndex: 'customId',
      render: (id: string, record: any) => (
        <Link to={`/inventory/${record.inventoryId}/item/${record.id}`}>
          <code>{id}</code>
        </Link>
      ),
    },
    {
      title: 'Inventory',
      dataIndex: 'inventoryTitle',
      render: (title: string, record: any) => (
        <Link to={`/inventory/${record.inventoryId}`}>{title}</Link>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
  ]

  return (
    <div>
      <Title level={3}>
        🔍 Search results for: <Text mark>"{query}"</Text>
      </Title>

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <Tabs
          items={[
            {
              key: 'inventories',
              label: `📦 Inventories (${data?.inventories?.length || 0})`,
              children: (
                <Table
                  columns={inventoryColumns}
                  dataSource={data?.inventories || []}
                  rowKey="id"
                  loading={isFetching}
                  pagination={false}
                />
              ),
            },
            {
              key: 'items',
              label: `📋 Items (${data?.items?.length || 0})`,
              children: (
                <Table
                  columns={itemColumns}
                  dataSource={data?.items || []}
                  rowKey="id"
                  loading={isFetching}
                  pagination={false}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
