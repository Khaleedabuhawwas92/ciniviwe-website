import { sanitizeContact, validateContact } from '../../../shared/contact.js'
import { createContactRequest } from '../services/contactRequest.service.js'
import { logger } from '../utils/logger.js'

export const SUCCESS_MESSAGE = 'تم إرسال طلبك بنجاح، سنتواصل معك قريباً.'
export const VALIDATION_MESSAGE = 'يرجى مراجعة البيانات المدخلة.'

/** POST /api/contact */
export function createContactController({ notifier, ipHashSecret }) {
  return async function submitContact(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {}

    // Honeypot: real users never fill this hidden field. Pretend success, store nothing.
    if (typeof body.website === 'string' && body.website.trim()) {
      logger.warn('Honeypot triggered — request discarded')
      return res.status(201).json({ success: true, message: SUCCESS_MESSAGE })
    }

    const values = sanitizeContact(body)
    const errors = validateContact(values)
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: VALIDATION_MESSAGE, errors })
    }

    // 1) Save first — the database is the source of truth.
    const request = await createContactRequest(values, {
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      ipHashSecret,
    })

    // 2) Notify in the background; a mail failure never affects the saved request or the response.
    if (request.status !== 'SPAM') {
      notifier.notify(request).catch((error) => logger.error('Notifier crashed', { error: error.message }))
    }

    return res.status(201).json({ success: true, message: SUCCESS_MESSAGE })
  }
}
