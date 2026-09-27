import { createHmac } from 'node:crypto'
import mongoose from 'mongoose'
import { ContactRequest, CONTACT_STATUSES } from '../models/ContactRequest.js'

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

/* ---------- Admin queries (used by the admin API / future dashboard) ---------- */

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Lists requests, newest first.
 * @param {{ status?: string, q?: string, page?: number, limit?: number }} options
 */
export async function listContactRequests({ status, q, page = 1, limit = 20 } = {}) {
  const filter = {}
  if (status) filter.status = status
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i')
    filter.$or = ['fullName', 'companyName', 'phone', 'email'].map((field) => ({ [field]: pattern }))
  }

  const [items, total] = await Promise.all([
    ContactRequest.find(filter)
      .setOptions({ sanitizeFilter: false }) // filter is built server-side from validated values
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ContactRequest.countDocuments(filter).setOptions({ sanitizeFilter: false }),
  ])

  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

export async function getContactRequest(id) {
  if (!mongoose.isValidObjectId(id)) return null
  return ContactRequest.findById(id)
}

export async function updateContactRequestStatus(id, status) {
  if (!mongoose.isValidObjectId(id) || !CONTACT_STATUSES.includes(status)) return null
  return ContactRequest.findByIdAndUpdate(id, { $set: { status } }, { returnDocument: 'after', runValidators: true })
}
