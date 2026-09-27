import mongoose from 'mongoose'
import { sanitizeText } from '../../../shared/contact.js'
import { AdminUser, ADMIN_ROLES, ADMIN_STATUSES, toPublicAdmin } from '../models/AdminUser.js'
import { hashPassword, verifyPassword, passwordPolicyError, generateTemporaryPassword } from './password.service.js'
import { revokeAllSessions } from './auth.service.js'
import { logAudit } from './audit.service.js'
import { badRequest, conflict, notFoundError, HttpError } from '../utils/httpError.js'

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,30})[a-z0-9]$/
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const VALIDATION_MESSAGE = 'يرجى مراجعة البيانات المدخلة.'

/** Validates and normalizes admin profile fields. `partial` validates only the provided fields. */
export function validateAdminInput(input = {}, { partial = false } = {}) {
  const values = {}
  const errors = {}
  const has = (key) => !partial || input[key] !== undefined

  if (has('fullName')) {
    values.fullName = sanitizeText(input.fullName)
    if (values.fullName.length < 2 || values.fullName.length > 100) errors.fullName = 'يرجى إدخال اسم صحيح (2–100 حرف).'
  }
  if (has('username')) {
    values.username = sanitizeText(input.username).toLowerCase()
    if (!USERNAME_PATTERN.test(values.username)) {
      errors.username = 'اسم المستخدم: 3–32 حرفاً إنجليزياً صغيراً أو أرقاماً أو (. _ -).'
    }
  }
  if (has('email')) {
    values.email = sanitizeText(input.email).toLowerCase()
    if (!EMAIL_PATTERN.test(values.email) || values.email.length > 120) errors.email = 'يرجى إدخال بريد إلكتروني صحيح.'
  }
  if (has('role')) {
    values.role = typeof input.role === 'string' ? input.role.toUpperCase() : ''
    if (!ADMIN_ROLES.includes(values.role)) errors.role = 'الصلاحية غير صحيحة.'
  }
  if (partial && input.status !== undefined) {
    values.status = typeof input.status === 'string' ? input.status.toUpperCase() : ''
    if (!ADMIN_STATUSES.includes(values.status)) errors.status = 'الحالة غير صحيحة.'
  }
  return { values, errors }
}

async function assertUnique({ username, email }, excludeId) {
  const clauses = []
  if (username) clauses.push({ username })
  if (email) clauses.push({ email })
  if (!clauses.length) return
  const filter = { $or: clauses }
  if (excludeId) filter._id = mongoose.trusted({ $ne: excludeId })
  const existing = await AdminUser.findOne(filter).lean()
  if (!existing) return
  const errors = {}
  if (username && existing.username === username) errors.username = 'اسم المستخدم مستخدم بالفعل.'
  if (email && existing.email === email) errors.email = 'البريد الإلكتروني مستخدم بالفعل.'
  throw conflict(VALIDATION_MESSAGE, errors)
}

const activeSuperAdminCount = () => AdminUser.countDocuments({ role: 'SUPER_ADMIN', status: 'ACTIVE' })

export async function listAdmins() {
  const admins = await AdminUser.find().sort({ createdAt: 1 }).lean()
  return admins.map(toPublicAdmin)
}

/** Creates an admin. `actor` is null when created from the CLI. */
export async function createAdmin(input, { actor = null, bcryptRounds, via = 'dashboard' } = {}) {
  const { values, errors } = validateAdminInput({ ...input, role: input.role ?? 'ADMIN' })
  const passwordError = passwordPolicyError(input.password)
  if (passwordError) errors.password = passwordError
  if (Object.keys(errors).length) throw badRequest(VALIDATION_MESSAGE, errors)

  await assertUnique(values)
  const admin = await AdminUser.create({
    ...values,
    status: 'ACTIVE',
    passwordHash: await hashPassword(input.password, bcryptRounds),
    passwordChangedAt: new Date(),
  })
  await logAudit({
    adminUser: actor?._id ?? null,
    action: 'ADMIN_CREATED',
    entityType: 'AdminUser',
    entityId: admin._id,
    metadata: { username: admin.username, role: admin.role, via },
  })
  return toPublicAdmin(admin)
}

