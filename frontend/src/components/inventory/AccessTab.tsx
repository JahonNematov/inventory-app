import { useState } from 'react'
import { Table, Button, AutoComplete, Avatar, Switch, Popconfirm, message, Space, Typography } from 'antd'
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  useAddAccessMutation,
  useRemoveAccessMutation,
  useSearchUsersQuery,
  useUpdateInventoryMutation,
} from '../../store/api/inventoryApi'

const { Text } = Typography

export function AccessTab({ inventory }: { inventory: any }) {
  const [searchQ, setSearchQ] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { data: userSuggestions } = useSearchUsersQuery(searchQ, { skip: searchQ.length < 2 })
  const [addAccess] = useAddAccessMutation()
  const [removeAccess] = useRemoveAccessMutation()
  const [updateInventory] = useUpdateInventoryMutation()

  const accessList = inventory.access || []

  const handleAdd = async () => {
    if (!selectedUser) return
    try {
      await addAccess({ inventoryId: inventory.id, userId: selectedUser.id }).unwrap()
      setSearchQ('')
      setSelectedUser(null)
      message.success(`${selectedUser.name} added`)
    } catch (err: any) {
      if (err.data?.error === 'ALREADY_EXISTS') message.warning('User already has access')
      else message.error('Failed to add user')
    }
  }

  const handleRemove = async (userId: string, name: string) => {
    try {
      await removeAccess({ inventoryId: inventory.id, userId }).unwrap()
      message.success(`${name} removed`)
    } catch {
      message.error('Failed to remove')
    }
  }

  const togglePublic = async (checked: boolean) => {
    await updateInventory({
      id: inventory.id,
      data: { isPublic: checked, version: inventory.version },
    })
  }

  const columns = [
    {
      title: 'User',
      render: (record: any) => (
        <Space>
          <Avatar src={record.user.avatar} size="small">
            {record.user.name[0]}
          </Avatar>
          <div>
            <div>{record.user.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.user.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '',
      width: 80,
      render: (record: any) => (
        <Popconfirm
          title={`Remove ${record.user.name}'s access?`}
          onConfirm={() => handleRemove(record.userId, record.user.name)}
          okText="Remove"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24, padding: 16, background: '#f0f9ff', borderRadius: 8 }}>
        <Space>
          <Switch defaultChecked={inventory.isPublic} onChange={togglePublic} />
          <div>
            <Text strong>Public Inventory</Text>
            <div>
              <Text type="secondary">Any authenticated user can add/edit items</Text>
            </div>
          </div>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong>Add specific users:</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <AutoComplete
            value={searchQ}
            onChange={setSearchQ}
            onSelect={(val: string, option: any) => setSelectedUser(option.user)}
            placeholder="Search by name or email..."
            style={{ flex: 1 }}
            options={
              userSuggestions?.map((u) => ({
                value: u.name,
                label: (
                  <Space>
                    <Avatar src={u.avatar} size="small">
                      {u.name[0]}
                    </Avatar>
                    {u.name}{' '}
                    <Text type="secondary">({u.email})</Text>
                  </Space>
                ),
                user: u,
              })) || []
            }
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAdd}
            disabled={!selectedUser}
          >
            Add
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={accessList}
        rowKey="userId"
        pagination={false}
        locale={{ emptyText: 'No specific users added. Use Public mode or add users above.' }}
      />
    </div>
  )
}
