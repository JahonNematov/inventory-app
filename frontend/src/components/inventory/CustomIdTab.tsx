import { useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Tag, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useUpdateCustomIdFormatMutation } from '../../store/api/inventoryApi'

const { Text } = Typography

type IdElementType =
  | 'FIXED'
  | 'RANDOM_20BIT'
  | 'RANDOM_32BIT'
  | 'RANDOM_6DIGIT'
  | 'RANDOM_9DIGIT'
  | 'GUID'
  | 'DATETIME'
  | 'SEQUENCE'

interface IdElement {
  id: string
  type: IdElementType
  value?: string
  format?: string
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

function previewElement(el: IdElement): string {
  switch (el.type) {
    case 'FIXED':
      return el.value || '(text)'
    case 'RANDOM_20BIT':
      return formatNum(Math.floor(Math.random() * 1048576), el.format || 'X5')
    case 'RANDOM_32BIT':
      return formatNum(Math.floor(Math.random() * 4294967296), el.format || 'X8')
    case 'RANDOM_6DIGIT':
      return formatNum(Math.floor(Math.random() * 1000000), el.format || 'D6')
    case 'RANDOM_9DIGIT':
      return formatNum(Math.floor(Math.random() * 1000000000), el.format || 'D9')
    case 'GUID':
      return '550e8400-e29b-41d4'
    case 'DATETIME':
      return formatDt(new Date(), el.format || 'yyyy')
    case 'SEQUENCE':
      return formatNum(13, el.format || 'D3')
    default:
      return ''
  }
}

function formatNum(n: number, fmt: string) {
  if (fmt.startsWith('D')) return n.toString().padStart(parseInt(fmt.slice(1)), '0')
  if (fmt.startsWith('X'))
    return n.toString(16).toUpperCase().padStart(parseInt(fmt.slice(1)), '0')
  return n.toString()
}

function formatDt(d: Date, fmt: string) {
  const map: Record<string, string> = {
    yyyy: d.getFullYear().toString(),
    yy: d.getFullYear().toString().slice(-2),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    dd: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    ddd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
  }
  return map[fmt] || fmt
}

const ELEMENT_TYPES: { value: IdElementType; label: string }[] = [
  { value: 'FIXED', label: '📝 Fixed Text' },
  { value: 'RANDOM_20BIT', label: '🎲 20-bit Random' },
  { value: 'RANDOM_32BIT', label: '🎲 32-bit Random' },
  { value: 'RANDOM_6DIGIT', label: '🔢 6-digit Random' },
  { value: 'RANDOM_9DIGIT', label: '🔢 9-digit Random' },
  { value: 'GUID', label: '🆔 GUID' },
  { value: 'DATETIME', label: '📅 Date/Time' },
  { value: 'SEQUENCE', label: '🔢 Sequence' },
]

const FORMAT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  RANDOM_20BIT: [
    { value: 'X5', label: 'X5 — 5-digit hex (A3F2E)' },
    { value: 'D7', label: 'D7 — 7-digit decimal' },
  ],
  RANDOM_32BIT: [
    { value: 'X8', label: 'X8 — 8-digit hex (1A2B3C4D)' },
    { value: 'D10', label: 'D10 — 10-digit decimal' },
  ],
  RANDOM_6DIGIT: [
    { value: 'D6', label: 'D6 — 6 digits (001234)' },
    { value: 'D', label: 'D — no leading zeros' },
  ],
  RANDOM_9DIGIT: [
    { value: 'D9', label: 'D9 — 9 digits' },
    { value: 'D', label: 'D — no leading zeros' },
  ],
  SEQUENCE: [
    { value: 'D3', label: 'D3 — 3 digits (013)' },
    { value: 'D4', label: 'D4 — 4 digits (0013)' },
    { value: 'D', label: 'D — no leading zeros' },
  ],
  DATETIME: [
    { value: 'yyyy', label: 'yyyy — full year (2025)' },
    { value: 'yy', label: 'yy — short year (25)' },
    { value: 'MM', label: 'MM — month (01-12)' },
    { value: 'dd', label: 'dd — day (01-31)' },
    { value: 'ddd', label: 'ddd — day name (Mon)' },
    { value: 'HH', label: 'HH — hour (00-23)' },
  ],
}

