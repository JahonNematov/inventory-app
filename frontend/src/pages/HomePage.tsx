import { Row, Col, Card, Tag, Typography, Avatar, Space, Skeleton, Empty } from 'antd'
import { FireOutlined, ClockCircleOutlined, AppstoreOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useGetInventoriesQuery, useGetPopularInventoriesQuery } from '../store/api/inventoryApi'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import './HomePage.css'

const { Title, Text } = Typography

const CATEGORY_COLORS: Record<string, string> = {
  Books: 'blue', Electronics: 'purple', Games: 'green', Art: 'orange',
  Music: 'magenta', Coins: 'gold', Comics: 'volcano', Stamps: 'cyan',
  Equipment: 'geekblue', Other: 'default',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Books:       'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  Electronics: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
  Games:       'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
  Art:         'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
  Music:       'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)',
  Coins:       'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
  Comics:      'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
  Stamps:      'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
  Equipment:   'linear-gradient(135deg, #2f54eb 0%, #1d39c4 100%)',
  Other:       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}

const CATEGORY_ICONS: Record<string, string> = {
  Books: '📚', Electronics: '💻', Games: '🎮', Art: '🎨', Music: '🎵',
  Coins: '🪙', Comics: '🦸', Stamps: '📮', Equipment: '🛠️', Other: '📦',
}

function InventoryCard({ inv }: { inv: any }) {
  const color    = CATEGORY_COLORS[inv.category]    || 'default'
  const gradient = CATEGORY_GRADIENTS[inv.category] || CATEGORY_GRADIENTS.Other
  const icon     = CATEGORY_ICONS[inv.category]     || '📦'

  return (
    <Link to={`/inventory/${inv.id}`} style={{ display: 'block', height: '100%' }}>
      <Card
        hoverable
        className="inv-card"
        styles={{ body: { padding: 16 } }}
        cover={
          inv.imageUrl
            ? <img src={inv.imageUrl} alt={inv.title} className="inv-card-cover-image" />
            : <div className="inv-card-cover-placeholder" style={{ ['--card-gradient' as string]: gradient }}>{icon}</div>
        }
      >
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <div className="inv-card-meta-row">
            <Tag color={color} style={{ margin: 0 }}>{inv.category}</Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <ClockCircleOutlined /> {dayjs(inv.createdAt).format('MMM D, YYYY')}
            </Text>
          </div>

          <Text strong className="inv-card-title">{inv.title}</Text>

          {inv.tags?.length > 0 && (
            <Space size={4} wrap>
              {inv.tags.slice(0, 3).map((t: any) => (
                <Tag key={t.tag.id} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
                  #{t.tag.name}
                </Tag>
              ))}
            </Space>
          )}

          <div className="inv-card-footer">
            <div className="inv-card-owner">
              <Avatar src={inv.owner?.avatar} size={18} icon={<UserOutlined />} />
              <Text type="secondary" style={{ fontSize: 12 }}>{inv.owner?.name}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{inv._count?.items ?? 0} items</Text>
          </div>
        </Space>
      </Card>
    </Link>
  )
}

function InventoryCardSkeleton() {
  return (
    <Card className="inv-card" styles={{ body: { padding: 16 } }}>
      <Skeleton.Image active style={{ width: '100%', height: 130 }} />
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />
    </Card>
  )
}

function PopularItem({ inv, index }: { inv: any; index: number }) {
  const rankClass =
    index === 0 ? 'popular-rank popular-rank-1' :
    index === 1 ? 'popular-rank popular-rank-2' :
    index === 2 ? 'popular-rank popular-rank-3' :
                  'popular-rank popular-rank-n'

  return (
    <Link to={`/inventory/${inv.id}`}>
      <div className="popular-list-item">
        <div className={rankClass}>{index + 1}</div>
        <div className="popular-info">
          <Text strong ellipsis className="popular-title">{inv.title}</Text>
          <Text type="secondary" className="popular-owner">{inv.owner?.name}</Text>
        </div>
        <Text type="secondary" className="popular-count">{inv._count?.items ?? 0} items</Text>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const { t } = useTranslation()
  const { data: inventoriesData, isLoading }             = useGetInventoriesQuery({})
  const { data: popular,         isLoading: popLoading } = useGetPopularInventoriesQuery()

  return (
    <div className="home-page">
      <Row gutter={[24, 24]}>
        {/* Latest Inventories */}
        <Col xs={24} lg={16}>
          <div className="section-header">
            <AppstoreOutlined className="section-icon-purple" />
            <Title level={4} style={{ margin: 0 }}>{t('home.latest_inventories')}</Title>
          </div>

          {isLoading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Col xs={24} sm={12} xl={8} key={i}><InventoryCardSkeleton /></Col>
              ))}
            </Row>
          ) : !inventoriesData?.inventories?.length ? (
            <Empty description={t('home.no_inventories')} />
          ) : (
            <Row gutter={[16, 16]}>
              {inventoriesData.inventories.map((inv: any) => (
                <Col xs={24} sm={12} xl={8} key={inv.id}>
                  <InventoryCard inv={inv} />
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* Popular Sidebar */}
        <Col xs={24} lg={8}>
          <div className="section-header">
            <FireOutlined className="section-icon-red" />
            <Title level={4} style={{ margin: 0 }}>{t('home.top_popular')}</Title>
          </div>

          <Card className="popular-card" styles={{ body: { padding: '8px 0' } }}>
            {popLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} style={{ padding: '8px 16px' }} />
            ) : !popular?.length ? (
              <Empty description={t('home.no_data')} style={{ padding: 24 }} />
            ) : (
              popular.map((inv: any, i: number) => (
                <PopularItem key={inv.id} inv={inv} index={i} />
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
