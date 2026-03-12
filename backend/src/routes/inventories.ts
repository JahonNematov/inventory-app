import { Router, Request, Response } from 'express'
import prisma from '../prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

// ─── GET /api/inventories ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 12
    const skip = (page - 1) * limit

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          tags: { include: { tag: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.inventory.count(),
    ])

    res.json({ inventories, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── GET /api/inventories/popular ────────────────────────
router.get('/popular', async (req, res) => {
  try {
    const inventories = await prisma.inventory.findMany({
      take: 5,
      orderBy: { items: { _count: 'desc' } },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { items: true } },
      },
    })
    res.json(inventories)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── GET /api/inventories/:id ────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        fields: { orderBy: { order: 'asc' } },
        customIdFormat: true,
        access: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
        _count: { select: { items: true } },
      },
    })
    if (!inventory) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(inventory)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── POST /api/inventories ───────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, imageUrl, isPublic, tags } = req.body

    const inventory = await prisma.inventory.create({
      data: {
        title,
        description,
        category: category || 'Other',
        imageUrl,
        isPublic: isPublic || false,
        ownerId: req.user!.id,
        tags: {
          create: (tags || []).map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName.toLowerCase() },
                create: { name: tagName.toLowerCase() },
              },
            },
          })),
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
      },
    })

    res.status(201).json(inventory)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── PATCH /api/inventories/:id ──────────────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { version, title, description, category, imageUrl, isPublic, tags } = req.body
    const userId = req.user!.id

    const existing = await prisma.inventory.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND' })
    if (existing.ownerId !== userId && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }

    const updated = await prisma.inventory.updateMany({
      where: { id: req.params.id, version },
      data: {
        title,
        description,
        category,
        imageUrl,
        isPublic,
        version: { increment: 1 },
      },
    })

    if (updated.count === 0) {
      return res.status(409).json({
        error: 'VERSION_CONFLICT',
        message: 'Inventory was modified by someone else. Please refresh.',
      })
    }

    if (tags !== undefined) {
      await prisma.inventoryTag.deleteMany({ where: { inventoryId: req.params.id } })
      await prisma.inventoryTag.createMany({
        data: await Promise.all(
          (tags as string[]).map(async (tagName: string) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName.toLowerCase() },
              update: {},
              create: { name: tagName.toLowerCase() },
            })
            return { inventoryId: req.params.id, tagId: tag.id }
          })
        ),
      })
    }

    const result = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: { tags: { include: { tag: true } } },
    })

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── DELETE /api/inventories/:id ─────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findUnique({ where: { id: req.params.id } })
    if (!inventory) return res.status(404).json({ error: 'NOT_FOUND' })
    if (inventory.ownerId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }
    await prisma.inventory.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── FIELDS ───────────────────────────────────────────────

router.get('/:id/fields', async (req, res) => {
  const fields = await prisma.field.findMany({
    where: { inventoryId: req.params.id },
    orderBy: { order: 'asc' },
  })
  res.json(fields)
})

router.post('/:id/fields', requireAuth, async (req, res) => {
  try {
    const inventory = await prisma.inventory.findUnique({ where: { id: req.params.id } })
    if (!inventory) return res.status(404).json({ error: 'NOT_FOUND' })
    if (inventory.ownerId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }

    const { title, description, type, showInTable, order } = req.body

    const existingCount = await prisma.field.count({
      where: { inventoryId: req.params.id, type },
    })
    if (existingCount >= 3) {
      return res.status(400).json({
        error: 'MAX_FIELDS',
        message: `Maximum 3 ${type} fields allowed`,
      })
    }

    const field = await prisma.field.create({
      data: { inventoryId: req.params.id, title, description, type, showInTable, order },
    })

    res.status(201).json(field)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.patch('/:id/fields/:fieldId', requireAuth, async (req, res) => {
  try {
    const field = await prisma.field.update({
      where: { id: req.params.fieldId },
      data: req.body,
    })
    res.json(field)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.delete('/:id/fields/:fieldId', requireAuth, async (req, res) => {
  await prisma.field.delete({ where: { id: req.params.fieldId } })
  res.json({ success: true })
})

router.put('/:id/fields/reorder', requireAuth, async (req, res) => {
  const { orderedIds } = req.body as { orderedIds: string[] }
  await Promise.all(
    orderedIds.map((fieldId, index) =>
      prisma.field.update({ where: { id: fieldId }, data: { order: index } })
    )
  )
  res.json({ success: true })
})

// ─── ACCESS CONTROL ───────────────────────────────────────

router.post('/:id/access', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body
    await prisma.inventoryAccess.create({
      data: { userId, inventoryId: req.params.id },
    })
    res.status(201).json({ success: true })
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'ALREADY_EXISTS' })
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.delete('/:id/access/:userId', requireAuth, async (req, res) => {
  await prisma.inventoryAccess.delete({
    where: {
      userId_inventoryId: {
        userId: req.params.userId,
        inventoryId: req.params.id,
      },
    },
  })
  res.json({ success: true })
})

// ─── CUSTOM ID FORMAT ─────────────────────────────────────

router.put('/:id/custom-id', requireAuth, async (req, res) => {
  try {
    const { elements } = req.body
    const format = await prisma.customIdFormat.upsert({
      where: { inventoryId: req.params.id },
      update: { elements },
      create: { inventoryId: req.params.id, elements },
    })
    res.json(format)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── COMMENTS ─────────────────────────────────────────────

router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { inventoryId: req.params.id },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  })
  res.json(comments)
})

router.post('/:id/comments', requireAuth, async (req, res) => {
  const comment = await prisma.comment.create({
    data: {
      text: req.body.text,
      inventoryId: req.params.id,
      userId: req.user!.id,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })
  res.status(201).json(comment)
})

// ─── STATISTICS ───────────────────────────────────────────

router.get('/:id/stats', async (req, res) => {
  try {
    const fields = await prisma.field.findMany({ where: { inventoryId: req.params.id } })

    const stats: any = {
      totalItems: await prisma.item.count({ where: { inventoryId: req.params.id } }),
      fields: {},
    }

    for (const field of fields) {
      if (field.type === 'NUMBER') {
        const result = await prisma.itemFieldValue.aggregate({
          where: { fieldId: field.id, valueNum: { not: null } },
          _avg: { valueNum: true },
          _min: { valueNum: true },
          _max: { valueNum: true },
          _count: { valueNum: true },
        })
        stats.fields[field.id] = { title: field.title, type: 'NUMBER', ...result }
      }

      if (field.type === 'STRING') {
        const values = await prisma.itemFieldValue.groupBy({
          by: ['valueStr'],
          where: { fieldId: field.id, valueStr: { not: null } },
          _count: { valueStr: true },
          orderBy: { _count: { valueStr: 'desc' } },
          take: 5,
        })
        stats.fields[field.id] = { title: field.title, type: 'STRING', topValues: values }
      }
    }

    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

export default router
