import { test, before, after, beforeEach, describe } from 'node:test'
import assert from 'node:assert/strict'
// helpers.js must be imported before any app module (it sets NODE_ENV=test).
import {
  createApp,
  makeConfig,
  setupDatabase,
  teardownDatabase,
  clearCollections,
  validContact,
  seedAdmin,
  PASSWORD,
  mongoose,
} from './helpers.js'

const { default: request } = await import('supertest')
const { ContactRequest } = await import('../src/models/ContactRequest.js')
const { AdminUser } = await import('../src/models/AdminUser.js')
const { AdminAuditLog } = await import('../src/models/AdminAuditLog.js')
const { AdminSession } = await import('../src/models/AdminSession.js')

const ORIGIN = 'http://localhost:5174'
const XHR = { 'X-Requested-With': 'XMLHttpRequest', Origin: ORIGIN }
const COOKIE = 'cv_admin_rt'

before(setupDatabase)
after(teardownDatabase)
beforeEach(clearCollections)

/** Logs in through the API; returns the agent (keeps the refresh cookie) and the access token. */
async function login(app, usernameOrEmail, password = PASSWORD) {
  const agent = request.agent(app)
  const res = await agent.post('/api/admin/auth/login').set('Origin', ORIGIN).send({ usernameOrEmail, password })
  assert.equal(res.status, 200, `login failed: ${JSON.stringify(res.body)}`)
  return { agent, token: res.body.data.accessToken, res }
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` })

async function submitContacts(app, overrides = []) {
  for (const extra of overrides) {
    const res = await request(app).post('/api/contact').send({ ...validContact(), ...extra })
    assert.equal(res.status, 201)
  }
}

/** Asserts that no password hash / secret-looking field appears anywhere in a JSON body. */
function assertNoSecrets(body) {
  const json = JSON.stringify(body)
  assert.ok(!/passwordHash|tokenHash|ipHash|refreshToken/.test(json), `secret field leaked: ${json.slice(0, 300)}`)
  assert.ok(!/\$2[aby]\$\d\d\$/.test(json), 'bcrypt hash leaked')
}

describe('admin authentication', () => {
  test('A. correct login returns profile + access token and sets an httpOnly refresh cookie', async () => {
    const admin = await seedAdmin({ username: 'sara', role: 'SUPER_ADMIN' })
    const app = createApp(makeConfig())

    for (const identifier of ['sara', 'SARA@cineview.test']) {
      const { res } = await login(app, identifier)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.admin.id, admin.id)
      assert.equal(res.body.data.admin.role, 'SUPER_ADMIN')
      assert.match(res.body.data.accessToken, /^[\w-]+\.[\w-]+\.[\w-]+$/)
      const cookie = res.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE}=`))
      assert.match(cookie, /HttpOnly/i)
      assert.match(cookie, /SameSite=Strict/i)
      assert.match(cookie, /Path=\/api\/admin\/auth/)
      assert.ok(!JSON.stringify(res.body).includes(cookie.split(';')[0].split('=')[1]), 'refresh token not in body')
      assertNoSecrets(res.body)
    }

    const stored = await AdminUser.findById(admin.id).lean()
    assert.ok(stored.lastLoginAt)
    assert.ok(await AdminAuditLog.exists({ action: 'LOGIN', adminUser: admin.id }))
  })

  test('B. wrong password and unknown user get the same generic 401', async () => {
    await seedAdmin({ username: 'omar' })
    const app = createApp(makeConfig())
    const wrong = await request(app).post('/api/admin/auth/login').send({ usernameOrEmail: 'omar', password: 'Wrong-pass-123' })
    const unknown = await request(app).post('/api/admin/auth/login').send({ usernameOrEmail: 'nobody', password: 'Wrong-pass-123' })
    const empty = await request(app).post('/api/admin/auth/login').send({})
    for (const res of [wrong, unknown, empty]) {
      assert.equal(res.status, 401)
      assert.equal(res.body.message, 'بيانات الدخول غير صحيحة')
      assert.equal(res.headers['set-cookie'], undefined)
    }
    assert.ok(await AdminAuditLog.exists({ action: 'LOGIN_FAILED' }))
  })

  test('C. disabled admin cannot log in (even with the right password)', async () => {
    const admin = await seedAdmin({ username: 'disabled1' })
    await AdminUser.updateOne({ _id: admin.id }, { status: 'DISABLED' })
    const app = createApp(makeConfig())
    const res = await request(app).post('/api/admin/auth/login').send({ usernameOrEmail: 'disabled1', password: PASSWORD })
    assert.equal(res.status, 401)
    assert.equal(res.body.message, 'بيانات الدخول غير صحيحة')
  })

  test('D. admin API without / with an invalid token → 401', async () => {
    const app = createApp(makeConfig())
    const paths = [
      ['get', '/api/admin/dashboard'],
      ['get', '/api/admin/contacts'],
      ['get', '/api/admin/contacts/export'],
      ['get', '/api/admin/audit'],
      ['get', '/api/admin/users'],
      ['get', '/api/admin/auth/me'],
      ['patch', '/api/admin/contacts/000000000000000000000000/status'],
      ['post', '/api/admin/contacts/000000000000000000000000/notes'],
    ]
    for (const [method, path] of paths) {
      assert.equal((await request(app)[method](path)).status, 401, `${method} ${path}`)
      assert.equal((await request(app)[method](path).set(bearer('not.a.jwt'))).status, 401)
    }
    // The old static API key is no longer accepted.
    assert.equal((await request(app).get('/api/admin/contacts').set(bearer('test-admin-key-0123456789-abcdefghijklmnop'))).status, 401)
    // A token signed with another secret is rejected.
    const { default: jwt } = await import('jsonwebtoken')
    const forged = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), sid: new mongoose.Types.ObjectId().toString(), role: 'SUPER_ADMIN' }, 'other-secret', { issuer: 'cineview-api', audience: 'cineview-admin' })
    assert.equal((await request(app).get('/api/admin/users').set(bearer(forged))).status, 401)
  })

  test('L. refresh rotates the token; logout revokes the session; reused tokens are rejected', async () => {
    await seedAdmin({ username: 'layla' })
    const app = createApp(makeConfig())
    const { agent, token } = await login(app, 'layla')

    // /me works with the access token
    const me = await request(app).get('/api/admin/auth/me').set(bearer(token))
    assert.equal(me.status, 200)
    assert.equal(me.body.data.admin.username, 'layla')
    assertNoSecrets(me.body)

    // Refresh needs the CSRF header + an allowed origin
    assert.equal((await agent.post('/api/admin/auth/refresh')).status, 403)
    assert.equal((await agent.post('/api/admin/auth/refresh').set({ ...XHR, Origin: 'https://evil.example' })).status, 403)

    const firstCookie = (await AdminSession.findOne().lean()).tokenHash
    const refreshed = await agent.post('/api/admin/auth/refresh').set(XHR)
    assert.equal(refreshed.status, 200)
    assert.ok(refreshed.body.data.accessToken)
    assert.notEqual((await AdminSession.findOne().lean()).tokenHash, firstCookie, 'refresh token rotated')
    assert.equal((await request(app).get('/api/admin/auth/me').set(bearer(refreshed.body.data.accessToken))).status, 200)

    // Logout revokes the session: refresh and the old access token stop working
    const out = await agent.post('/api/admin/auth/logout').set(XHR)
    assert.equal(out.status, 200)
    assert.equal((await agent.post('/api/admin/auth/refresh').set(XHR)).status, 401)
    assert.equal((await request(app).get('/api/admin/auth/me').set(bearer(refreshed.body.data.accessToken))).status, 401)
    assert.ok(await AdminAuditLog.exists({ action: 'LOGOUT' }))

    // Refresh without any cookie
    assert.equal((await request(app).post('/api/admin/auth/refresh').set(XHR)).status, 401)
  })

  test('replaying a rotated refresh token (after the grace window) revokes the session', async () => {
    await seedAdmin({ username: 'theft' })
    const app = createApp(makeConfig())
    const res = await request(app).post('/api/admin/auth/login').send({ usernameOrEmail: 'theft', password: PASSWORD })
    const stolen = res.headers['set-cookie'][0].split(';')[0] // "cv_admin_rt=..."

    const rotated = await request(app).post('/api/admin/auth/refresh').set(XHR).set('Cookie', stolen)
    assert.equal(rotated.status, 200)
    await AdminSession.updateOne({}, { rotatedAt: new Date(Date.now() - 60_000) }) // leave the grace window

    assert.equal((await request(app).post('/api/admin/auth/refresh').set(XHR).set('Cookie', stolen)).status, 401)
    const session = await AdminSession.findOne().lean()
    assert.equal(session.revokedReason, 'TOKEN_REUSE')
    const fresh = rotated.headers['set-cookie'][0].split(';')[0]
    assert.equal((await request(app).post('/api/admin/auth/refresh').set(XHR).set('Cookie', fresh)).status, 401)
  })

  test('disabling an admin ends their active sessions immediately', async () => {
    await seedAdmin({ username: 'boss', role: 'SUPER_ADMIN' })
    const staff = await seedAdmin({ username: 'staff1' })
    const app = createApp(makeConfig())
    const { token: bossToken } = await login(app, 'boss')
    const { token: staffToken } = await login(app, 'staff1')
    assert.equal((await request(app).get('/api/admin/contacts').set(bearer(staffToken))).status, 200)

    const res = await request(app).patch(`/api/admin/users/${staff.id}`).set(bearer(bossToken)).send({ status: 'DISABLED' })
    assert.equal(res.status, 200)
    assert.equal((await request(app).get('/api/admin/contacts').set(bearer(staffToken))).status, 401)
  })

  test('change own password: requires current password, audits, ends other sessions', async () => {
    await seedAdmin({ username: 'self' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'self')
    const { token: other } = await login(app, 'self')

    const bad = await request(app).post('/api/admin/auth/change-password').set(bearer(token)).send({ currentPassword: 'nope', newPassword: 'NewPassw0rd99' })
    assert.equal(bad.status, 400)
    assert.ok(bad.body.errors.currentPassword)
    const weak = await request(app).post('/api/admin/auth/change-password').set(bearer(token)).send({ currentPassword: PASSWORD, newPassword: 'short' })
    assert.equal(weak.status, 400)

    const ok = await request(app).post('/api/admin/auth/change-password').set(bearer(token)).send({ currentPassword: PASSWORD, newPassword: 'NewPassw0rd99' })
    assert.equal(ok.status, 200)
    assert.equal((await request(app).get('/api/admin/auth/me').set(bearer(token))).status, 200, 'current session kept')
    assert.equal((await request(app).get('/api/admin/auth/me').set(bearer(other))).status, 401, 'other sessions ended')
    await login(app, 'self', 'NewPassw0rd99')
    const entry = await AdminAuditLog.findOne({ action: 'PASSWORD_CHANGED' }).lean()
    assert.ok(entry)
    assert.ok(!JSON.stringify(entry).includes('NewPassw0rd99'))
  })

  test('login rate limit counts failed attempts only', async () => {
    await seedAdmin({ username: 'rluser' })
    const app = createApp(makeConfig({ auth: { loginRateLimit: { windowMs: 60_000, max: 3 } } }))
    // Successful logins are not counted
    for (let i = 0; i < 4; i++) await login(app, 'rluser')
    for (let i = 0; i < 3; i++) {
      assert.equal((await request(app).post('/api/admin/auth/login').send({ usernameOrEmail: 'rluser', password: 'bad-password-1' })).status, 401)
    }
    const blocked = await request(app).post('/api/admin/auth/login').send({ usernameOrEmail: 'rluser', password: PASSWORD })
    assert.equal(blocked.status, 429)
    assert.match(blocked.body.message, /محاولات دخول كثيرة/)
  })
})

