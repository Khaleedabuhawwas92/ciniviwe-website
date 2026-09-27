import nodemailer from 'nodemailer'
import { serviceLabel } from '../../../shared/contact.js'
import { isMailConfigured } from '../config/env.js'
import { setNotificationResult } from './contactRequest.service.js'
import { logger } from '../utils/logger.js'

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Header values must be single-line.
const oneLine = (value = '') => String(value).replace(/[\r\n]+/g, ' ').trim()

export function buildNotificationEmail(request, { timezone = 'UTC' } = {}) {
  const date = new Intl.DateTimeFormat('ar', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(request.createdAt)

  const rows = [
    ['الاسم', request.fullName],
    ['الشركة', request.companyName || '—'],
    ['الهاتف', request.phone || '—'],
    ['البريد', request.email || '—'],
    ['الخدمة', serviceLabel(request.service) || request.service],
    ['الرسالة', request.message],
    ['التاريخ', date],
  ]

  const text = [
    'طلب تواصل جديد من موقع سينيفيو',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `رقم الطلب: ${request.id}`,
  ].join('\n')

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<body style="margin:0;padding:24px;background:#f4f7fc;font-family:Tahoma,Arial,sans-serif;color:#0b162e">
  <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e6ecf6;border-radius:12px;border-collapse:separate;overflow:hidden" dir="rtl">
    <tr><td style="background:#060d1f;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold">طلب تواصل جديد — سينيفيو</td></tr>
    <tr><td style="padding:8px 24px 24px">
      <table role="presentation" width="100%" style="border-collapse:collapse" dir="rtl">
        ${rows
          .map(
            ([label, value]) => `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #e6ecf6;width:90px;vertical-align:top;color:#4b618c;font-weight:bold;white-space:nowrap">${escapeHtml(label)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e6ecf6;vertical-align:top;white-space:pre-wrap">${escapeHtml(value)}</td>
        </tr>`,
          )
          .join('')}
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#6f85ae">رقم الطلب: ${escapeHtml(request.id)}</p>
    </td></tr>
  </table>
</body>
</html>`

  return {
    subject: oneLine(`طلب تواصل جديد: ${request.fullName} — ${serviceLabel(request.service)}`),
    text,
    html,
  }
}

/**
 * Creates the notifier used after a request is saved.
 * It never throws: failures are logged and recorded on the request (notification.status = FAILED).
 */
export function createNotifier(mail) {
  if (!isMailConfigured(mail)) {
    logger.warn('Email notifications disabled: set SMTP_HOST, SMTP_FROM and CONTACT_NOTIFICATION_EMAIL to enable them')
    return {
      enabled: false,
      async notify(request) {
        await setNotificationResult(request._id, { status: 'SKIPPED' })
      },
      async verify() {
        return false
      },
    }
  }

  const transporter = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.secure,
    auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  return {
    enabled: true,
    async notify(request) {
      try {
        const { subject, text, html } = buildNotificationEmail(request, { timezone: mail.timezone })
        await transporter.sendMail({
          from: mail.from,
          to: mail.to,
          ...(request.email && { replyTo: { name: oneLine(request.fullName), address: request.email } }),
          subject,
          text,
          html,
        })
        await setNotificationResult(request._id, { status: 'SENT' })
      } catch (error) {
        // The request is already saved — only record that the email did not go out.
        logger.error('Contact notification email failed', { requestId: request.id, error: error.message })
        await setNotificationResult(request._id, { status: 'FAILED', error: error.message }).catch(() => {})
      }
    },
    /** Checks the SMTP connection/credentials (used at startup, result is only logged). */
    async verify() {
      try {
        await transporter.verify()
        return true
      } catch (error) {
        logger.warn('SMTP verification failed — requests will still be saved', { error: error.message })
        return false
      }
    },
    close: () => transporter.close(),
  }
}
