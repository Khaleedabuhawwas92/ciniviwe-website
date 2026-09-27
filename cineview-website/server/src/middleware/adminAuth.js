import { HttpError } from '../utils/httpError.js'

/**
 * requireAdminAuth — accepts `Authorization: Bearer <access token>` only (never an API key),
 * and re-checks the admin account and session on every request, so disabling an admin or
 * logging out takes effect immediately.
 */
export function requireAdminAuth(authService) {
  return async (req, _res, next) => {
    const header = req.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token) return next(new HttpError(401, 'يرجى تسجيل الدخول.', { code: 'UNAUTHENTICATED' }))
    try {
      const { admin, sessionId } = await authService.authenticate(token)
      req.admin = admin
      req.sessionId = sessionId
      next()
    } catch (error) {
      next(error)
    }
  }
}

/** requireSuperAdmin — must run after requireAdminAuth. */
export function requireSuperAdmin(req, _res, next) {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    return next(new HttpError(403, 'ليست لديك صلاحية لتنفيذ هذا الإجراء.', { code: 'FORBIDDEN' }))
  }
  next()
}
