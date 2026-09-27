import mongoose from 'mongoose'

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN']
export const ADMIN_STATUSES = ['ACTIVE', 'DISABLED']

const adminUserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    username: { type: String, required: true, trim: true, lowercase: true, maxlength: 32, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120, unique: true },
    // bcrypt hash — never selected by default and never serialized.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: 'ADMIN', index: true },
    status: { type: String, enum: ADMIN_STATUSES, default: 'ACTIVE', index: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.passwordHash
        return ret
      },
    },
  },
)

/** Public profile — the only shape that ever leaves the API. */
export function toPublicAdmin(admin) {
  if (!admin) return null
  return {
    id: String(admin._id ?? admin.id),
    fullName: admin.fullName,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt ?? null,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  }
}

export const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema)
