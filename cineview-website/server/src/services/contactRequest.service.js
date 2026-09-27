import { createHmac } from 'node:crypto'
import mongoose from 'mongoose'
import { SERVICE_VALUES, sanitizeText } from '../../../shared/contact.js'
import { ContactRequest, CONTACT_STATUSES, NOTE_MAX_LENGTH } from '../models/ContactRequest.js'
import { logAudit } from './audit.service.js'
import { startOfZonedDay, startOfNextZonedDay, lastZonedDays } from '../utils/dates.js'
import { badRequest, conflict, notFoundError } from '../utils/httpError.js'

/* ---------- Public website ---------- */

const MAX_LINKS = 3
const LINK_PATTERN = /(https?:\/\/|www\.)/gi

/** Messages stuffed with links are stored as SPAM (kept for review, no notification). */
export const looksLikeSpam = ({ message }) => (message.match(LINK_PATTERN) || []).length > MAX_LINKS

export const hashIp = (ip, secret) => (ip && secret ? createHmac('sha256', secret).update(ip).digest('hex') : '')

/** Persists a validated, sanitized contact request. */
export async function createContactRequest(values, { ip = '', userAgent = '', ipHashSecret = '' } = {}) {
  const spam = looksLikeSpam(values)
  return ContactRequest.create({
    ...values,
    status: spam ? 'SPAM' : 'NEW',
    source: 'WEBSITE',
    ipHash: hashIp(ip, ipHashSecret),
    userAgent: String(userAgent).slice(0, 300),
    notification: { status: spam ? 'SKIPPED' : 'PENDING' },
  })
}

export async function setNotificationResult(id, { status, error }) {
  await ContactRequest.updateOne(
    { _id: id },
    {
      $set: {
        'notification.status': status,
        ...(status === 'SENT' && { 'notification.sentAt': new Date() }),
        ...(error && { 'notification.error': String(error).slice(0, 500) }),
      },
    },
  )
}

/* ---------- Admin: listing, search, filters ---------- */

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Normalizes list filters from query parameters. Unknown / invalid values are rejected with 400.
 * Dates are calendar days ("YYYY-MM-DD") in the configured timezone; `to` is inclusive.
 */
export function parseContactFilters(query = {}, timezone) {
  const str = (value) => (typeof value === 'string' ? value.trim() : '')
  const errors = {}

  const status = str(query.status).toUpperCase()
  if (status && !CONTACT_STATUSES.includes(status)) errors.status = 'الحالة غير صحيحة.'

  const service = str(query.service)
  if (service && !SERVICE_VALUES.includes(service)) errors.service = 'الخدمة غير صحيحة.'

  const from = str(query.from)
  const to = str(query.to)
  const fromDate = from ? startOfZonedDay(from, timezone) : null
  const toDate = to ? startOfNextZonedDay(to, timezone) : null
  if (from && !fromDate) errors.from = 'تاريخ البداية غير صحيح.'
  if (to && !toDate) errors.to = 'تاريخ النهاية غير صحيح.'
  if (fromDate && toDate && fromDate >= toDate) errors.to = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.'

  const sort = str(query.sort) === 'oldest' ? 'oldest' : 'newest'
  const q = sanitizeText(str(query.q)).slice(0, 100)

  if (Object.keys(errors).length) throw badRequest('معايير البحث غير صحيحة.', errors)
  return { status, service, fromDate, toDate, sort, q }
}

/** Builds the MongoDB filter. Operators are wrapped in mongoose.trusted() (sanitizeFilter is on globally). */
function buildFilter({ status, service, fromDate, toDate, q }) {
  const filter = {}
  if (status) filter.status = status
  if (service) filter.service = service
  if (fromDate || toDate) {
    filter.createdAt = mongoose.trusted({ ...(fromDate && { $gte: fromDate }), ...(toDate && { $lt: toDate }) })
  }
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i')
    // Phone numbers are also matched ignoring spaces/dashes ("0501234567" finds "050 123 4567").
    const digits = q.replace(/\D/g, '')
    const phonePattern = digits.length >= 3 ? new RegExp(digits.split('').join('[\\s\\-()]*')) : pattern
    filter.$or = [
      { fullName: pattern },
      { companyName: pattern },
      { email: pattern },
      { phone: phonePattern },
    ]
  }
  return filter
}

const sortOf = (sort) => ({ createdAt: sort === 'oldest' ? 1 : -1, _id: sort === 'oldest' ? 1 : -1 })

export async function listContacts(filters, { page = 1, limit = 20 } = {}) {
  const filter = buildFilter(filters)
  const [items, total] = await Promise.all([
    ContactRequest.find(filter)
      .sort(sortOf(filters.sort))
      .skip((page - 1) * limit)
      .limit(limit),
    ContactRequest.countDocuments(filter),
  ])
  return {
    items: items.map((doc) => doc.toJSON()),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  }
}

export const EXPORT_MAX_ROWS = 10_000

/** Rows for CSV export — only business fields, no security/internal data. */
export async function exportContacts(filters) {
  return ContactRequest.find(buildFilter(filters))
    .sort(sortOf(filters.sort))
    .limit(EXPORT_MAX_ROWS)
    .select('fullName companyName phone email service status createdAt')
    .lean()
}

/* ---------- Admin: details, status, notes ---------- */

const adminRef = (admin) =>
  admin && admin._id ? { id: String(admin._id), fullName: admin.fullName, username: admin.username } : null

