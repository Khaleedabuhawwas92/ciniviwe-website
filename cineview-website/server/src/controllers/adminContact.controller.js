import { CONTACT_STATUSES } from '../models/ContactRequest.js'
import {
  listContactRequests,
  getContactRequest,
  updateContactRequestStatus,
} from '../services/contactRequest.service.js'

const toInt = (value, fallback, { min, max }) => {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback
}
const asString = (value) => (typeof value === 'string' ? value.trim() : '')

/** GET /api/admin/contact-requests?status=NEW&q=search&page=1&limit=20 */
export async function listRequests(req, res) {
  const status = asString(req.query.status).toUpperCase()
  if (status && !CONTACT_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status', allowed: CONTACT_STATUSES })
  }
  const result = await listContactRequests({
    status: status || undefined,
    q: asString(req.query.q).slice(0, 100) || undefined,
    page: toInt(req.query.page, 1, { min: 1, max: 10_000 }),
    limit: toInt(req.query.limit, 20, { min: 1, max: 100 }),
  })
  res.json({
    success: true,
    data: result.items,
    pagination: { page: result.page, limit: result.limit, total: result.total, pages: result.pages },
  })
}

/** GET /api/admin/contact-requests/:id */
export async function getRequest(req, res) {
  const request = await getContactRequest(req.params.id)
  if (!request) return res.status(404).json({ success: false, message: 'Contact request not found' })
  res.json({ success: true, data: request })
}

/** PATCH /api/admin/contact-requests/:id  body: { status } */
export async function updateStatus(req, res) {
  const status = asString(req.body?.status).toUpperCase()
  if (!CONTACT_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status', allowed: CONTACT_STATUSES })
  }
  const request = await updateContactRequestStatus(req.params.id, status)
  if (!request) return res.status(404).json({ success: false, message: 'Contact request not found' })
  res.json({ success: true, data: request })
}
