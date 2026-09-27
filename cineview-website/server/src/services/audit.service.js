import mongoose from 'mongoose'
import { AdminAuditLog, AUDIT_ACTIONS } from '../models/AdminAuditLog.js'
import { logger } from '../utils/logger.js'

const SENSITIVE_KEY = /pass|token|hash|secret|cookie|authorization/i

/** Removes anything that looks like a credential from audit metadata. */
function scrub(value, depth = 0) {
  if (depth > 3 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1))
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, v]) => [key, typeof v === 'string' ? v.slice(0, 300) : scrub(v, depth + 1)]),
  )
}

/** Records an audit entry. Never throws — auditing must not break the action itself. */
export async function logAudit({ adminUser = null, action, entityType, entityId = null, metadata = {} }) {
  try {
    await AdminAuditLog.create({ adminUser, action, entityType, entityId, metadata: scrub(metadata) })
  } catch (error) {
    logger.error('Audit log write failed', { action, error: error.message })
  }
}

/** Lists audit entries, newest first, with the acting admin's name. */
export async function listAuditLogs({ action, adminUser, entityId, page = 1, limit = 30 } = {}) {
  const filter = {}
  if (action && AUDIT_ACTIONS.includes(action)) filter.action = action
  if (adminUser && mongoose.isValidObjectId(adminUser)) filter.adminUser = adminUser
  if (entityId && mongoose.isValidObjectId(entityId)) filter.entityId = entityId

  const [items, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('adminUser', 'fullName username')
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ])

  return {
    items: items.map(toPublicAudit),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  }
}

export function toPublicAudit(entry) {
  return {
    id: String(entry._id),
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ? String(entry.entityId) : null,
    metadata: entry.metadata || {},
    admin: entry.adminUser
      ? { id: String(entry.adminUser._id), fullName: entry.adminUser.fullName, username: entry.adminUser.username }
      : null,
    createdAt: entry.createdAt,
  }
}
