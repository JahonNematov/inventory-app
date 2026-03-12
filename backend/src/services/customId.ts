import prisma from '../prisma'
import { IdElement } from '../types'

export async function generateCustomId(inventory: any): Promise<string> {
  if (!inventory.customIdFormat || !inventory.customIdFormat.elements) {
    return randomHex(8)
  }

  const elements = inventory.customIdFormat.elements as IdElement[]
  if (elements.length === 0) {
    return randomHex(8)
  }

  let result = ''

  for (const el of elements) {
    switch (el.type) {
      case 'FIXED':
        result += el.value || ''
        break

      case 'RANDOM_20BIT': {
        const n = Math.floor(Math.random() * 1048576)
        result += formatNumber(n, el.format || 'X5')
        break
      }

      case 'RANDOM_32BIT': {
        const n = Math.floor(Math.random() * 4294967296)
        result += formatNumber(n, el.format || 'X8')
        break
      }

      case 'RANDOM_6DIGIT': {
        const n = Math.floor(Math.random() * 1000000)
        result += formatNumber(n, el.format || 'D6')
        break
      }

      case 'RANDOM_9DIGIT': {
        const n = Math.floor(Math.random() * 1000000000)
        result += formatNumber(n, el.format || 'D9')
        break
      }

      case 'GUID':
        result += crypto.randomUUID()
        break

      case 'DATETIME':
        result += formatDate(new Date(), el.format || 'yyyy')
        break

      case 'SEQUENCE': {
        const count = await prisma.item.count({ where: { inventoryId: inventory.id } })
        result += formatNumber(count + 1, el.format || 'D3')
        break
      }
    }
  }

  return result
}

function randomHex(digits: number): string {
  return Math.floor(Math.random() * Math.pow(16, digits))
    .toString(16)
    .toUpperCase()
    .padStart(digits, '0')
}

function formatNumber(n: number, format: string): string {
  if (format.startsWith('D')) {
    const digits = parseInt(format.slice(1)) || 1
    return n.toString().padStart(digits, '0')
  }
  if (format.startsWith('X')) {
    const digits = parseInt(format.slice(1)) || 1
    return n.toString(16).toUpperCase().padStart(digits, '0')
  }
  return n.toString()
}

function formatDate(date: Date, format: string): string {
  const map: Record<string, string> = {
    yyyy: date.getFullYear().toString(),
    yy: date.getFullYear().toString().slice(-2),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    dd: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
    ddd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
  }
  return map[format] || format
}
