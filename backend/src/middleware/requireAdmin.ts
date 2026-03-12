import { Request, Response, NextFunction } from 'express'

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin only' })
  }
  next()
}
