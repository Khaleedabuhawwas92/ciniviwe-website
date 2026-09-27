import mongoose from 'mongoose'
import { CONTACT_LIMITS, CONTACT_STATUSES, SERVICE_VALUES } from '../../../shared/contact.js'

export { CONTACT_STATUSES }
export const CONTACT_SOURCES = ['WEBSITE']
export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED', 'SKIPPED']
export const NOTE_MAX_LENGTH = 2000

// Internal staff note. Only ever returned by authenticated admin endpoints.
const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: NOTE_MAX_LENGTH },
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

// Append-only record of every status change.
const statusChangeSchema = new mongoose.Schema(
  {
    fromStatus: { type: String, enum: CONTACT_STATUSES, required: true },
    toStatus: { type: String, enum: CONTACT_STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const contactRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: CONTACT_LIMITS.fullName.max },
    companyName: { type: String, default: '', trim: true, maxlength: CONTACT_LIMITS.companyName.max },
    phone: { type: String, default: '', trim: true, maxlength: CONTACT_LIMITS.phone.max },
    email: { type: String, default: '', trim: true, lowercase: true, maxlength: CONTACT_LIMITS.email.max },
    service: { type: String, required: true, enum: SERVICE_VALUES },
    message: { type: String, required: true, trim: true, maxlength: CONTACT_LIMITS.message.max },

    status: { type: String, enum: CONTACT_STATUSES, default: 'NEW', index: true },
    source: { type: String, enum: CONTACT_SOURCES, default: 'WEBSITE' },

    // Keyed SHA-256 of the client IP (for spam analysis) — the raw IP is never stored.
    ipHash: { type: String, default: '', select: false },
    userAgent: { type: String, default: '', maxlength: 300 },

    // Delivery state of the email notification. The saved request is the source of truth;
    // a FAILED notification can be retried later without losing anything.
    notification: {
      status: { type: String, enum: NOTIFICATION_STATUSES, default: 'PENDING' },
      sentAt: { type: Date },
      error: { type: String, maxlength: 500 },
    },

    // Staff-only data — excluded by default, loaded explicitly by admin detail queries.
    notes: { type: [noteSchema], default: [], select: false },
    statusHistory: { type: [statusChangeSchema], default: [], select: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.ipHash
        return ret
      },
    },
  },
)

// Admin listing: newest first, optionally filtered by status / service.
contactRequestSchema.index({ status: 1, createdAt: -1 })
contactRequestSchema.index({ service: 1, createdAt: -1 })
contactRequestSchema.index({ createdAt: -1 })

export const ContactRequest = mongoose.models.ContactRequest || mongoose.model('ContactRequest', contactRequestSchema)
