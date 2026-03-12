import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Spin, Button, Space, Typography, Tag, Avatar, message } from 'antd'
import './InventoryPage.css'
import { DeleteOutlined } from '@ant-design/icons'
import { useGetInventoryQuery, useDeleteInventoryMutation } from '../store/api/inventoryApi'
import { useAuth } from '../hooks/useAuth'
import { ItemsTab } from '../components/inventory/ItemsTab'
import { DiscussionTab } from '../components/inventory/DiscussionTab'
import { SettingsTab } from '../components/inventory/SettingsTab'
import { CustomIdTab } from '../components/inventory/CustomIdTab'
import { FieldsTab } from '../components/inventory/FieldsTab'
import { AccessTab } from '../components/inventory/AccessTab'
import { StatsTab } from '../components/inventory/StatsTab'

const { Title, Text } = Typography

export default function InventoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [deleteInventory] = useDeleteInventoryMutation()

  const { data: inventory, isLoading, isError } = useGetInventoryQuery(id!)

  if (isLoading) return (
    <div className="inv-page-loading">
      <Spin size="large" />
    </div>
  )
  if (isError || !inventory) return (
    <div className="inv-page-error">
      <p>Inventory not found or failed to load.</p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  )

  const isOwner = user?.id === inventory.ownerId
  const canManage = isOwner || isAdmin

  const hasWriteAccess =
    isOwner ||
    isAdmin ||
    inventory.isPublic ||
    inventory.access?.some((a: any) => a.userId === user?.id)

  const handleDelete = async () => {
    if (!window.confirm('Delete this inventory and all its items?')) return
    try {
      await deleteInventory(id!).unwrap()
      message.success('Inventory deleted')
      navigate('/')
    } catch {
      message.error('Failed to delete')
    }
  }

  const tabItems = [
    {
      key: 'items',
      label: `📋 Items (${inventory._count?.items || 0})`,
      children: (
        <ItemsTab inventory={inventory} canWrite={!!hasWriteAccess} isOwner={!!canManage} />
      ),
    },
    {
      key: 'discussion',
      label: '💬 Discussion',
      children: <DiscussionTab inventoryId={id!} />,
    },
    ...(canManage
      ? [
          {
            key: 'settings',
            label: '⚙️ Settings',
            children: <SettingsTab inventory={inventory} />,
          },
          {
            key: 'custom-id',
            label: '🔑 Custom ID',
            children: <CustomIdTab inventory={inventory} />,
          },
          {
            key: 'fields',
            label: '📝 Fields',
            children: <FieldsTab inventory={inventory} />,
          },
          {
            key: 'access',
            label: '🔒 Access',
            children: <AccessTab inventory={inventory} />,
          },
        ]
      : []),
    {
      key: 'stats',
      label: '📊 Stats',
      children: <StatsTab inventoryId={id!} />,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {inventory.imageUrl && (
                <img
                  src={inventory.imageUrl}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginRight: 12,
                  }}
                />
              )}
              {inventory.title}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color="blue">{inventory.category}</Tag>
              {inventory.isPublic && <Tag color="green">Public</Tag>}
              {inventory.tags?.map((t: any) => (
                <Tag key={t.tag.name}>#{t.tag.name}</Tag>
              ))}
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">by </Text>
              <Avatar src={inventory.owner?.avatar} size="small" />
              <Text> {inventory.owner?.name}</Text>
            </div>
          </div>

          {canManage && (
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete Inventory
            </Button>
          )}
        </div>
      </div>

      <Tabs items={tabItems} defaultActiveKey="items" />
    </div>
  )
}
