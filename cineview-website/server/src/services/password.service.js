import { randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'

export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 72 // bcrypt only uses the first 72 bytes

/** Returns an Arabic error message, or '' when the password is acceptable. */
export function passwordPolicyError(password) {
  if (typeof password !== 'string' || !password) return 'يرجى إدخال كلمة المرور.'
  if (password.length < PASSWORD_MIN) return `كلمة المرور يجب أن تكون ${PASSWORD_MIN} أحرف على الأقل.`
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) return 'كلمة المرور طويلة جداً.'
  if (!/[A-Za-z؀-ۿ]/.test(password) || !/\d/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على أحرف وأرقام.'
  }
  return ''
}

export const hashPassword = (password, rounds) => bcrypt.hash(password, rounds)

// Compared against when the account does not exist, so response time does not reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('cineview-timing-equalizer-0', 10)

export async function verifyPassword(password, hash) {
  if (typeof password !== 'string' || !password) return false
  return bcrypt.compare(password, hash || DUMMY_HASH)
}

/** Readable random password (no look-alike characters), shown once to the super admin. */
export function generateTemporaryPassword(length = 14) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = letters + digits
  const chars = [letters[randomInt(letters.length)], digits[randomInt(digits.length)]]
  while (chars.length < length) chars.push(all[randomInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
