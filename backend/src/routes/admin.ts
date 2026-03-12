import { Router } from 'express'
import prisma from '../prisma'
import { requireAuth } from '../middleware/requireAuth'
import { requireAdmin } from '../middleware/requireAdmin'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/users', async (req, res) => {
  try {
    const { page = '1', limit = '20', q } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const where = q
      ? {
          OR: [
            { name: { contains: q as string, mode: 'insensitive' as const } },
            { email: { contains: q as string, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          isAdmin: true,
          isBlocked: true,
          createdAt: true,
          _count: { select: { ownedInventories: true, items: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({ users, total })
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.patch('/users/:id', async (req, res) => {
  try {
    const { isBlocked, isAdmin } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked, isAdmin },
      select: { id: true, name: true, email: true, isAdmin: true, isBlocked: true },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

export default router
