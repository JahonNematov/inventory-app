import { Router } from 'express'
import prisma from '../prisma'
import { requireAuth } from '../middleware/requireAuth'
import { generateCustomId } from '../services/customId'

const router = Router()

// ─── GET /api/items?inventoryId=xxx ──────────────────────
router.get('/', async (req, res) => {
  try {
    const { inventoryId, page = '1', limit = '20' } = req.query
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId required' })

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where: { inventoryId: inventoryId as string },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          fieldValues: { include: { field: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
          _count: { select: { likes: true } },
        },
      }),
      prisma.item.count({ where: { inventoryId: inventoryId as string } }),
    ])

    res.json({
      items,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    })
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── GET /api/items/:id ───────────────────────────────────
router.get('/:id', async (req, res) => {
  const item = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: {
      fieldValues: { include: { field: true } },
      createdBy: { select: { id: true, name: true, avatar: true } },
      _count: { select: { likes: true } },
    },
  })
  if (!item) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json(item)
})

// ─── POST /api/items ──────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { inventoryId, fieldValues, customId: manualCustomId } = req.body

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        customIdFormat: true,
        access: { where: { userId: req.user!.id } },
      },
    })
    if (!inventory) return res.status(404).json({ error: 'NOT_FOUND' })

    const canWrite =
      inventory.ownerId === req.user!.id ||
      inventory.isPublic ||
      inventory.access.length > 0 ||
      req.user!.isAdmin

    if (!canWrite) return res.status(403).json({ error: 'FORBIDDEN' })

    let customId = manualCustomId
    if (!customId) {
      customId = await generateCustomId(inventory)
    }

    try {
      const item = await prisma.item.create({
        data: {
          customId,
          inventoryId,
          createdById: req.user!.id,
          fieldValues: {
            create: (fieldValues || []).map((fv: any) => ({
              fieldId: fv.fieldId,
              valueStr: fv.valueStr,
              valueNum: fv.valueNum,
              valueBool: fv.valueBool,
            })),
          },
        },
        include: {
          fieldValues: { include: { field: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
        },
      })
      res.status(201).json(item)
    } catch (dbErr: any) {
      if (dbErr.code === 'P2002') {
        return res.status(409).json({
          error: 'ID_CONFLICT',
          message: 'This Custom ID already exists. Please edit the ID.',
        })
      }
      throw dbErr
    }
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── PATCH /api/items/:id ─────────────────────────────────
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { version, fieldValues, customId } = req.body

    const existing = await prisma.item.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND' })

    const updated = await prisma.item.updateMany({
      where: { id: req.params.id, version },
      data: { customId, version: { increment: 1 } },
    })

    if (updated.count === 0) {
      return res.status(409).json({ error: 'VERSION_CONFLICT' })
    }

    if (fieldValues) {
      for (const fv of fieldValues) {
        await prisma.itemFieldValue.upsert({
          where: { itemId_fieldId: { itemId: req.params.id, fieldId: fv.fieldId } },
          update: { valueStr: fv.valueStr, valueNum: fv.valueNum, valueBool: fv.valueBool },
          create: {
            itemId: req.params.id,
            fieldId: fv.fieldId,
            valueStr: fv.valueStr,
            valueNum: fv.valueNum,
            valueBool: fv.valueBool,
          },
        })
      }
    }

    const result = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { fieldValues: { include: { field: true } } },
    })

    res.json(result)
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'ID_CONFLICT' })
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── DELETE /api/items/:id ────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        inventory: { include: { access: { where: { userId: req.user!.id } } } },
      },
    })
    if (!item) return res.status(404).json({ error: 'NOT_FOUND' })

    const canDelete =
      item.inventory.ownerId === req.user!.id ||
      item.createdById === req.user!.id ||
      item.inventory.isPublic ||
      item.inventory.access.length > 0 ||
      req.user!.isAdmin

    if (!canDelete) return res.status(403).json({ error: 'FORBIDDEN' })

    await prisma.item.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

// ─── LIKES ────────────────────────────────────────────────

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { userId_itemId: { userId: req.user!.id, itemId: req.params.id } },
    })

    if (existing) {
      await prisma.like.delete({
        where: { userId_itemId: { userId: req.user!.id, itemId: req.params.id } },
      })
      res.json({ liked: false })
    } else {
      await prisma.like.create({
        data: { userId: req.user!.id, itemId: req.params.id },
      })
      res.json({ liked: true })
    }
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR' })
  }
})

router.get('/:id/like', requireAuth, async (req, res) => {
  const like = await prisma.like.findUnique({
    where: { userId_itemId: { userId: req.user!.id, itemId: req.params.id } },
  })
  res.json({ liked: !!like })
})

export default router
