import { Form, Input, InputNumber, Switch, Button, Alert } from 'antd'
import { useState } from 'react'
import { useCreateItemMutation, useUpdateItemMutation } from '../../store/api/inventoryApi'
import { message } from 'antd'

interface Props {
  inventory: any
  item?: any
  onSuccess: () => void
}

export function ItemForm({ inventory, item, onSuccess }: Props) {
  const [form] = Form.useForm()
  const [createItem] = useCreateItemMutation()
  const [updateItem] = useUpdateItemMutation()
  const [idConflict, setIdConflict] = useState(false)

  const isEdit = !!item

  const handleSubmit = async (values: any) => {
    setIdConflict(false)

    const fieldValues = inventory.fields?.map((field: any) => ({
      fieldId: field.id,
      valueStr:
        field.type === 'STRING' || field.type === 'TEXT' || field.type === 'LINK'
          ? values[`field_${field.id}`] || null
          : null,
      valueNum: field.type === 'NUMBER' ? values[`field_${field.id}`] ?? null : null,
      valueBool: field.type === 'BOOLEAN' ? values[`field_${field.id}`] ?? false : null,
    }))

    try {
      if (isEdit) {
        await updateItem({
          id: item.id,
          data: { version: item.version, customId: values.customId, fieldValues },
        }).unwrap()
        message.success('Item updated')
      } else {
        await createItem({
          inventoryId: inventory.id,
          customId: values.customId || undefined,
          fieldValues,
        }).unwrap()
        message.success('Item added')
      }
      onSuccess()
    } catch (err: any) {
      if (err.data?.error === 'ID_CONFLICT') {
        setIdConflict(true)
      } else if (err.data?.error === 'VERSION_CONFLICT') {
        message.error('Item was modified by someone else. Please refresh and try again.')
      } else {
        message.error('Failed to save item')
      }
    }
  }

  const initialValues: any = {}
  if (item) {
    initialValues.customId = item.customId
    item.fieldValues?.forEach((fv: any) => {
      if (fv.valueBool !== null && fv.valueBool !== undefined)
        initialValues[`field_${fv.fieldId}`] = fv.valueBool
      else if (fv.valueNum !== null && fv.valueNum !== undefined)
        initialValues[`field_${fv.fieldId}`] = fv.valueNum
      else initialValues[`field_${fv.fieldId}`] = fv.valueStr
    })
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>
      <Form.Item
        name="customId"
        label="Custom ID"
        validateStatus={idConflict ? 'error' : undefined}
        help={
          idConflict
            ? '⚠️ This ID already exists! Please change it.'
            : isEdit
              ? 'Edit ID carefully — must be unique within this inventory'
              : 'Leave empty to auto-generate'
        }
      >
        <Input placeholder="Leave empty for auto-generated ID" />
      </Form.Item>

      {idConflict && (
        <Alert
          type="error"
          message="ID Conflict"
          description="The Custom ID already exists in this inventory. Please enter a unique ID manually."
          style={{ marginBottom: 16 }}
        />
      )}

      {inventory.fields?.map((field: any) => (
        <Form.Item
          key={field.id}
          name={`field_${field.id}`}
          label={field.title}
          tooltip={field.description}
          valuePropName={field.type === 'BOOLEAN' ? 'checked' : 'value'}
        >
          {field.type === 'STRING' && <Input />}
          {field.type === 'TEXT' && <Input.TextArea rows={3} />}
          {field.type === 'NUMBER' && <InputNumber style={{ width: '100%' }} />}
          {field.type === 'LINK' && <Input placeholder="https://..." />}
          {field.type === 'BOOLEAN' && <Switch />}
        </Form.Item>
      ))}

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          {isEdit ? 'Update Item' : 'Add Item'}
        </Button>
      </Form.Item>
    </Form>
  )
}
