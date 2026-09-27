import { listAuditLogs } from '../services/audit.service.js'
import { parsePagination } from '../utils/pagination.js'

const str = (value) => (typeof value === 'string' ? value.trim() : '')

/** GET /api/admin/audit?action=&adminUser=&entityId=&page=&limit= */
export async function listAudit(req, res) {
  const result = await listAuditLogs({
    action: str(req.query.action).toUpperCase(),
    adminUser: str(req.query.adminUser),
    entityId: str(req.query.entityId),
    ...parsePagination(req.query, { defaultLimit: 30 }),
  })
  res.json({ success: true, data: result.items, pagination: result.pagination })
}
