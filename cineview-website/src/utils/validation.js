import { toLatinDigits } from './contactLinks'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/

/** Rules for the contact form. Each returns an Arabic error message or ''. */
export const contactRules = {
  fullName: (v) => {
    if (!v.trim()) return 'يرجى إدخال الاسم الكامل.'
    if (v.trim().length < 3) return 'الاسم قصير جداً.'
    return ''
  },
  company: (v) => (v.length > 120 ? 'اسم الشركة طويل جداً.' : ''),
  phone: (v) => {
    const value = toLatinDigits(v).trim()
    if (!value) return 'يرجى إدخال رقم الهاتف.'
    const digits = value.replace(/\D/g, '')
    if (!PHONE_PATTERN.test(value) || digits.length < 7 || digits.length > 15) return 'يرجى إدخال رقم هاتف صحيح.'
    return ''
  },
  email: (v) => {
    if (!v.trim()) return 'يرجى إدخال البريد الإلكتروني.'
    if (!EMAIL_PATTERN.test(v.trim())) return 'يرجى إدخال بريد إلكتروني صحيح.'
    return ''
  },
  service: (v) => (v ? '' : 'يرجى اختيار الخدمة المطلوبة.'),
  message: (v) => {
    if (!v.trim()) return 'يرجى كتابة رسالتك.'
    if (v.trim().length < 10) return 'يرجى توضيح طلبك في 10 أحرف على الأقل.'
    if (v.length > 2000) return 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف).'
    return ''
  },
}