function SortableElement({
  el,
  onChange,
  onDelete,
}: {
  el: IdElement
  onChange: (updated: IdElement) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: el.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#e6f7ff' : '#fafafa',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    padding: 12,
    minWidth: 180,
    position: 'relative' as const,
  }

  const formats = FORMAT_OPTIONS[el.type]

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', textAlign: 'center', color: '#999', marginBottom: 8, fontSize: 18 }}
      >
        ⠿
      </div>

      <Tag color="blue" style={{ marginBottom: 8, fontSize: 11 }}>
        {ELEMENT_TYPES.find((t) => t.value === el.type)?.label}
      </Tag>

      {el.type === 'FIXED' && (
        <Input
          size="small"
          value={el.value || ''}
          onChange={(e) => onChange({ ...el, value: e.target.value })}
          placeholder="Enter text (emoji OK)"
          style={{ marginBottom: 8 }}
        />
      )}

      {formats && (
        <Select
          size="small"
          value={el.format || formats[0].value}
          onChange={(val) => onChange({ ...el, format: val })}
          options={formats}
          style={{ width: '100%', marginBottom: 8 }}
        />
      )}

      <code style={{ fontSize: 11, color: '#1890ff', display: 'block', textAlign: 'center' }}>
        → {previewElement(el)}
      </code>

      <Button
        size="small"
        danger
        icon={<DeleteOutlined />}
        onClick={onDelete}
        style={{ position: 'absolute', top: 4, right: 4 }}
      />
    </div>
  )
}

export function CustomIdTab({ inventory }: { inventory: any }) {
  const [elements, setElements] = useState<IdElement[]>(
    inventory.customIdFormat?.elements || []
  )
  const [preview, setPreview] = useState('')
  const [updateFormat] = useUpdateCustomIdFormatMutation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    setPreview(elements.map(previewElement).join('') || '(no elements)')
  }, [elements])

  const handleSave = async () => {
    try {
      await updateFormat({ inventoryId: inventory.id, elements }).unwrap()
      message.success('Custom ID format saved!')
    } catch {
      message.error('Failed to save')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setElements((prev) => {
        const oldIndex = prev.findIndex((e) => e.id === active.id)
        const newIndex = prev.findIndex((e) => e.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const addElement = (type: IdElementType) => {
    if (elements.length >= 10) {
      message.warning('Maximum 10 elements allowed')
      return
    }
    setElements((prev) => [
      ...prev,
      {
        id: genId(),
        type,
        format: FORMAT_OPTIONS[type]?.[0]?.value,
        value: type === 'FIXED' ? '' : undefined,
      },
    ])
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #91d5ff',
          borderRadius: 8,
          padding: '16px 24px',
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        <Text type="secondary">Example ID:</Text>
        <br />
        <code style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{preview}</code>
        <br />
        <Button
          size="small"
          onClick={() => setPreview(elements.map(previewElement).join('') || '(empty)')}
          style={{ marginTop: 8 }}
        >
          🔄 Regenerate Preview
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={elements.map((e) => e.id)} strategy={horizontalListSortingStrategy}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              minHeight: 80,
              padding: 12,
              background: '#fafafa',
              borderRadius: 8,
              border: '1px dashed #d9d9d9',
              marginBottom: 16,
            }}
          >
            {elements.length === 0 && (
              <Text type="secondary" style={{ margin: 'auto' }}>
                Add elements below to build your Custom ID format
              </Text>
            )}
            {elements.map((el) => (
              <SortableElement
                key={el.id}
                el={el}
                onChange={(updated) =>
                  setElements((prev) => prev.map((e) => (e.id === el.id ? updated : e)))
                }
                onDelete={() => setElements((prev) => prev.filter((e) => e.id !== el.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div style={{ marginBottom: 16 }}>
        <Text strong>Add element:</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {ELEMENT_TYPES.map((t) => (
            <Button
              key={t.value}
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addElement(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: '#fffbf0',
          border: '1px solid #ffe58f',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <Text strong>💡 Tips:</Text>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>
            <strong>Drag</strong> elements to reorder them
          </li>
          <li>
            <strong>Fixed text</strong> can include Unicode emoji (📚, ✅, etc.)
          </li>
          <li>
            <strong>Sequence</strong> auto-increments with each new item
          </li>
          <li>
            <strong>GUID</strong> is globally unique — no conflicts possible
          </li>
          <li>
            Format <code>D4</code> = 4 digits with leading zeros (0042)
          </li>
          <li>
            Format <code>X5</code> = 5 hex digits (1A3F2)
          </li>
        </ul>
      </div>

      <Button type="primary" onClick={handleSave} size="large">
        💾 Save Custom ID Format
      </Button>
    </div>
  )
}
