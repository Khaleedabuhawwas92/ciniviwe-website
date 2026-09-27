import { createHash, randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { AdminUser, toPublicAdmin } from '../models/AdminUser.js'
import { AdminSession } from '../models/AdminSession.js'
import { verifyPassword } from './password.service.js'
import { logAudit } from './audit.service.js'
import { HttpError } from '../utils/httpError.js'

export const INVALID_CREDENTIALS = 'بيانات الدخول غير صحيحة'
export const SESSION_EXPIRED = 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً.'

const JWT_OPTIONS = { algorithm: 'HS256', issuer: 'cineview-api', audience: 'cineview-admin' }
// A token rotated less than this long ago may be presented again by a parallel request (e.g. two tabs);
// that is rejected without treating it as theft.
const ROTATION_GRACE_MS = 30_000

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const newRefreshToken = () => randomBytes(48).toString('base64url')
const unauthorized = (message = SESSION_EXPIRED) => new HttpError(401, message, { code: 'UNAUTHENTICATED' })

export function createAuthService(auth) {
  const signAccessToken = (admin, sessionId) =>
    jwt.sign({ sub: String(admin._id), sid: String(sessionId), role: admin.role }, auth.jwtSecret, {
      ...JWT_OPTIONS,
      expiresIn: auth.accessTokenTtlSec,
    })

  const issue = (admin, session, refreshToken) => ({
    admin: toPublicAdmin(admin),
    accessToken: signAccessToken(admin, session._id),
    accessTokenExpiresIn: auth.accessTokenTtlSec,
    refreshToken,
    refreshTokenExpiresAt: session.expiresAt,
  })

  /** Username/email + password → new session. Same generic error for every failure. */
  async function login({ usernameOrEmail, password, userAgent = '' }) {
    const identifier = typeof usernameOrEmail === 'string' ? usernameOrEmail.trim().toLowerCase() : ''
    const admin = identifier
      ? await AdminUser.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+passwordHash')
      : null

    // Always run bcrypt (against a dummy hash when the user does not exist) to keep timing uniform.
    const passwordOk = await verifyPassword(password, admin?.passwordHash)

    if (!admin || !passwordOk || admin.status !== 'ACTIVE') {
      if (admin) {
        await logAudit({
          adminUser: admin._id,
          action: 'LOGIN_FAILED',
          entityType: 'AdminUser',
          entityId: admin._id,
          metadata: { reason: passwordOk ? 'ACCOUNT_DISABLED' : 'INVALID_PASSWORD' },
        })
      }
      throw unauthorized(INVALID_CREDENTIALS)
    }

    const refreshToken = newRefreshToken()
    const session = await AdminSession.create({
      adminUser: admin._id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + auth.refreshTokenTtlSec * 1000),
      userAgent: String(userAgent).slice(0, 300),
    })

    admin.lastLoginAt = new Date()
    await admin.save()
    await logAudit({ adminUser: admin._id, action: 'LOGIN', entityType: 'AdminUser', entityId: admin._id })

    return issue(admin, session, refreshToken)
  }

  /** Rotates the refresh token and returns a fresh access token. */
  async function refresh(refreshToken) {
    if (typeof refreshToken !== 'string' || !refreshToken) throw unauthorized()
    const hash = sha256(refreshToken)
    const now = new Date()

    const session = await AdminSession.findOne({ tokenHash: hash })
    if (!session) {
      // An already-rotated token: parallel request (grace window) or a stolen, replayed token.
      const rotated = await AdminSession.findOne({ previousTokenHash: hash })
      if (rotated && !rotated.revokedAt && now - rotated.rotatedAt > ROTATION_GRACE_MS) {
        rotated.revokedAt = now
        rotated.revokedReason = 'TOKEN_REUSE'
        await rotated.save()
      }
      throw unauthorized()
    }

    if (session.revokedAt || session.expiresAt <= now) throw unauthorized()
    const admin = await AdminUser.findById(session.adminUser)
    if (!admin || admin.status !== 'ACTIVE') {
      session.revokedAt = now
      session.revokedReason = 'ACCOUNT_INACTIVE'
      await session.save()
      throw unauthorized()
    }

    const nextToken = newRefreshToken()
    session.previousTokenHash = hash
    session.tokenHash = sha256(nextToken)
    session.rotatedAt = now
    session.lastUsedAt = now
    await session.save()

    return issue(admin, session, nextToken)
  }

  /** Revokes the session that owns this refresh token (if any) and records the logout. */
  async function logout(refreshToken) {
    if (typeof refreshToken !== 'string' || !refreshToken) return
    const session = await AdminSession.findOneAndUpdate(
      { tokenHash: sha256(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'LOGOUT' } },
    )
    if (session) {
      await logAudit({ adminUser: session.adminUser, action: 'LOGOUT', entityType: 'AdminUser', entityId: session.adminUser })
    }
  }

  /** Verifies an access token and loads the (still active) admin and session. */
  async function authenticate(accessToken) {
    let payload
    try {
      payload = jwt.verify(accessToken, auth.jwtSecret, { ...JWT_OPTIONS, algorithms: [JWT_OPTIONS.algorithm] })
    } catch {
      throw unauthorized()
    }
    if (!mongoose.isValidObjectId(payload.sub) || !mongoose.isValidObjectId(payload.sid)) throw unauthorized()

    const [admin, session] = await Promise.all([
      AdminUser.findById(payload.sub).lean(),
      AdminSession.findById(payload.sid).select('revokedAt expiresAt adminUser').lean(),
    ])
    if (
      !admin ||
      admin.status !== 'ACTIVE' ||
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      String(session.adminUser) !== String(admin._id)
    ) {
      throw unauthorized()
    }
    return { admin, sessionId: String(session._id) }
  }

  return { login, refresh, logout, authenticate }
}

/** Ends every session of an admin (used on disable / password reset / password change). */
export async function revokeAllSessions(adminId, reason, { exceptSessionId } = {}) {
  const filter = { adminUser: adminId, revokedAt: null }
  if (exceptSessionId) filter._id = mongoose.trusted({ $ne: exceptSessionId })
  await AdminSession.updateMany(filter, { $set: { revokedAt: new Date(), revokedReason: reason } })
}
