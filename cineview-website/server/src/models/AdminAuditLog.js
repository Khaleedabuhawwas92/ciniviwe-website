import mongoose from 'mongoose'

export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'CONTACT_VIEWED',
  'CONTACT_STATUS_CHANGED',
  'CONTACT_NOTE_ADDED',
  'CONTACTS_EXPORTED',
  'ADMIN_CREATED',
  'ADMIN_UPDATED',
  'ADMIN_ROLE_CHANGED',
  'ADMIN_ENABLED',
  'ADMIN_DISABLED',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',
]

export const AUDIT_ENTITY_TYPES = ['AdminUser', 'ContactRequest', 'System']

/** Append-only activity log. Metadata must never contain passwords, hashes or tokens. */
const adminAuditLogSchema = new mongoose.Schema(
  {
    // null for actions performed from the CLI (e.g. creating the first admin).
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null, index: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    entityType: { type: String, enum: AUDIT_ENTITY_TYPES, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
)

adminAuditLogSchema.index({ createdAt: -1 })

export const AdminAuditLog = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', adminAuditLogSchema)
