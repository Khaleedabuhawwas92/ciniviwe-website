import { toLatinDigits } from '@shared/contact.js'

const DEFAULT_COUNTRY_CODE = (import.meta.env.VITE_DEFAULT_COUNTRY_CODE || '').replace(/\D/g, '')

export function telLink(phone) {
  const clean = toLatinDigits(phone || '').replace(/[^\d+]/g, '')
  return clean ? `tel:${clean}` : ''
}

export function mailtoLink(email) {
  return email ? `mailto:${email}` : ''
}

/**
 * wa.me needs an international number. Numbers saved with "+" or "00" are used as-is; local numbers
 * (leading 0) only work when VITE_DEFAULT_COUNTRY_CODE is configured — otherwise no link is shown
 * rather than guessing a country.
 */
export function whatsappLink(phone, message = '') {
  const raw = toLatinDigits(phone || '').trim()
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (raw.startsWith('+')) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2)
  } else if (digits.startsWith('0') && DEFAULT_COUNTRY_CODE) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1)
  } else if (!(DEFAULT_COUNTRY_CODE && digits.startsWith(DEFAULT_COUNTRY_CODE))) {
    return ''
  }
  if (digits.length < 8 || digits.length > 15) return ''
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
