import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventory.app' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@inventory.app',
      isAdmin: true,
    },
  })

  const inventory = await prisma.inventory.create({
    data: {
      title: 'Office Equipment',
      description: '## Office Equipment Inventory\nAll office equipment tracked here.',
      category: 'Equipment',
      ownerId: admin.id,
      isPublic: true,
      tags: {
        create: [
          { tag: { connectOrCreate: { where: { name: 'office' }, create: { name: 'office' } } } },
          { tag: { connectOrCreate: { where: { name: 'equipment' }, create: { name: 'equipment' } } } },
        ],
      },
      fields: {
        create: [
          { title: 'Model', type: 'STRING', showInTable: true, order: 0 },
          { title: 'Price ($)', type: 'NUMBER', showInTable: true, order: 1 },
          { title: 'Notes', type: 'TEXT', showInTable: false, order: 2 },
          { title: 'Available', type: 'BOOLEAN', showInTable: true, order: 3 },
        ],
      },
    },
  })

  console.log('✅ Seed completed:', { admin: admin.email, inventory: inventory.title })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