/** Updates name / email / role / status. Guards against locking everyone out. */
export async function updateAdmin(id, input, { actor }) {
  if (!mongoose.isValidObjectId(id)) throw notFoundError('المستخدم غير موجود.')
  const admin = await AdminUser.findById(id)
  if (!admin) throw notFoundError('المستخدم غير موجود.')

  const { values, errors } = validateAdminInput(input, { partial: true })
  delete values.username // usernames are permanent (they appear in audit history)
  if (Object.keys(errors).length) throw badRequest(VALIDATION_MESSAGE, errors)

  const isSelf = String(admin._id) === String(actor._id)
  if (isSelf && values.status === 'DISABLED') throw badRequest('لا يمكنك تعطيل حسابك.')
  if (isSelf && values.role && values.role !== admin.role) throw badRequest('لا يمكنك تغيير صلاحيتك.')

  const losesSuperAdmin =
    admin.role === 'SUPER_ADMIN' &&
    admin.status === 'ACTIVE' &&
    ((values.role && values.role !== 'SUPER_ADMIN') || values.status === 'DISABLED')
  if (losesSuperAdmin && (await activeSuperAdminCount()) <= 1) {
    throw badRequest('يجب أن يبقى مدير عام (SUPER_ADMIN) واحد نشط على الأقل.')
  }

  if (values.email && values.email !== admin.email) await assertUnique({ email: values.email }, admin._id)

  const before = { fullName: admin.fullName, email: admin.email, role: admin.role, status: admin.status }
  Object.assign(admin, values)
  await admin.save()

  const audit = (action, metadata) =>
    logAudit({ adminUser: actor._id, action, entityType: 'AdminUser', entityId: admin._id, metadata })

  if (values.status && values.status !== before.status) {
    if (values.status === 'DISABLED') await revokeAllSessions(admin._id, 'ACCOUNT_DISABLED')
    await audit(values.status === 'DISABLED' ? 'ADMIN_DISABLED' : 'ADMIN_ENABLED', { username: admin.username })
  }
  if (values.role && values.role !== before.role) {
    await audit('ADMIN_ROLE_CHANGED', { username: admin.username, fromRole: before.role, toRole: values.role })
  }
  const profileChanges = ['fullName', 'email'].filter((key) => values[key] !== undefined && values[key] !== before[key])
  if (profileChanges.length) await audit('ADMIN_UPDATED', { username: admin.username, fields: profileChanges })

  return toPublicAdmin(admin)
}

/**
 * Resets another admin's password. With no password given, a random temporary password is generated
 * and returned once. All of that admin's sessions are ended.
 */
export async function resetAdminPassword(id, { password } = {}, { actor, bcryptRounds }) {
  if (!mongoose.isValidObjectId(id)) throw notFoundError('المستخدم غير موجود.')
  const admin = await AdminUser.findById(id)
  if (!admin) throw notFoundError('المستخدم غير موجود.')

  const generated = password === undefined || password === null || password === ''
  const newPassword = generated ? generateTemporaryPassword() : password
  const policyError = passwordPolicyError(newPassword)
  if (policyError) throw badRequest(VALIDATION_MESSAGE, { password: policyError })

  admin.passwordHash = await hashPassword(newPassword, bcryptRounds)
  admin.passwordChangedAt = new Date()
  await admin.save()
  await revokeAllSessions(admin._id, 'PASSWORD_RESET')
  await logAudit({
    adminUser: actor._id,
    action: 'PASSWORD_RESET',
    entityType: 'AdminUser',
    entityId: admin._id,
    metadata: { username: admin.username, mode: generated ? 'GENERATED' : 'MANUAL' },
  })

  return { admin: toPublicAdmin(admin), temporaryPassword: generated ? newPassword : undefined }
}

/** Lets an admin change their own password (current password required). Other sessions are ended. */
export async function changeOwnPassword(adminId, { currentPassword, newPassword }, { bcryptRounds, sessionId }) {
  const admin = await AdminUser.findById(adminId).select('+passwordHash')
  if (!admin) throw new HttpError(401, 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً.')
  if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
    throw badRequest(VALIDATION_MESSAGE, { currentPassword: 'كلمة المرور الحالية غير صحيحة.' })
  }
  const policyError = passwordPolicyError(newPassword)
  if (policyError) throw badRequest(VALIDATION_MESSAGE, { newPassword: policyError })
  if (await verifyPassword(newPassword, admin.passwordHash)) {
    throw badRequest(VALIDATION_MESSAGE, { newPassword: 'يجب أن تختلف كلمة المرور الجديدة عن الحالية.' })
  }

  admin.passwordHash = await hashPassword(newPassword, bcryptRounds)
  admin.passwordChangedAt = new Date()
  await admin.save()
  await revokeAllSessions(admin._id, 'PASSWORD_CHANGED', { exceptSessionId: sessionId })
  await logAudit({ adminUser: admin._id, action: 'PASSWORD_CHANGED', entityType: 'AdminUser', entityId: admin._id })
}
