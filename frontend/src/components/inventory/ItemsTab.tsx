import { useState } from 'react'
import { Table, Button, Popconfirm, message, Checkbox, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useGetItemsQuery, useDeleteItemMutation } from '../../store/api/inventoryApi'
import { ItemForm } from './ItemForm'
import dayjs from 'dayjs'

interface Props {
  inventory: any
  canWrite: boolean
  isOwner: boolean
}

export function ItemsTab({ inventory, canWrite, isOwner }: Props) {
  const navigate = useNavigate()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useGetItemsQuery({ inventoryId: inventory.id, page })
  const [deleteItem] = useDeleteItemMutation()

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedRowKeys.map((id) => deleteItem(id).unwrap()))
      setSelectedRowKeys([])
      message.success(`${selectedRowKeys.length} items deleted`)
    } catch {
      message.error('Failed to delete some items')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'customId',
      width: 160,
      render: (id: string, record: any) => (
        <Link to={`/inventory/${inventory.id}/item/${record.id}`}>
          <code style={{ fontWeight: 700 }}>{id}</code>
        </Link>
      ),
    },
    ...((inventory.fields || [])
      .filter((f: any) => f.showInTable)
      .map((field: any) => ({
        title: field.title,
        key: field.id,
        render: (_: any, record: any) => {
          const fv = record.fieldValues?.find((v: any) => v.fieldId === field.id)
          if (!fv) return '-'
          if (field.type === 'BOOLEAN') return <Checkbox checked={fv.valueBool} disabled />
          if (field.type === 'LINK')
            return fv.valueStr ? (
              <a href={fv.valueStr} target="_blank" rel="noreferrer">
                🔗 Link
              </a>
            ) : (
              '-'
            )
          return fv.valueStr || fv.valueNum?.toString() || '-'
        },
      }))),
    {
      title: 'Created by',
      render: (record: any) => record.createdBy?.name || '-',
      width: 120,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('MMM D, YYYY'),
      width: 110,
    },
    {
      title: 'Likes',
      render: (record: any) => `❤️ ${record._count?.likes || 0}`,
      width: 80,
    },
  ]

  return (
    <div>
      {canWrite && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}
          >
            Add Item
          </Button>

          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Delete ${selectedRowKeys.length} selected items?`}
              onConfirm={handleDeleteSelected}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete Selected ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        rowSelection={
          canWrite
            ? {
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as string[]),
              }
            : undefined
        }
        onRow={(record) => ({
          onClick: (e) => {
            if ((e.target as HTMLElement).closest('a, input, button, .ant-checkbox')) return
            if (canWrite) {
              setEditingItem(record)
              setIsFormOpen(true)
            } else {
              navigate(`/inventory/${inventory.id}/item/${record.id}`)
            }
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{
          total: data?.total,
          pageSize: 20,
          current: page,
          onChange: setPage,
        }}
      />

      <Modal
        open={isFormOpen}
        onCancel={() => {
          setIsFormOpen(false)
          setEditingItem(null)
        }}
        footer={null}
        title={editingItem ? 'Edit Item' : 'Add Item'}
        width={600}
        destroyOnClose
      >
        <ItemForm
          inventory={inventory}
          item={editingItem}
          onSuccess={() => {
            setIsFormOpen(false)
            setEditingItem(null)
          }}
        />
      </Modal>
    </div>
  )
}
