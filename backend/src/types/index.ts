import { User, Inventory, Item, Field } from '@prisma/client'

declare global {
  namespace Express {
    interface User {
      id: string
      name: string
      email: string
      avatar?: string | null
      isAdmin: boolean
      isBlocked: boolean
    }
  }
}

export interface IdElement {
  id: string
  type: IdElementType
  value?: string
  format?: string
}

export type IdElementType =
  | 'FIXED'
  | 'RANDOM_20BIT'
  | 'RANDOM_32BIT'
  | 'RANDOM_6DIGIT'
  | 'RANDOM_9DIGIT'
  | 'GUID'
  | 'DATETIME'
  | 'SEQUENCE'

export type InventoryWithDetails = Inventory & {
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
  tags: { tag: { name: string } }[]
  _count: { items: number }
  fields: Field[]
}

export type ItemWithValues = Item & {
  fieldValues: {
    field: Field
    valueStr: string | null
    valueNum: number | null
    valueBool: boolean | null
  }[]
  createdBy: Pick<User, 'id' | 'name' | 'avatar'>
  _count: { likes: number }
}
