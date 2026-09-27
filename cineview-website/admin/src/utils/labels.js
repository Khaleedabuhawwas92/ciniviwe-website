import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
  NOTIFICATION_STATUS_LABELS,
  SERVICE_OPTIONS,
  serviceLabel,
} from '@shared/contact.js'

export { CONTACT_STATUSES, CONTACT_STATUS_LABELS, NOTIFICATION_STATUS_LABELS, SERVICE_OPTIONS, serviceLabel }

export const statusLabel = (status) => CONTACT_STATUS_LABELS[status] ?? status

/** Status → badge classes. Always shown with a text label (never color alone). */
export const STATUS_STYLES = {
  NEW: 'bg-sky-50 text-sky-800 ring-sky-200',
  CONTACTED: 'bg-violet-50 text-violet-800 ring-violet-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 ring-amber-200',
  CLOSED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  SPAM: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const NOTIFICATION_STYLES = {
  PENDING: 'text-navy-500',
  SENT: 'text-emerald-700',
  FAILED: 'text-rose-700',
  SKIPPED: 'text-navy-400',
}

export const ROLE_LABELS = { SUPER_ADMIN: 'مدير عام', ADMIN: 'مشرف' }
export const ADMIN_STATUS_LABELS = { ACTIVE: 'نشط', DISABLED: 'معطّل' }

export const AUDIT_ACTION_LABELS = {
  LOGIN: 'تسجيل دخول',
  LOGIN_FAILED: 'محاولة دخول فاشلة',
  LOGOUT: 'تسجيل خروج',
  CONTACT_VIEWED: 'عرض طلب تواصل',
  CONTACT_STATUS_CHANGED: 'تغيير حالة طلب',
  CONTACT_NOTE_ADDED: 'إضافة ملاحظة',
  CONTACTS_EXPORTED: 'تصدير طلبات التواصل',
  ADMIN_CREATED: 'إنشاء مستخدم',
  ADMIN_UPDATED: 'تعديل بيانات مستخدم',
  ADMIN_ROLE_CHANGED: 'تغيير صلاحية مستخدم',
  ADMIN_ENABLED: 'تفعيل مستخدم',
  ADMIN_DISABLED: 'تعطيل مستخدم',
  PASSWORD_RESET: 'إعادة تعيين كلمة مرور',
  PASSWORD_CHANGED: 'تغيير كلمة المرور',
}

/** One-line Arabic description of an audit entry, built from its (non-sensitive) metadata. */
export function describeAudit(entry) {
  const m = entry.metadata || {}
  switch (entry.action) {
    case 'CONTACT_STATUS_CHANGED':
      return `${m.fullName ?? 'طلب'}: من «${statusLabel(m.fromStatus)}» إلى «${statusLabel(m.toStatus)}»`
    case 'CONTACT_NOTE_ADDED':
    case 'CONTACT_VIEWED':
      return m.fullName ?? ''
    case 'CONTACTS_EXPORTED':
      return `${m.rows ?? 0} طلب`
    case 'ADMIN_CREATED':
      return `${m.username ?? ''} (${ROLE_LABELS[m.role] ?? m.role ?? ''})${m.via === 'cli' ? ' — من سطر الأوامر' : ''}`
    case 'ADMIN_ROLE_CHANGED':
      return `${m.username}: ${ROLE_LABELS[m.fromRole] ?? m.fromRole} ← ${ROLE_LABELS[m.toRole] ?? m.toRole}`
    case 'PASSWORD_RESET':
      return `${m.username ?? ''}${m.mode === 'GENERATED' ? ' — كلمة مرور مؤقتة' : ''}`
    case 'ADMIN_UPDATED':
    case 'ADMIN_ENABLED':
    case 'ADMIN_DISABLED':
      return m.username ?? ''
    case 'LOGIN_FAILED':
      return m.reason === 'ACCOUNT_DISABLED' ? 'الحساب معطّل' : 'كلمة مرور غير صحيحة'
    default:
      return ''
  }
}
