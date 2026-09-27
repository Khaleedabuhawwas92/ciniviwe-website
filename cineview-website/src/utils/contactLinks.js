import { toLatinDigits } from '@shared/contact.js'

export { toLatinDigits }

/** Keeps digits only (used for wa.me links). */
export const digitsOnly = (value = '') => toLatinDigits(value).replace(/\D/g, '')

export const hasValue = (value) => typeof value === 'string' && value.trim().length > 0

export function whatsappLink(number, message = '') {
  const digits = digitsOnly(number)
  if (!digits) return ''
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

export function telLink(number) {
  const clean = toLatinDigits(number).replace(/[^\d+]/g, '')
  return clean ? `tel:${clean}` : ''
}

export function mailtoLink(email, subject = '', body = '') {
  if (!hasValue(email)) return ''
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const query = params.toString().replace(/\+/g, '%20')
  return `mailto:${email.trim()}${query ? `?${query}` : ''}`
}