describe('contact management', () => {
  test('E/M. list with search, filters, sorting and pagination', async () => {
    await seedAdmin({ username: 'lister' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'lister')

    await submitContacts(app, [
      { fullName: 'خالد يوسف', companyName: 'مؤسسة النور', email: 'k@nour.sa', phone: '050 111 2222', service: 'website' },
      { fullName: 'منى علي', companyName: 'شركة البيان', email: 'mona@bayan.sa', phone: '', service: 'inventory' },
      { fullName: 'سامي فهد', companyName: '', email: 'sami@example.com', phone: '+966 55 000 1111', service: 'cloud' },
    ])
    // Backdate one request to test date filters
    await ContactRequest.collection.updateOne({ fullName: 'منى علي' }, { $set: { createdAt: new Date('2026-01-10T10:00:00Z') } }) // createdAt is immutable in Mongoose

    const get = (query) => request(app).get('/api/admin/contacts').query(query).set(bearer(token))

    const all = await get({})
    assert.equal(all.status, 200)
    assert.equal(all.body.pagination.total, 3)
    assert.equal(all.body.data[0].fullName, 'سامي فهد', 'newest first by default')
    for (const item of all.body.data) {
      assert.equal(item.notes, undefined, 'notes not included in list')
      assert.equal(item.statusHistory, undefined)
    }
    assertNoSecrets(all.body)

    assert.equal((await get({ sort: 'oldest' })).body.data[0].fullName, 'منى علي')
    assert.equal((await get({ q: 'النور' })).body.data.length, 1, 'company search')
    assert.equal((await get({ q: 'mona@' })).body.data.length, 1, 'email search')
    assert.equal((await get({ q: 'سامي' })).body.data.length, 1, 'name search')
    assert.equal((await get({ q: '0501112222' })).body.data[0]?.fullName, 'خالد يوسف', 'phone search ignores spaces')
    assert.equal((await get({ q: '.*' })).body.data.length, 0, 'regex characters are literal')
    assert.equal((await get({ service: 'cloud' })).body.data.length, 1)
    assert.equal((await get({ status: 'NEW' })).body.data.length, 3)
    assert.equal((await get({ from: '2026-01-10', to: '2026-01-10' })).body.data.length, 1, 'date range inclusive')
    assert.equal((await get({ to: '2026-01-09' })).body.data.length, 0)

    const page1 = await get({ limit: 2, page: 1 })
    const page2 = await get({ limit: 2, page: 2 })
    assert.equal(page1.body.data.length, 2)
    assert.equal(page2.body.data.length, 1)
    assert.deepEqual(page1.body.pagination, { page: 1, limit: 2, total: 3, pages: 2 })

    assert.equal((await get({ status: 'DELETED' })).status, 400)
    assert.equal((await get({ service: 'hack' })).status, 400)
    assert.equal((await get({ from: '2026-13-45' })).status, 400)
    assert.equal((await get({ q: { $gt: '' } })).status, 200, 'object query params are ignored, not executed')
  })

  test('F/G. status change with history, notes, details, audit', async () => {
    const admin = await seedAdmin({ username: 'worker', fullName: 'نورة سالم' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'worker')
    await submitContacts(app, [{}])
    const id = (await ContactRequest.findOne().lean())._id.toString()

    const details = await request(app).get(`/api/admin/contacts/${id}`).set(bearer(token))
    assert.equal(details.status, 200)
    assert.equal(details.body.data.hasIpHash, true)
    assert.deepEqual(details.body.data.notes, [])
    assertNoSecrets(details.body)

    // F. status change
    const s1 = await request(app).patch(`/api/admin/contacts/${id}/status`).set(bearer(token)).send({ status: 'CONTACTED' })
    assert.equal(s1.status, 200)
    assert.equal(s1.body.data.status, 'CONTACTED')
    const s2 = await request(app).patch(`/api/admin/contacts/${id}/status`).set(bearer(token)).send({ status: 'in_progress' })
    assert.equal(s2.body.data.status, 'IN_PROGRESS')
    assert.equal((await request(app).patch(`/api/admin/contacts/${id}/status`).set(bearer(token)).send({ status: 'IN_PROGRESS' })).status, 400, 'same status')
    assert.equal((await request(app).patch(`/api/admin/contacts/${id}/status`).set(bearer(token)).send({ status: 'DELETED' })).status, 400)

    const history = s2.body.data.statusHistory
    assert.equal(history.length, 2)
    assert.deepEqual(
      history.map((h) => [h.fromStatus, h.toStatus]),
      [['CONTACTED', 'IN_PROGRESS'], ['NEW', 'CONTACTED']],
    )
    assert.equal(history[0].changedBy.fullName, 'نورة سالم')

    // G. notes
    const note = await request(app).post(`/api/admin/contacts/${id}/notes`).set(bearer(token)).send({ text: '<b>اتصلت</b> بالعميل وحددنا موعداً.' })
    assert.equal(note.status, 201)
    assert.equal(note.body.data.notes.length, 1)
    assert.equal(note.body.data.notes[0].text, 'اتصلت بالعميل وحددنا موعداً.')
    assert.equal(note.body.data.notes[0].admin.id, admin.id)
    assert.equal((await request(app).post(`/api/admin/contacts/${id}/notes`).set(bearer(token)).send({ text: '   ' })).status, 400)
    assert.equal((await request(app).post(`/api/admin/contacts/${id}/notes`).set(bearer(token)).send({ text: 'x'.repeat(2001) })).status, 400)

    // Unknown ids
    assert.equal((await request(app).get('/api/admin/contacts/not-an-id').set(bearer(token))).status, 404)
    assert.equal((await request(app).get(`/api/admin/contacts/${new mongoose.Types.ObjectId()}`).set(bearer(token))).status, 404)

    // Audit trail
    const actions = (await AdminAuditLog.find({ entityId: id }).lean()).map((e) => e.action).sort()
    assert.deepEqual(actions, ['CONTACT_NOTE_ADDED', 'CONTACT_STATUS_CHANGED', 'CONTACT_STATUS_CHANGED', 'CONTACT_VIEWED'])
    const noteAudit = await AdminAuditLog.findOne({ action: 'CONTACT_NOTE_ADDED' }).lean()
    assert.ok(!JSON.stringify(noteAudit).includes('اتصلت'), 'note text not copied into the audit log')
  })

  test('H. internal notes never reach public endpoints', async () => {
    await seedAdmin({ username: 'noter' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'noter')
    await submitContacts(app, [{}])
    const id = (await ContactRequest.findOne().lean())._id.toString()
    await request(app).post(`/api/admin/contacts/${id}/notes`).set(bearer(token)).send({ text: 'SECRET-INTERNAL-NOTE' })

    // The public API only has POST /api/contact; its response carries nothing but a message.
    const pub = await request(app).post('/api/contact').send(validContact())
    assert.deepEqual(Object.keys(pub.body).sort(), ['message', 'success'])
    for (const path of ['/api/contact', `/api/contact/${id}`, '/api/contacts', `/api/contacts/${id}`, '/api/health']) {
      const res = await request(app).get(path)
      assert.ok(!JSON.stringify(res.body).includes('SECRET-INTERNAL-NOTE'), path)
    }
    // Without auth, the admin detail endpoint returns nothing
    const anon = await request(app).get(`/api/admin/contacts/${id}`)
    assert.equal(anon.status, 401)
    assert.ok(!JSON.stringify(anon.body).includes('SECRET-INTERNAL-NOTE'))
    // Notes are never part of a document loaded without explicit selection
    assert.equal((await ContactRequest.findById(id).lean()).notes, undefined)
  })

  test('CSV export: filtered, no internal/security fields, audited', async () => {
    await seedAdmin({ username: 'exporter' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'exporter')
    await submitContacts(app, [
      { fullName: 'مصدر أول', service: 'website' },
      { fullName: '=HYPERLINK("http://x")', service: 'cloud', phone: '+966 50 000 0000' },
    ])
    const res = await request(app).get('/api/admin/contacts/export').query({ service: 'cloud' }).set(bearer(token))
    assert.equal(res.status, 200)
    assert.match(res.headers['content-type'], /text\/csv/)
    assert.match(res.headers['content-disposition'], /attachment; filename="cineview-contacts-\d{4}-\d{2}-\d{2}\.csv"/)
    const csv = res.text
    assert.ok(csv.startsWith('﻿'))
    const lines = csv.trim().split('\r\n')
    assert.equal(lines[0].replace('﻿', ''), 'الاسم,الشركة,الهاتف,البريد الإلكتروني,الخدمة,الحالة,التاريخ')
    assert.equal(lines.length, 2, 'only the filtered row')
    assert.ok(lines[1].startsWith(`"'=HYPERLINK(""http://x"")"`), 'formula neutralized')
    assert.ok(lines[1].includes('+966 50 000 0000'), 'phone kept as-is')
    assert.ok(lines[1].includes('حل سحابي') && lines[1].includes('جديد'))
    assert.ok(!/ipHash|userAgent|notes|Mozilla/i.test(csv))
    assert.ok(await AdminAuditLog.exists({ action: 'CONTACTS_EXPORTED' }))
  })

  test('N. dashboard counts come from the database', async () => {
    await seedAdmin({ username: 'dash' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'dash')

    await submitContacts(app, [
      { service: 'website' },
      { service: 'website' },
      { service: 'inventory' },
      { service: 'cloud' },
      { service: 'other', message: 'روابط http://a.io http://b.io http://c.io http://d.io' }, // stored as SPAM
    ])
    const ids = (await ContactRequest.find().sort({ createdAt: 1 }).lean()).map((d) => d._id)
    await ContactRequest.updateOne({ _id: ids[0] }, { status: 'CONTACTED' })
    await ContactRequest.updateOne({ _id: ids[1] }, { status: 'CLOSED' })
    // One old request: counted in totals, not in today / this month / last 7 days
    await ContactRequest.collection.updateOne({ _id: ids[3] }, { $set: { createdAt: new Date('2025-01-01T12:00:00Z') } })

    const res = await request(app).get('/api/admin/dashboard').set(bearer(token))
    assert.equal(res.status, 200)
    const { stats, latestContacts, recentActivity } = res.body.data
    assert.equal(stats.total, 5)
    assert.deepEqual(stats.byStatus, { NEW: 2, CONTACTED: 1, IN_PROGRESS: 0, CLOSED: 1, SPAM: 1 })
    assert.equal(stats.today, 4)
    assert.equal(stats.thisMonth, 4)
    const byService = Object.fromEntries(stats.byService.map((s) => [s.service, s.count]))
    assert.deepEqual(byService, { system: 0, inventory: 1, website: 2, desktop: 0, cloud: 1, custom: 0, other: 0 }, 'spam excluded')
    assert.equal(stats.lastDays.length, 7)
    assert.equal(stats.lastDays.at(-1).count, 3, 'today, excluding spam')
    assert.equal(stats.lastDays.reduce((sum, d) => sum + d.count, 0), 3)
    assert.equal(latestContacts.length, 5)
    assert.ok(Array.isArray(recentActivity) && recentActivity.some((a) => a.action === 'LOGIN'))
    assertNoSecrets(res.body)
  })
})

describe('admin users (SUPER_ADMIN)', () => {
  test('I. ADMIN cannot use admin-management endpoints', async () => {
    await seedAdmin({ username: 'regular' })
    const target = await seedAdmin({ username: 'target' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'regular')
    const calls = [
      request(app).get('/api/admin/users'),
      request(app).post('/api/admin/users').send({ fullName: 'x y', username: 'newone', email: 'n@x.io', password: PASSWORD }),
      request(app).patch(`/api/admin/users/${target.id}`).send({ role: 'SUPER_ADMIN' }),
      request(app).post(`/api/admin/users/${target.id}/reset-password`),
    ]
    for (const call of calls) {
      const res = await call.set(bearer(token))
      assert.equal(res.status, 403)
    }
    assert.equal(await AdminUser.countDocuments(), 2, 'nothing created')
    assert.equal((await AdminUser.findById(target.id).lean()).role, 'ADMIN')
  })

  test('J/K. SUPER_ADMIN creates, updates, disables, re-enables and resets admins — no hashes exposed', async () => {
    await seedAdmin({ username: 'root', role: 'SUPER_ADMIN' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'root')

    const created = await request(app).post('/api/admin/users').set(bearer(token))
      .send({ fullName: 'ريم خالد', username: 'Reem.K', email: 'reem@cineview.test', role: 'ADMIN', password: 'Temp0rary-Pass' })
    assert.equal(created.status, 201)
    assert.equal(created.body.data.username, 'reem.k')
    assert.equal(created.body.data.status, 'ACTIVE')
    assertNoSecrets(created.body)
    const id = created.body.data.id

    // Validation + uniqueness
    const dup = await request(app).post('/api/admin/users').set(bearer(token))
      .send({ fullName: 'آخر', username: 'reem.k', email: 'other@cineview.test', password: 'Temp0rary-Pass' })
    assert.equal(dup.status, 409)
    assert.ok(dup.body.errors.username)
    const weak = await request(app).post('/api/admin/users').set(bearer(token))
      .send({ fullName: 'ضعيف', username: 'weak', email: 'weak@cineview.test', password: '123' })
    assert.equal(weak.status, 400)
    assert.ok(weak.body.errors.password)

    // The new admin can log in
    await login(app, 'reem@cineview.test', 'Temp0rary-Pass')

    const list = await request(app).get('/api/admin/users').set(bearer(token))
    assert.equal(list.body.data.length, 2)
    assertNoSecrets(list.body)

    const promoted = await request(app).patch(`/api/admin/users/${id}`).set(bearer(token)).send({ role: 'SUPER_ADMIN', fullName: 'ريم خالد العلي' })
    assert.equal(promoted.body.data.role, 'SUPER_ADMIN')
    const disabled = await request(app).patch(`/api/admin/users/${id}`).set(bearer(token)).send({ status: 'DISABLED' })
    assert.equal(disabled.body.data.status, 'DISABLED')
    const enabled = await request(app).patch(`/api/admin/users/${id}`).set(bearer(token)).send({ status: 'ACTIVE' })
    assert.equal(enabled.body.data.status, 'ACTIVE')

    // Reset: generated temporary password (shown once) and a manual one
    const reset = await request(app).post(`/api/admin/users/${id}/reset-password`).set(bearer(token)).send({})
    assert.equal(reset.status, 200)
    const temp = reset.body.data.temporaryPassword
    assert.match(temp, /^[A-Za-z0-9]{14}$/)
    assertNoSecrets(reset.body)
    await login(app, 'reem.k', temp)
    const manual = await request(app).post(`/api/admin/users/${id}/reset-password`).set(bearer(token)).send({ password: 'Manual-Passw0rd' })
    assert.equal(manual.body.data.temporaryPassword, undefined)
    await login(app, 'reem.k', 'Manual-Passw0rd')

    const actions = (await AdminAuditLog.find({ entityId: id }).lean()).map((e) => e.action)
    for (const a of ['ADMIN_CREATED', 'ADMIN_ROLE_CHANGED', 'ADMIN_UPDATED', 'ADMIN_DISABLED', 'ADMIN_ENABLED', 'PASSWORD_RESET']) {
      assert.ok(actions.includes(a), `audited ${a}`)
    }
    const allAudit = JSON.stringify(await AdminAuditLog.find().lean())
    assert.ok(!allAudit.includes(temp) && !allAudit.includes('Manual-Passw0rd') && !allAudit.includes('Temp0rary-Pass'), 'no passwords in audit')

    // Audit API
    const audit = await request(app).get('/api/admin/audit').query({ action: 'PASSWORD_RESET' }).set(bearer(token))
    assert.equal(audit.status, 200)
    assert.equal(audit.body.data.length, 2)
    assert.equal(audit.body.data[0].admin.username, 'root')
  })

  test('safety rules: no self-disable/demotion, keep at least one active SUPER_ADMIN', async () => {
    const root = await seedAdmin({ username: 'onlyroot', role: 'SUPER_ADMIN' })
    const app = createApp(makeConfig())
    const { token } = await login(app, 'onlyroot')
    assert.equal((await request(app).patch(`/api/admin/users/${root.id}`).set(bearer(token)).send({ status: 'DISABLED' })).status, 400)
    assert.equal((await request(app).patch(`/api/admin/users/${root.id}`).set(bearer(token)).send({ role: 'ADMIN' })).status, 400)
    assert.equal((await request(app).patch(`/api/admin/users/${root.id}`).set(bearer(token)).send({ username: 'renamed' })).body.data.username, 'onlyroot', 'username is immutable')
  })
})

describe('public site unaffected', () => {
  test('O/P. POST /api/contact still works and its rate limit still applies', async () => {
    const app = createApp(makeConfig({ rateLimit: { windowMs: 60_000, max: 2 } }))
    const ok = await request(app).post('/api/contact').set('Origin', 'http://localhost:5173').send(validContact())
    assert.equal(ok.status, 201)
    assert.deepEqual(ok.body, { success: true, message: 'تم إرسال طلبك بنجاح، سنتواصل معك قريباً.' })
    assert.equal(ok.headers['access-control-allow-origin'], 'http://localhost:5173')
    assert.equal((await request(app).post('/api/contact').send(validContact())).status, 201)
    assert.equal((await request(app).post('/api/contact').send(validContact())).status, 429)
    assert.equal(await ContactRequest.countDocuments(), 2)
  })

  test('CORS allows the admin origin with credentials, never a wildcard', async () => {
    const app = createApp(makeConfig({ corsOrigins: ['http://localhost:5173', 'http://localhost:5174', '*'] }))
    const admin = await request(app).options('/api/admin/auth/login').set('Origin', ORIGIN).set('Access-Control-Request-Method', 'POST')
    assert.equal(admin.headers['access-control-allow-origin'], ORIGIN)
    assert.equal(admin.headers['access-control-allow-credentials'], 'true')
    const evil = await request(app).options('/api/admin/auth/login').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'POST')
    assert.equal(evil.headers['access-control-allow-origin'], undefined)
  })
})
