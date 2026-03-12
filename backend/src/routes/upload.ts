import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files allowed'))
  },
})

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'NO_FILE' })
  const url = `${process.env.SERVER_URL || 'http://localhost:4000'}/uploads/${req.file.filename}`
  res.json({ url })
})

export default router
