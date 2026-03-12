import { Table, Button, Popconfirm, message, Avatar, Tabs, Typography, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  useGetMyInventoriesQuery,
  useCreateInventoryMutation,
  useDeleteInventoryMutation,
} from '../store/api/inventoryApi'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useGetMyInventoriesQuery()
  const [createInventory] = useCreateInventoryMutation()
  const [deleteInventory] = useDeleteInventoryMutation()

  const handleCreate = async () => {
    try {
      const inv = await createInventory({
        title: 'New Inventory',
        category: 'Other',
        isPublic: false,
      }).unwrap()
      navigate(`/inventory/${inv.id}`)
    } catch {
      message.error('Failed to create inventory')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInventory(id).unwrap()
      message.success('Inventory deleted')
    } catch {
      message.error('Failed to delete')
    }
  }

  const ownedColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (text: string, record: any) => (
        <Link to={`/inventory/${record.id}`}>
          <strong>{text}</strong>
        </Link>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (c: string) => <Tag>{c}</Tag>,
    },
    { title: 'Items', render: (r: any) => r._count?.items || 0 },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
    {
      title: '',
      width: 80,
      render: (record: any) => (
        <Popconfirm
          title="Delete this inventory and all its items?"
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  const sharedColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (text: string, record: any) => (
        <Link to={`/inventory/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: 'Owner',
      render: (r: any) => (
        <span>
          <Avatar src={r.owner?.avatar} size="small" /> {r.owner?.name}
        </span>
      ),
    },
    { title: 'Items', render: (r: any) => r._count?.items || 0 },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Avatar src={user?.avatar} size={64} style={{ fontSize: 32 }}>
          {user?.name?.[0]}
        </Avatar>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {user?.name}
          </Title>
          <Text type="secondary">{user?.email}</Text>
        </div>
      </div>

      <Tabs
        items={[
          {
            key: 'owned',
            label: `📦 My Inventories (${data?.owned?.length || 0})`,
            children: (
              <>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  style={{ marginBottom: 16 }}
                >
                  Create New Inventory
                </Button>
                <Table
                  columns={ownedColumns}
                  dataSource={data?.owned || []}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'shared',
            label: `🤝 Shared with Me (${data?.withAccess?.length || 0})`,
            children: (
              <Table
                columns={sharedColumns}
                dataSource={data?.withAccess || []}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
