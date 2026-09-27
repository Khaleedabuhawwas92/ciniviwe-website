import { listAdmins, createAdmin, updateAdmin, resetAdminPassword } from '../services/adminUser.service.js'

/** /api/admin/users/* (SUPER_ADMIN only). */
export function createAdminUsersController({ config }) {
  const { bcryptRounds } = config.auth
  const str = (value) => (typeof value === 'string' ? value : undefined)

  return {
    async list(_req, res) {
      res.json({ success: true, data: await listAdmins() })
    },

    async create(req, res) {
      const body = req.body || {}
      const admin = await createAdmin(
        { fullName: body.fullName, username: body.username, email: body.email, role: body.role, password: str(body.password) },
        { actor: req.admin, bcryptRounds },
      )
      res.status(201).json({ success: true, message: 'تم إنشاء المستخدم.', data: admin })
    },

    async update(req, res) {
      const body = req.body || {}
      const admin = await updateAdmin(
        req.params.id,
        { fullName: body.fullName, email: body.email, role: body.role, status: body.status },
        { actor: req.admin },
      )
      res.json({ success: true, message: 'تم تحديث المستخدم.', data: admin })
    },

    /** Body { password } sets it; empty body generates a temporary password returned once. */
    async resetPassword(req, res) {
      const result = await resetAdminPassword(req.params.id, { password: str(req.body?.password) }, { actor: req.admin, bcryptRounds })
      res.set('Cache-Control', 'no-store')
      res.json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور.',
        data: { admin: result.admin, ...(result.temporaryPassword && { temporaryPassword: result.temporaryPassword }) },
      })
    },
  }
}
