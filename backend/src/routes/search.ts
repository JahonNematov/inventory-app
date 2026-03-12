import { Router } from 'express'
import prisma from '../prisma'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || (q as string).trim().length < 2) {
      return res.json({ inventories: [], items: [] })
    }

    const query = (q as string).trim()

    try {
      const [inventories, items] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT i.id, i.title, i.description, i."createdAt",
                 u.name as "ownerName", u.avatar as "ownerAvatar",
                 ts_rank(i."searchVector", to_tsquery('english', ${query + ':*'})) as rank
          FROM "Inventory" i
          JOIN "User" u ON u.id = i."ownerId"
          WHERE i."searchVector" @@ to_tsquery('english', ${query + ':*'})
          ORDER BY rank DESC
          LIMIT 10
        `,
        prisma.$queryRaw<any[]>`
          SELECT it.id, it."customId", it."inventoryId", it."createdAt",
                 inv.title as "inventoryTitle"
          FROM "Item" it
          JOIN "Inventory" inv ON inv.id = it."inventoryId"
          WHERE it."searchVector" @@ to_tsquery('english', ${query + ':*'})
          ORDER BY it."createdAt" DESC
          LIMIT 10
        `,
      ])
      res.json({ inventories, items })
    } catch {
      // Fallback: ILIKE
      const inventories = await prisma.inventory.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { owner: { select: { id: true, name: true, avatar: true } } },
      })
      res.json({ inventories, items: [] })
    }
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.get('/tags', async (req, res) => {
  const { q } = req.query
  const tags = await prisma.tag.findMany({
    where: { name: { startsWith: (q as string) || '', mode: 'insensitive' } },
    take: 10,
    select: { name: true },
  })
  res.json(tags.map((t: { name: string }) => t.name))
})

router.get('/users', async (req, res) => {
  const { q } = req.query
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    take: 5,
    select: { id: true, name: true, email: true, avatar: true },
  })
  res.json(users)
})

export default router
