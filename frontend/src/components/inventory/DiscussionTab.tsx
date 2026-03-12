import { useEffect, useRef, useState } from 'react'
import { List, Avatar, Button, Input, Typography, Space } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { useGetCommentsQuery, useAddCommentMutation } from '../../store/api/inventoryApi'
import { useAuth } from '../../hooks/useAuth'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Text } = Typography

export function DiscussionTab({ inventoryId }: { inventoryId: string }) {
  const { isAuthenticated } = useAuth()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: comments } = useGetCommentsQuery(inventoryId, { pollingInterval: 5000 })
  const [addComment, { isLoading }] = useAddCommentMutation()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments?.length])

  const handleSend = async () => {
    if (!text.trim()) return
    try {
      await addComment({ inventoryId, text: text.trim() }).unwrap()
      setText('')
    } catch {}
  }

  return (
    <div style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        <List
          dataSource={comments || []}
          renderItem={(comment: any) => (
            <List.Item style={{ border: 'none', padding: '8px 0' }}>
              <List.Item.Meta
                avatar={<Avatar src={comment.user.avatar}>{comment.user.name[0]}</Avatar>}
                title={
                  <Space>
                    <Text strong>{comment.user.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(comment.createdAt).fromNow()}
                    </Text>
                  </Space>
                }
                description={
                  <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: 8 }}>
                    <ReactMarkdown>{comment.text}</ReactMarkdown>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No comments yet. Be the first!' }}
        />
        <div ref={bottomRef} />
      </div>

      {isAuthenticated ? (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 8 }}>
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment... (Markdown supported)"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
            style={{ marginTop: 8 }}
          >
            Send (Ctrl+Enter)
          </Button>
        </div>
      ) : (
        <Text type="secondary">Sign in to leave a comment</Text>
      )}
    </div>
  )
}
