import { useState } from 'react'
import { Button, Form, Input, Select, Switch, Popconfirm, message, Modal, Tag, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useCreateFieldMutation,
  useDeleteFieldMutation,
  useUpdateFieldMutation,
  useReorderFieldsMutation,
} from '../../store/api/inventoryApi'

const { Text } = Typography

const FIELD_TYPES = [
  { value: 'STRING', label: '📝 Single-line text', color: 'blue' },
  { value: 'TEXT', label: '📄 Multi-line text', color: 'cyan' },
  { value: 'NUMBER', label: '🔢 Number', color: 'green' },
  { value: 'LINK', label: '🔗 Link (URL)', color: 'purple' },
  { value: 'BOOLEAN', label: '✅ Boolean (checkbox)', color: 'orange' },
]

const MAX_PER_TYPE = 3

function DraggableRow({ field, onDelete, onUpdate }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeInfo = FIELD_TYPES.find((t) => t.value === field.type)

  return (
    <tr ref={setNodeRef} style={style}>
      <td
        style={{ cursor: 'grab', padding: '8px 12px', color: '#999' }}
        {...attributes}
        {...listeners}
      >
        ⠿
      </td>
      <td style={{ padding: '8px 12px' }}>
        <strong>{field.title}</strong>
        {field.description && (
          <div style={{ color: '#999', fontSize: 12 }}>{field.description}</div>
        )}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <Tag color={typeInfo?.color}>{typeInfo?.label}</Tag>
      </td>
      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
        <Switch
          checked={field.showInTable}
          onChange={(checked) => onUpdate(field.id, { showInTable: checked })}
          size="small"
        />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <Popconfirm
          title="Delete this field? All item values for this field will also be deleted."
          onConfirm={() => onDelete(field.id)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      </td>
    </tr>
  )
}

export function FieldsTab({ inventory }: { inventory: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [fields, setFields] = useState<any[]>(inventory.fields || [])

  const [createField] = useCreateFieldMutation()
  const [deleteField] = useDeleteFieldMutation()
  const [updateField] = useUpdateFieldMutation()
  const [reorderFields] = useReorderFieldsMutation()

  const sensors = useSensors(useSensor(PointerSensor))

  const countByType = (type: string) => fields.filter((f) => f.type === type).length

  const handleAddField = async (values: any) => {
    if (countByType(values.type) >= MAX_PER_TYPE) {
      message.error(`Maximum ${MAX_PER_TYPE} ${values.type} fields allowed`)
      return
    }
    try {
      const newField = await createField({
        inventoryId: inventory.id,
        data: { ...values, order: fields.length },
      }).unwrap()
      setFields((prev) => [...prev, newField])
      setIsModalOpen(false)
      form.resetFields()
      message.success('Field added')
    } catch (err: any) {
      message.error(err.data?.message || 'Failed to add field')
    }
  }

  const handleDelete = async (fieldId: string) => {
    try {
      await deleteField({ inventoryId: inventory.id, fieldId }).unwrap()
      setFields((prev) => prev.filter((f) => f.id !== fieldId))
      message.success('Field deleted')
    } catch {
      message.error('Failed to delete')
    }
  }

  const handleUpdate = async (fieldId: string, data: any) => {
    try {
      await updateField({ inventoryId: inventory.id, fieldId, data }).unwrap()
      setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...data } : f)))
    } catch {
      message.error('Failed to update')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    const reordered = arrayMove(fields, oldIndex, newIndex)
    setFields(reordered)

    await reorderFields({
      inventoryId: inventory.id,
      orderedIds: reordered.map((f) => f.id),
    })
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FIELD_TYPES.map((t) => (
          <Tag key={t.value} color={countByType(t.value) >= MAX_PER_TYPE ? 'red' : t.color}>
            {t.label}: {countByType(t.value)}/{MAX_PER_TYPE}
          </Tag>
        ))}
      </div>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: 16 }}
      >
        Add Field
      </Button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '8px 12px', width: 40 }}></th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Field</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Show in table</th>
                <th style={{ padding: '8px 12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <DraggableRow
                  key={field.id}
                  field={field}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  inventoryId={inventory.id}
                />
              ))}
              {fields.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: 32, color: '#999' }}
                  >
                    No custom fields yet. Add your first field!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title="Add Custom Field"
        onOk={form.submit}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddField}>
          <Form.Item name="title" label="Field Title" rules={[{ required: true }]}>
            <Input placeholder="e.g., Model, Price, Author" />
          </Form.Item>

          <Form.Item name="type" label="Field Type" rules={[{ required: true }]}>
            <Select
              options={FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Description (shown as tooltip)">
            <Input placeholder="Help text for users filling this field" />
          </Form.Item>

          <Form.Item
            name="showInTable"
            label="Show in items table"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
