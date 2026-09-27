import { Router } from 'express'
import cookieParser from 'cookie-parser'
import { createContactController } from '../controllers/contact.controller.js'
import { createAdminAuthController } from '../controllers/adminAuth.controller.js'
import { createAdminContactsController } from '../controllers/adminContacts.controller.js'
import { createAdminUsersController } from '../controllers/adminUsers.controller.js'
import { listAudit } from '../controllers/adminAudit.controller.js'
import {
  contactRateLimit,
  adminRateLimit,
  loginRateLimits,
  requireTrustedOrigin,
} from '../middleware/security.js'
import { requireAdminAuth, requireSuperAdmin } from '../middleware/adminAuth.js'
import { createAuthService } from '../services/auth.service.js'
import { isDatabaseReady } from '../db/connect.js'

export function createRoutes(config, { notifier }) {
  const router = Router()

  router.get('/health', (_req, res) => {
    const db = isDatabaseReady()
    res.status(db ? 200 : 503).json({ success: db, database: db ? 'up' : 'down' })
  })

  /* ---------- Public website ---------- */
  router.post(
    '/contact',
    contactRateLimit(config.rateLimit),
    createContactController({ notifier, ipHashSecret: config.ipHashSecret }),
  )

  /* ---------- Admin dashboard ---------- */
  const authService = createAuthService(config.auth)
  const auth = createAdminAuthController({ authService, config })
  const contacts = createAdminContactsController({ config })
  const users = createAdminUsersController({ config })
  const requireAuth = requireAdminAuth(authService)
  const trustedOrigin = requireTrustedOrigin(config.corsOrigins)

  const admin = Router()
  admin.use(adminRateLimit(), (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Authentication (refresh/logout use the httpOnly cookie → CSRF checks)
  admin.post('/auth/login', ...loginRateLimits(config.auth.loginRateLimit), auth.login)
  admin.post('/auth/refresh', cookieParser(), trustedOrigin, auth.refresh)
  admin.post('/auth/logout', cookieParser(), trustedOrigin, auth.logout)
  admin.get('/auth/me', requireAuth, auth.me)
  admin.post('/auth/change-password', requireAuth, auth.changePassword)

  // Everything below requires a valid admin session
  admin.use(requireAuth)

  admin.get('/dashboard', contacts.dashboard)
  admin.get('/contacts', contacts.list)
  admin.get('/contacts/export', contacts.exportCsv)
  admin.get('/contacts/:id', contacts.details)
  admin.patch('/contacts/:id/status', contacts.updateStatus)
  admin.post('/contacts/:id/notes', contacts.addNote)
  admin.get('/audit', listAudit)

  // Admin accounts — SUPER_ADMIN only (enforced here, not just hidden in the UI)
  admin.get('/users', requireSuperAdmin, users.list)
  admin.post('/users', requireSuperAdmin, users.create)
  admin.patch('/users/:id', requireSuperAdmin, users.update)
  admin.post('/users/:id/reset-password', requireSuperAdmin, users.resetPassword)

  router.use('/admin', admin)
  return router
}
