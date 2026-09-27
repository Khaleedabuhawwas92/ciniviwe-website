/**
 * Contact request rules shared by the website (browser) and the API (Node).
 * Single source of truth for service options, field limits, sanitization and validation.
 * Plain ESM with no dependencies — keep it that way so both sides can import it.
 */

export const SERVICE_OPTIONS = [
  { value: 'system', label: 'تطوير نظام' },
  { value: 'inventory', label: 'نظام إدارة مخزون' },
  { value: 'website', label: 'موقع إلكتروني' },
  { value: 'desktop', label: 'تطبيق سطح مكتب' },
  { value: 'cloud', label: 'حل سحابي' },
  { value: 'custom', label: 'حل مخصص' },
  { value: 'other', label: 'أخرى' },
]

export const SERVICE_VALUES = SERVICE_OPTIONS.map((option) => option.value)

export const serviceLabel = (value) => SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? ''

export const CONTACT_LIMITS = {
  fullName: { min: 3, max: 100 },
  companyName: { max: 120 },
  phone: { max: 20, minDigits: 7, maxDigits: 15 },
  email: { max: 120 },
  message: { min: 10, max: 2000 },
}

export const CONTACT_FIELDS = ['fullName', 'companyName', 'phone', 'email', 'service', 'message']

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const PHONE_PATTERN = /^\+?[\d\s\-()]+$/
const ARABIC_DIGITS = /[٠-٩۰-۹]/g
// Control characters except tab (\t) and newline (\n).
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g
const HTML_TAGS = /<\/?[a-z][^>]*>/gi

/** Converts Arabic-Indic / Persian digits to Latin digits. */
export const toLatinDigits = (value = '') => String(value).replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) % 16))

/**
 * Normalizes one text value: non-strings become '', HTML tags and control characters are removed,
 * whitespace is collapsed (newlines are kept only when `multiline` is true).
 */
export function sanitizeText(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return ''
  let text = value.normalize('NFC').replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').replace(HTML_TAGS, '')
  text = multiline
    ? text
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
    : text.replace(/\s+/g, ' ')
  return text.trim()
}

/** Returns a clean copy of the input containing only the known contact fields. */
export function sanitizeContact(input = {}) {
  const source = input && typeof input === 'object' ? input : {}
  return {
    fullName: sanitizeText(source.fullName),
    companyName: sanitizeText(source.companyName),
    phone: toLatinDigits(sanitizeText(source.phone)),
    email: sanitizeText(source.email).toLowerCase(),
    service: sanitizeText(source.service),
    message: sanitizeText(source.message, { multiline: true }),
  }
}

export const MESSAGES = {
  fullNameRequired: 'يرجى إدخال الاسم الكامل.',
  fullNameShort: 'الاسم قصير جداً.',
  fullNameLong: `الاسم طويل جداً (الحد الأقصى ${CONTACT_LIMITS.fullName.max} حرف).`,
  companyLong: `اسم الشركة طويل جداً (الحد الأقصى ${CONTACT_LIMITS.companyName.max} حرف).`,
  contactRequired: 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني.',
  phoneInvalid: 'يرجى إدخال رقم هاتف صحيح.',
  emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح.',
  serviceRequired: 'يرجى اختيار الخدمة المطلوبة.',
  messageRequired: 'يرجى كتابة رسالتك.',
  messageShort: `يرجى توضيح طلبك في ${CONTACT_LIMITS.message.min} أحرف على الأقل.`,
  messageLong: `الرسالة طويلة جداً (الحد الأقصى ${CONTACT_LIMITS.message.max} حرف).`,
}

/**
 * Validates sanitized values. Returns an object of { field: arabicMessage } (empty when valid).
 * Rules: fullName, service and message are required; at least one of phone / email is required.
 */
export function validateContact(values) {
  const errors = {}
  const { fullName, companyName, phone, email, service, message } = values

  if (!fullName) errors.fullName = MESSAGES.fullNameRequired
  else if (fullName.length < CONTACT_LIMITS.fullName.min) errors.fullName = MESSAGES.fullNameShort
  else if (fullName.length > CONTACT_LIMITS.fullName.max) errors.fullName = MESSAGES.fullNameLong

  if (companyName.length > CONTACT_LIMITS.companyName.max) errors.companyName = MESSAGES.companyLong

  if (!phone && !email) {
    errors.phone = MESSAGES.contactRequired
    errors.email = MESSAGES.contactRequired
  }
  if (phone) {
    const digits = phone.replace(/\D/g, '').length
    const { max, minDigits, maxDigits } = CONTACT_LIMITS.phone
    if (phone.length > max || !PHONE_PATTERN.test(phone) || digits < minDigits || digits > maxDigits) {
      errors.phone = MESSAGES.phoneInvalid
    }
  }
  if (email && (email.length > CONTACT_LIMITS.email.max || !EMAIL_PATTERN.test(email))) {
    errors.email = MESSAGES.emailInvalid
  }

  if (!SERVICE_VALUES.includes(service)) errors.service = MESSAGES.serviceRequired

  if (!message) errors.message = MESSAGES.messageRequired
  else if (message.length < CONTACT_LIMITS.message.min) errors.message = MESSAGES.messageShort
  else if (message.length > CONTACT_LIMITS.message.max) errors.message = MESSAGES.messageLong

  return errors
}
