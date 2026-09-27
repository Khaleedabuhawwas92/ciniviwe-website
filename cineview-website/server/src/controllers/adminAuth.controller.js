import { toPublicAdmin } from '../models/AdminUser.js'
import { changeOwnPassword } from '../services/adminUser.service.js'

/** /api/admin/auth/* — the refresh token travels only in an httpOnly cookie; the access token in the body. */
export function createAdminAuthController({ authService, config }) {
  const { cookie, bcryptRounds } = config.auth
  const cookieOptions = {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    ...(cookie.domain && { domain: cookie.domain }),
  }

  const sendSession = (res, result, status = 200) => {
    res.cookie(cookie.name, result.refreshToken, { ...cookieOptions, expires: result.refreshTokenExpiresAt })
    res.set('Cache-Control', 'no-store')
    res.status(status).json({
      success: true,
      data: {
        admin: result.admin,
        accessToken: result.accessToken,
        expiresIn: result.accessTokenExpiresIn,
      },
    })
  }

  const clearCookie = (res) => res.clearCookie(cookie.name, cookieOptions)

  return {
    async login(req, res) {
      const { usernameOrEmail, password } = req.body || {}
      const result = await authService.login({ usernameOrEmail, password, userAgent: req.get('user-agent') })
      sendSession(res, result)
    },

    async refresh(req, res) {
      try {
        const result = await authService.refresh(req.cookies?.[cookie.name])
        sendSession(res, result)
      } catch (error) {
        clearCookie(res)
        throw error
      }
    },

    async logout(req, res) {
      await authService.logout(req.cookies?.[cookie.name])
      clearCookie(res)
      res.json({ success: true, message: 'تم تسجيل الخروج.' })
    },

    me(req, res) {
      res.json({ success: true, data: { admin: toPublicAdmin(req.admin) } })
    },

    async changePassword(req, res) {
      const { currentPassword, newPassword } = req.body || {}
      await changeOwnPassword(req.admin._id, { currentPassword, newPassword }, { bcryptRounds, sessionId: req.sessionId })
      res.json({ success: true, message: 'تم تغيير كلمة المرور.' })
    },
  }
}