export async function getContactDetails(id) {
  if (!mongoose.isValidObjectId(id)) throw notFoundError('طلب التواصل غير موجود.')
  const doc = await ContactRequest.findById(id)
    .select('+notes +statusHistory +ipHash')
    .populate('notes.adminUser', 'fullName username')
    .populate('statusHistory.changedBy', 'fullName username')
  if (!doc) throw notFoundError('طلب التواصل غير موجود.')

  const json = doc.toJSON()
  return {
    ...json,
    // Only whether a hash exists — the hash itself is never sent (and cannot be reversed).
    hasIpHash: Boolean(doc.ipHash),
    notes: (doc.notes || [])
      .map((note) => ({ id: String(note._id), text: note.text, createdAt: note.createdAt, admin: adminRef(note.adminUser) }))
      .sort((a, b) => b.createdAt - a.createdAt),
    statusHistory: (doc.statusHistory || [])
      .map((entry) => ({
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        changedAt: entry.changedAt,
        changedBy: adminRef(entry.changedBy),
      }))
      .sort((a, b) => b.changedAt - a.changedAt),
  }
}

/** Changes the status and appends to the history atomically (no lost updates between two admins). */
export async function changeContactStatus(id, nextStatus, { actor }) {
  if (!mongoose.isValidObjectId(id)) throw notFoundError('طلب التواصل غير موجود.')
  const status = typeof nextStatus === 'string' ? nextStatus.toUpperCase() : ''
  if (!CONTACT_STATUSES.includes(status)) throw badRequest('الحالة غير صحيحة.', { status: 'الحالة غير صحيحة.' })

  const current = await ContactRequest.findById(id).select('status').lean()
  if (!current) throw notFoundError('طلب التواصل غير موجود.')
  if (current.status === status) throw badRequest('الطلب بهذه الحالة بالفعل.')

  const updated = await ContactRequest.findOneAndUpdate(
    { _id: id, status: current.status },
    {
      $set: { status },
      $push: { statusHistory: { fromStatus: current.status, toStatus: status, changedBy: actor._id, changedAt: new Date() } },
    },
    { returnDocument: 'after', runValidators: true },
  )
  if (!updated) throw conflict('تم تعديل الطلب من مستخدم آخر، يرجى تحديث الصفحة.')

  await logAudit({
    adminUser: actor._id,
    action: 'CONTACT_STATUS_CHANGED',
    entityType: 'ContactRequest',
    entityId: updated._id,
    metadata: { fullName: updated.fullName, fromStatus: current.status, toStatus: status },
  })
  return getContactDetails(id)
}

export async function addContactNote(id, rawText, { actor }) {
  if (!mongoose.isValidObjectId(id)) throw notFoundError('طلب التواصل غير موجود.')
  const text = sanitizeText(rawText, { multiline: true })
  if (!text) throw badRequest('يرجى كتابة الملاحظة.', { text: 'يرجى كتابة الملاحظة.' })
  if (text.length > NOTE_MAX_LENGTH) {
    throw badRequest('الملاحظة طويلة جداً.', { text: `الحد الأقصى ${NOTE_MAX_LENGTH} حرف.` })
  }

  const noteId = new mongoose.Types.ObjectId()
  const updated = await ContactRequest.findByIdAndUpdate(
    id,
    { $push: { notes: { _id: noteId, text, adminUser: actor._id, createdAt: new Date() } } },
    { returnDocument: 'after' },
  )
  if (!updated) throw notFoundError('طلب التواصل غير موجود.')

  await logAudit({
    adminUser: actor._id,
    action: 'CONTACT_NOTE_ADDED',
    entityType: 'ContactRequest',
    entityId: updated._id,
    metadata: { fullName: updated.fullName, noteId: String(noteId) }, // note text stays on the request only
  })
  return getContactDetails(id)
}

/* ---------- Admin: dashboard statistics (computed from the database) ---------- */

export async function getContactStats(timezone) {
  const days = lastZonedDays(7, timezone)
  const [facets] = await ContactRequest.aggregate([
    {
      $facet: {
        total: [{ $count: 'n' }],
        byStatus: [{ $group: { _id: '$status', n: { $sum: 1 } } }],
        byService: [{ $match: { status: { $ne: 'SPAM' } } }, { $group: { _id: '$service', n: { $sum: 1 } } }],
        today: [
          { $match: { $expr: { $gte: ['$createdAt', { $dateTrunc: { date: '$$NOW', unit: 'day', timezone } }] } } },
          { $count: 'n' },
        ],
        thisMonth: [
          { $match: { $expr: { $gte: ['$createdAt', { $dateTrunc: { date: '$$NOW', unit: 'month', timezone } }] } } },
          { $count: 'n' },
        ],
        lastDays: [
          { $match: { status: { $ne: 'SPAM' }, createdAt: { $gte: startOfZonedDay(days[0], timezone) } } },
          { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone } }, n: { $sum: 1 } } },
        ],
      },
    },
  ])

  const count = (arr) => arr[0]?.n ?? 0
  const toMap = (arr) => Object.fromEntries(arr.map((row) => [row._id, row.n]))
  const statusMap = toMap(facets.byStatus)
  const serviceMap = toMap(facets.byService)
  const dayMap = toMap(facets.lastDays)

  return {
    total: count(facets.total),
    today: count(facets.today),
    thisMonth: count(facets.thisMonth),
    byStatus: Object.fromEntries(CONTACT_STATUSES.map((s) => [s, statusMap[s] ?? 0])),
    byService: SERVICE_VALUES.map((service) => ({ service, count: serviceMap[service] ?? 0 })),
    lastDays: days.map((date) => ({ date, count: dayMap[date] ?? 0 })),
    timezone,
  }
}

export async function latestContacts(limit = 6) {
  const docs = await ContactRequest.find().sort({ createdAt: -1 }).limit(limit)
  return docs.map((doc) => doc.toJSON())
}
