import { useState } from 'react'
import {
  Row, Col, Card, Button, Popconfirm, message, Avatar, Modal,
  Form, Input, Select, Switch, Tag, Typography, Skeleton, Empty,
} from 'antd'
import { PlusOutlined, DeleteOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  useGetMyInventoriesQuery,
  useCreateInventoryMutation,
  useDeleteInventoryMutation,
} from '../store/api/inventoryApi'
import dayjs from 'dayjs'
import './ProfilePage.css'

const { Title, Text } = Typography

const CATEGORIES = [
  'Books', 'Electronics', 'Games', 'Art', 'Music',
  'Coins', 'Comics', 'Stamps', 'Equipment', 'Other',
]

const CATEGORY_GRADIENTS: Record<string, string> = {
  Books:       'linear-gradient(135deg, #1890ff, #096dd9)',
  Electronics: 'linear-gradient(135deg, #722ed1, #531dab)',
  Games:       'linear-gradient(135deg, #52c41a, #389e0d)',
  Art:         'linear-gradient(135deg, #fa8c16, #d46b08)',
  Music:       'linear-gradient(135deg, #eb2f96, #c41d7f)',
  Coins:       'linear-gradient(135deg, #faad14, #d48806)',
  Comics:      'linear-gradient(135deg, #fa541c, #d4380d)',
  Stamps:      'linear-gradient(135deg, #13c2c2, #08979c)',
  Equipment:   'linear-gradient(135deg, #2f54eb, #1d39c4)',
  Other:       'linear-gradient(135deg, #667eea, #764ba2)',
}

const CATEGORY_ICONS: Record<string, string> = {
  Books: '📚', Electronics: '💻', Games: '🎮', Art: '🎨', Music: '🎵',
  Coins: '🪙', Comics: '🦸', Stamps: '📮', Equipment: '🛠️', Other: '📦',
}

const CATEGORY_COLORS: Record<string, string> = {
  Books: 'blue', Electronics: 'purple', Games: 'green', Art: 'orange',
  Music: 'magenta', Coins: 'gold', Comics: 'volcano', Stamps: 'cyan',
  Equipment: 'geekblue', Other: 'default',
}

