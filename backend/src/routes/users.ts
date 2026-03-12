import { Router } from 'express'
import prisma from '../prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/me/inventories', requireAuth, async (req, res) => {
  const [owned, withAccess] = await Promise.all([
    prisma.inventory.findMany({
      where: { ownerId: req.user!.id },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.inventory.findMany({
      where: { access: { some: { userId: req.user!.id } } },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  res.json({ owned, withAccess })
})

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      avatar: true,
      createdAt: true,
      _count: { select: { ownedInventories: true, items: true } },
    },
  })
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json(user)
})

export default router
