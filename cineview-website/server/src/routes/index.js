import { Router } from 'express'
import { createContactController } from '../controllers/contact.controller.js'
import { listRequests, getRequest, updateStatus } from '../controllers/adminContact.controller.js'
import { contactRateLimit, adminRateLimit, requireAdmin } from '../middleware/security.js'
import { isDatabaseReady } from '../db/connect.js'

export function createRoutes(config, { notifier }) {
  const router = Router()

  router.get('/health', (_req, res) => {
    const db = isDatabaseReady()
    res.status(db ? 200 : 503).json({ success: db, database: db ? 'up' : 'down' })
  })

  // Public
  router.post(
    '/contact',
    contactRateLimit(config.rateLimit),
    createContactController({ notifier, ipHashSecret: config.ipHashSecret }),
  )

  // Admin (disabled unless ADMIN_API_KEY is set) — ready for the future Cineview dashboard.
  const admin = Router()
  admin.use(adminRateLimit(), requireAdmin(config.adminApiKey))
  admin.get('/contact-requests', listRequests)
  admin.get('/contact-requests/:id', getRequest)
  admin.patch('/contact-requests/:id', updateStatus)
  router.use('/admin', admin)

  return router
}
