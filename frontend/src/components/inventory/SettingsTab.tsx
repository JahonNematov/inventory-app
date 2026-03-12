import { useCallback, useRef, useState } from 'react'
import { Form, Input, Select, Switch, Typography, message } from 'antd'
import { useUpdateInventoryMutation, useSearchTagsQuery } from '../../store/api/inventoryApi'

const { Text } = Typography

const CATEGORIES = ['Equipment', 'Furniture', 'Books', 'Documents', 'Electronics', 'Other']

export function SettingsTab({ inventory }: { inventory: any }) {
  const [form] = Form.useForm()
  const [updateInventory] = useUpdateInventoryMutation()
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'conflict'>('idle')
  const [tagSearch, setTagSearch] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { data: tagSuggestions } = useSearchTagsQuery(tagSearch, { skip: tagSearch.length < 1 })

  const handleValuesChange = useCallback(
    (_: any, all: any) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        setSaving('saving')
        try {
          await updateInventory({
            id: inventory.id,
            data: { ...all, version: inventory.version },
          }).unwrap()
          setSaving('saved')
          setTimeout(() => setSaving('idle'), 3000)
        } catch (err: any) {
          if (err.data?.error === 'VERSION_CONFLICT') {
            setSaving('conflict')
            message.warning('Conflict! Someone else edited this inventory. Please refresh.')
          }
        }
      }, 8000)
    },
    [inventory.id, inventory.version, updateInventory]
  )

  const initialValues = {
    title: inventory.title,
    description: inventory.description,
    category: inventory.category,
    isPublic: inventory.isPublic,
    tags: inventory.tags?.map((t: any) => t.tag.name) || [],
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        {saving === 'saving' && <Text type="secondary">⏳ Saving...</Text>}
        {saving === 'saved' && <Text type="success">✅ All changes saved</Text>}
        {saving === 'conflict' && <Text type="danger">⚠️ Conflict! Please refresh</Text>}
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input size="large" />
        </Form.Item>

        <Form.Item name="description" label="Description (Markdown)">
          <Input.TextArea rows={6} placeholder="## My Inventory&#10;Supports **markdown**" />
        </Form.Item>

        <Form.Item name="category" label="Category">
          <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>

        <Form.Item name="tags" label="Tags">
          <Select
            mode="tags"
            placeholder="Add tags..."
            onSearch={setTagSearch}
            options={tagSuggestions?.map((t) => ({ value: t, label: t })) || []}
            tokenSeparators={[',']}
          />
        </Form.Item>

        <Form.Item
          name="isPublic"
          label="Public (any authenticated user can add items)"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </div>
  )
}
