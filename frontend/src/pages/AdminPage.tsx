import { useState } from 'react'
import { Table, Button, Switch, Popconfirm, message, Input, Space, Tag, Avatar } from 'antd'
import { useGetAdminUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from '../store/api/inventoryApi'
import { useAuth } from '../hooks/useAuth'
import dayjs from 'dayjs'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useGetAdminUsersQuery({ page, q: search })
  const [updateUser] = useUpdateUserMutation()
  const [deleteUser] = useDeleteUserMutation()

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await updateUser({ id: userId, data: { isBlocked: !isBlocked } }).unwrap()
      message.success(!isBlocked ? 'User blocked' : 'User unblocked')
    } catch {
      message.error('Failed to update user')
    }
  }

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateUser({ id: userId, data: { isAdmin: !isAdmin } }).unwrap()
      message.success(!isAdmin ? 'Admin role granted' : 'Admin role removed')
    } catch {
      message.error('Failed to update user')
    }
  }

  const handleDelete = async (userId: string, name: string) => {
    try {
      await deleteUser(userId).unwrap()
      message.success(`${name} deleted`)
    } catch {
      message.error('Failed to delete user')
    }
  }

  const columns = [
    {
      title: 'User',
      render: (r: any) => (
        <Space>
          <Avatar src={r.avatar} size="small">
            {r.name[0]}
          </Avatar>
          <div>
            <div>{r.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      render: (r: any) => (
        <Space>
          {r.isAdmin && <Tag color="red">Admin</Tag>}
          {r.isBlocked && <Tag color="orange">Blocked</Tag>}
          {!r.isAdmin && !r.isBlocked && <Tag color="green">User</Tag>}
        </Space>
      ),
    },
    {
      title: 'Inventories',
      render: (r: any) => r._count?.ownedInventories || 0,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
    },
    {
      title: 'Blocked',
      render: (r: any) => (
        <Switch
          checked={r.isBlocked}
          onChange={() => handleToggleBlock(r.id, r.isBlocked)}
          checkedChildren="Blocked"
          unCheckedChildren="Active"
          disabled={r.id === currentUser?.id}
        />
      ),
    },
    {
      title: 'Admin',
      render: (r: any) => (
        <Switch
          checked={r.isAdmin}
          onChange={() => handleToggleAdmin(r.id, r.isAdmin)}
        />
      ),
    },
    {
      title: '',
      width: 80,
      render: (r: any) =>
        r.id !== currentUser?.id ? (
          <Popconfirm
            title={`Delete ${r.name}'s account?`}
            onConfirm={() => handleDelete(r.id, r.name)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        ) : (
          <Tag>You</Tag>
        ),
    },
  ]

  return (
    <div>
      <h2>👨‍💼 Admin Panel — User Management</h2>

      <Input.Search
        placeholder="Search users by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
        allowClear
      />

      <Table
        columns={columns}
        dataSource={data?.users || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: data?.total,
          pageSize: 20,
          current: page,
          onChange: setPage,
        }}
      />
    </div>
  )
}
