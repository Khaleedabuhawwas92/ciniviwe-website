import mongoose from 'mongoose'
import { CONTACT_STATUS_LABELS, serviceLabel } from '../../../shared/contact.js'
import { AdminAuditLog } from '../models/AdminAuditLog.js'
import {
  parseContactFilters,
  listContacts,
  exportContacts,
  getContactDetails,
  changeContactStatus,
  addContactNote,
  getContactStats,
  latestContacts,
} from '../services/contactRequest.service.js'
import { listAuditLogs, logAudit } from '../services/audit.service.js'
import { parsePagination } from '../utils/pagination.js'
import { toCsv } from '../utils/csv.js'
import { zonedDateKey } from '../utils/dates.js'

const VIEW_AUDIT_THROTTLE_MS = 30 * 60 * 1000

export function createAdminContactsController({ config }) {
  const { timezone } = config

  /** Records CONTACT_VIEWED at most once per admin/request every 30 minutes. */
  async function auditView(admin, contact) {
    const recent = await AdminAuditLog.exists({
      adminUser: admin._id,
      action: 'CONTACT_VIEWED',
      entityId: contact.id,
      createdAt: mongoose.trusted({ $gte: new Date(Date.now() - VIEW_AUDIT_THROTTLE_MS) }),
    })
    if (!recent) {
      await logAudit({
        adminUser: admin._id,
        action: 'CONTACT_VIEWED',
        entityType: 'ContactRequest',
        entityId: contact.id,
        metadata: { fullName: contact.fullName },
      })
    }
  }

  return {
    /** GET /api/admin/dashboard */
    async dashboard(_req, res) {
      const [stats, latest, activity] = await Promise.all([
        getContactStats(timezone),
        latestContacts(6),
        listAuditLogs({ page: 1, limit: 8 }),
      ])
      res.json({ success: true, data: { stats, latestContacts: latest, recentActivity: activity.items } })
    },

    /** GET /api/admin/contacts?q=&status=&service=&from=&to=&sort=newest|oldest&page=&limit= */
    async list(req, res) {
      const filters = parseContactFilters(req.query, timezone)
      const result = await listContacts(filters, parsePagination(req.query))
      res.json({ success: true, data: result.items, pagination: result.pagination })
    },

    /** GET /api/admin/contacts/export — same filters as the list, CSV download. */
    async exportCsv(req, res) {
      const filters = parseContactFilters(req.query, timezone)
      const rows = await exportContacts(filters)
      const csv = toCsv(
        ['الاسم', 'الشركة', 'الهاتف', 'البريد الإلكتروني', 'الخدمة', 'الحالة', 'التاريخ'],
        rows.map((r) => [
          r.fullName,
          r.companyName,
          r.phone,
          r.email,
          serviceLabel(r.service),
          CONTACT_STATUS_LABELS[r.status] ?? r.status,
          new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            dateStyle: 'short',
            timeStyle: 'short',
            hourCycle: 'h23',
          }).format(r.createdAt),
        ]),
      )
      await logAudit({
        adminUser: req.admin._id,
        action: 'CONTACTS_EXPORTED',
        entityType: 'System',
        metadata: { rows: rows.length, filters: { ...req.query } },
      })
      const filename = `cineview-contacts-${zonedDateKey(new Date(), timezone)}.csv`
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      })
      res.send(csv)
    },

    /** GET /api/admin/contacts/:id — includes notes and status history. */
    async details(req, res) {
      const contact = await getContactDetails(req.params.id)
      await auditView(req.admin, contact)
      res.json({ success: true, data: contact })
    },

    /** PATCH /api/admin/contacts/:id/status  { status } */
    async updateStatus(req, res) {
      const contact = await changeContactStatus(req.params.id, req.body?.status, { actor: req.admin })
      res.json({ success: true, message: 'تم تحديث حالة الطلب.', data: contact })
    },

    /** POST /api/admin/contacts/:id/notes  { text } */
    async addNote(req, res) {
      const contact = await addContactNote(req.params.id, req.body?.text, { actor: req.admin })
      res.status(201).json({ success: true, message: 'تم إضافة الملاحظة.', data: contact })
    },
  }
}