function MiniInventoryCard({ inv, onDelete }: { inv: any; onDelete: (id: string) => void }) {
  const gradient = CATEGORY_GRADIENTS[inv.category] || CATEGORY_GRADIENTS.Other
  const icon     = CATEGORY_ICONS[inv.category]     || '📦'
  const color    = CATEGORY_COLORS[inv.category]    || 'default'

  return (
    <Card
      hoverable
      className="inv-mini-card"
      styles={{ body: { padding: 0 } }}
      cover={
        inv.imageUrl
          ? <img src={inv.imageUrl} alt={inv.title} className="inv-mini-cover-img" />
          : <div className="inv-mini-cover" style={{ ['--card-gradient' as string]: gradient }}>{icon}</div>
      }
    >
      <div className="inv-mini-body">
        <Link to={`/inventory/${inv.id}`} className="inv-mini-title">{inv.title}</Link>
        <div className="inv-mini-footer">
          <Tag color={color} style={{ margin: 0, fontSize: 11 }}>{inv.category}</Tag>
          <div className="inv-mini-actions">
            <Text type="secondary" style={{ fontSize: 11 }}>{inv._count?.items ?? 0}</Text>
            <Popconfirm
              title="Delete this inventory?"
              onConfirm={(e) => { e?.stopPropagation(); onDelete(inv.id) }}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useGetMyInventoriesQuery()
  const [createInventory, { isLoading: creating }] = useCreateInventoryMutation()
  const [deleteInventory] = useDeleteInventoryMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const owned  = data?.owned      || []
  const shared = data?.withAccess || []

  const handleCreate = async (values: any) => {
    try {
      const inv = await createInventory({
        title:    values.title.trim(),
        category: values.category || 'Other',
        isPublic: values.isPublic || false,
      }).unwrap()
      setModalOpen(false)
      form.resetFields()
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

  return (
    <div className="profile-page">
      {/* Hero */}
      <div className="profile-hero">
        <Avatar src={user?.avatar} size={72} icon={<UserOutlined />} className="profile-hero-avatar">
          {user?.name?.[0]}
        </Avatar>

        <div className="profile-hero-info">
          <Title level={3} className="profile-hero-name">{user?.name}</Title>
          <Text className="profile-hero-email">{user?.email}</Text>

          <div className="profile-hero-stats">
            <div>
              <div className="profile-hero-stat-value">{owned.length}</div>
              <div className="profile-hero-stat-label">My Inventories</div>
            </div>
            <div>
              <div className="profile-hero-stat-value">{shared.length}</div>
              <div className="profile-hero-stat-label">Shared with me</div>
            </div>
            <div>
              <div className="profile-hero-stat-value">
                {owned.reduce((s: number, i: any) => s + (i._count?.items || 0), 0)}
              </div>
              <div className="profile-hero-stat-label">Total Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* My Inventories */}
      <div className="profile-section-header">
        <Title level={4} className="profile-section-title">
          <AppstoreOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          My Inventories
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Inventory
        </Button>
      </div>

      {isLoading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col xs={12} sm={8} md={6} key={i}>
              <Card style={{ borderRadius: 12 }}><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 40 }}>
          <Col xs={12} sm={8} md={6}>
            <div className="inv-create-card" onClick={() => setModalOpen(true)} role="button">
              <div className="inv-create-card-inner">
                <div className="inv-create-card-icon">＋</div>
                <Text type="secondary" style={{ fontSize: 13 }}>New Inventory</Text>
              </div>
            </div>
          </Col>

          {owned.length === 0 ? (
            <Col flex="auto">
              <Empty description="No inventories yet. Create your first one!" />
            </Col>
          ) : (
            owned.map((inv: any) => (
              <Col xs={12} sm={8} md={6} key={inv.id}>
                <MiniInventoryCard inv={inv} onDelete={handleDelete} />
              </Col>
            ))
          )}
        </Row>
      )}

      {/* Shared with me */}
      {shared.length > 0 && (
        <>
          <div className="profile-section-header">
            <Title level={4} className="profile-section-title">🤝 Shared with me</Title>
          </div>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '8px 0' } }}>
            {shared.map((inv: any) => (
              <Link to={`/inventory/${inv.id}`} key={inv.id}>
                <div className="shared-item">
                  <div
                    className="shared-item-cover"
                    style={{ ['--card-gradient' as string]: CATEGORY_GRADIENTS[inv.category] || CATEGORY_GRADIENTS.Other }}
                  >
                    {CATEGORY_ICONS[inv.category] || '📦'}
                  </div>
                  <div className="shared-item-info">
                    <span className="shared-item-title">{inv.title}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      by {inv.owner?.name} · {inv._count?.items ?? 0} items · {dayjs(inv.updatedAt).format('MMM D')}
                    </Text>
                  </div>
                  <Tag color={CATEGORY_COLORS[inv.category] || 'default'} style={{ margin: 0 }}>
                    {inv.category}
                  </Tag>
                </div>
              </Link>
            ))}
          </Card>
        </>
      )}

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        title="Create New Inventory"
        onOk={form.submit}
        okText="Create"
        confirmLoading={creating}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input placeholder="e.g. My Book Collection" size="large" autoFocus />
          </Form.Item>

          <Form.Item name="category" label="Category" initialValue="Other">
            <Select
              size="large"
              options={CATEGORIES.map((c) => ({
                value: c,
                label: `${CATEGORY_ICONS[c] || '📦'} ${c}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="isPublic" label="Public" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Public inventories are visible to all users
          </Text>
        </Form>
      </Modal>
    </div>
  )
}
