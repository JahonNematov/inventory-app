import { Router } from 'express'
import passport from '../config/passport'

const router = Router()

// ─── Google OAuth ─────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failed' }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL + '/')
  }
)

// ─── GitHub OAuth ─────────────────────────────────────────
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }))

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/failed' }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL + '/')
  }
)

// ─── Current User ─────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.json(null)
  res.json(req.user)
})

// ─── Logout ───────────────────────────────────────────────
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
    req.session.destroy(() => {
      res.clearCookie('connect.sid')
      res.json({ success: true })
    })
  })
})

// ─── Failed ───────────────────────────────────────────────
router.get('/failed', (req, res) => {
  res.redirect(process.env.CLIENT_URL + '/?auth=failed')
})

export default router
