import { useParams } from 'react-router-dom'
import { Card, Checkbox, Button, Spin, Typography, Space, Avatar, Divider } from 'antd'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useGetItemQuery, useGetInventoryQuery, useToggleLikeMutation } from '../store/api/inventoryApi'
import { useAuth } from '../hooks/useAuth'
import ReactMarkdown from 'react-markdown'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function ItemPage() {
  const { inventoryId, itemId } = useParams()
  const { isAuthenticated } = useAuth()
  const { data: item, isLoading } = useGetItemQuery(itemId!)
  const { data: inventory } = useGetInventoryQuery(inventoryId!)
  const [toggleLike] = useToggleLikeMutation()

  if (isLoading) return <Spin fullscreen />
  if (!item) return <div>Item not found</div>

  const renderValue = (field: any, fv: any) => {
    if (!fv) return '—'
    if (field.type === 'BOOLEAN') return <Checkbox checked={fv.valueBool} disabled />
    if (field.type === 'LINK')
      return fv.valueStr ? (
        <a href={fv.valueStr} target="_blank" rel="noreferrer">
          {fv.valueStr}
        </a>
      ) : (
        '—'
      )
    if (field.type === 'TEXT') return <ReactMarkdown>{fv.valueStr || ''}</ReactMarkdown>
    return fv.valueStr || fv.valueNum?.toString() || '—'
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              <code>{item.customId}</code>
            </Title>
            <Space>
              {isAuthenticated ? (
                <Button
                  icon={
                    item._liked ? (
                      <HeartFilled style={{ color: 'red' }} />
                    ) : (
                      <HeartOutlined />
                    )
                  }
                  onClick={() => toggleLike(itemId!)}
                >
                  {item._count?.likes || 0} Likes
                </Button>
              ) : (
                <Text type="secondary">❤️ {item._count?.likes || 0}</Text>
              )}
            </Space>
          </div>

          <Divider />

          <Space style={{ marginBottom: 8 }}>
            <Avatar src={item.createdBy?.avatar} size="small" />
            <Text type="secondary">
              Created by <strong>{item.createdBy?.name}</strong>
            </Text>
            <Text type="secondary">
              · {dayjs(item.createdAt).format('MMM D, YYYY HH:mm')}
            </Text>
          </Space>
        </div>

        {inventory?.fields?.map((field: any) => {
          const fv = item.fieldValues?.find((v: any) => v.fieldId === field.id)
          return (
            <div key={field.id} style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {field.title}
              </Text>
              <div style={{ marginTop: 4 }}>{renderValue(field, fv)}</div>
              <Divider style={{ margin: '12px 0' }} />
            </div>
          )
        })}
      </Card>
    </div>
  )
}
