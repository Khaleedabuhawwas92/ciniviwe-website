import mongoose from 'mongoose'

/**
 * One login session (one browser). Holds the SHA-256 of the current refresh token — the raw
 * token only ever lives in the httpOnly cookie. Tokens rotate on every refresh; presenting an
 * already-rotated token revokes the session (token theft detection).
 */
const adminSessionSchema = new mongoose.Schema(
  {
    adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    previousTokenHash: { type: String, index: true },
    rotatedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, maxlength: 50 },
    userAgent: { type: String, default: '', maxlength: 300 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
)

// MongoDB removes expired sessions automatically.
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AdminSession = mongoose.models.AdminSession || mongoose.model('AdminSession', adminSessionSchema)
