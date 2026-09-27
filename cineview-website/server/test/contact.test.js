import { test, before, after, beforeEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:net'
// helpers.js must be imported before any app module (it sets NODE_ENV=test).
import {
  createApp,
  makeConfig,
  setupDatabase,
  teardownDatabase,
  clearCollections,
  validContact as validBody,
  waitFor,
} from './helpers.js'

const { default: request } = await import('supertest')
const { SMTPServer } = await import('smtp-server')
const { ContactRequest } = await import('../src/models/ContactRequest.js')

/** A port with nothing listening on it (used to simulate an unreachable SMTP server). */
async function closedPort() {
  const srv = createServer()
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  const { port } = srv.address()
  await new Promise((r) => srv.close(r))
  return port
}

before(setupDatabase)
after(teardownDatabase)
beforeEach(clearCollections)

describe('POST /api/contact', () => {
  test('A/G. valid submission is saved and returns the success message', async () => {
    const app = createApp(makeConfig())
    const res = await request(app).post('/api/contact').set('User-Agent', 'test-agent').send(validBody())

    assert.equal(res.status, 201)
    assert.deepEqual(res.body, { success: true, message: 'تم إرسال طلبك بنجاح، سنتواصل معك قريباً.' })

    const docs = await ContactRequest.find().select('+ipHash').lean()
    assert.equal(docs.length, 1)
    const doc = docs[0]
    assert.equal(doc.fullName, 'أحمد محمد')
    assert.equal(doc.companyName, 'شركة الاختبار')
    assert.equal(doc.phone, '+966 50 123 4567', 'Arabic digits normalized')
    assert.equal(doc.email, 'ahmed@example.com', 'email lowercased')
    assert.equal(doc.service, 'inventory')
    assert.equal(doc.status, 'NEW')
    assert.equal(doc.source, 'WEBSITE')
    assert.equal(doc.userAgent, 'test-agent')
    assert.match(doc.ipHash, /^[a-f0-9]{64}$/, 'IP stored only as a hash')
    assert.ok(doc.createdAt instanceof Date && doc.updatedAt instanceof Date)

    // No mail configured → notification marked SKIPPED
    await waitFor(async () => (await ContactRequest.findById(doc._id)).notification.status === 'SKIPPED')
  })

  test('accepts phone only or email only', async () => {
    const app = createApp(makeConfig())
    const phoneOnly = { ...validBody(), email: '' }
    const emailOnly = { ...validBody(), phone: '' }
    assert.equal((await request(app).post('/api/contact').send(phoneOnly)).status, 201)
    assert.equal((await request(app).post('/api/contact').send(emailOnly)).status, 201)
    assert.equal(await ContactRequest.countDocuments(), 2)
  })

  test('B. missing required fields are rejected and nothing is stored', async () => {
    const app = createApp(makeConfig())
    const cases = [
      [{ ...validBody(), fullName: '' }, 'fullName'],
      [{ ...validBody(), service: '' }, 'service'],
      [{ ...validBody(), message: '   ' }, 'message'],
      [{ ...validBody(), phone: '', email: '' }, 'phone'],
    ]
    for (const [body, field] of cases) {
      const res = await request(app).post('/api/contact').send(body)
      assert.equal(res.status, 400, `missing ${field}`)
      assert.equal(res.body.success, false)
      assert.ok(res.body.errors[field], `error for ${field}`)
    }
    const empty = await request(app).post('/api/contact').send({})
    assert.equal(empty.status, 400)
    assert.deepEqual(Object.keys(empty.body.errors).sort(), ['email', 'fullName', 'message', 'phone', 'service'])
    assert.equal(await ContactRequest.countDocuments(), 0)
  })

  test('C. invalid email / phone / service are rejected', async () => {
    const app = createApp(makeConfig())
    const badEmail = await request(app).post('/api/contact').send({ ...validBody(), email: 'not-an-email' })
    assert.equal(badEmail.status, 400)
    assert.equal(badEmail.body.errors.email, 'يرجى إدخال بريد إلكتروني صحيح.')

    const badPhone = await request(app).post('/api/contact').send({ ...validBody(), phone: '12ab' })
    assert.equal(badPhone.status, 400)
    assert.ok(badPhone.body.errors.phone)

    const badService = await request(app).post('/api/contact').send({ ...validBody(), service: 'hacking' })
    assert.equal(badService.status, 400)
    assert.ok(badService.body.errors.service)
    assert.equal(await ContactRequest.countDocuments(), 0)
  })

  test('enforces max lengths', async () => {
    const app = createApp(makeConfig())
    const res = await request(app)
      .post('/api/contact')
      .send({ ...validBody(), fullName: 'أ'.repeat(101), message: 'م'.repeat(2001), companyName: 'ش'.repeat(121) })
    assert.equal(res.status, 400)
    assert.ok(res.body.errors.fullName && res.body.errors.message && res.body.errors.companyName)
  })

  test('sanitizes input: strips HTML/control chars and rejects non-string (operator) payloads', async () => {
    const app = createApp(makeConfig())
    const res = await request(app)
      .post('/api/contact')
      .send({
        ...validBody(),
        fullName: '<script>alert(1)</script>سارة\u0000 علي',
        message: '<b>مرحبا</b>   أريد   موقعاً\r\n\r\n\r\n\r\nللشركة',
        extraField: 'ignored',
      })
    assert.equal(res.status, 201)
    const doc = await ContactRequest.findOne().lean()
    assert.equal(doc.fullName, 'alert(1)سارة علي')
    assert.equal(doc.message, 'مرحبا أريد موقعاً\n\nللشركة')
    assert.equal(doc.extraField, undefined)

    const injection = await request(app)
      .post('/api/contact')
      .send({ ...validBody(), fullName: { $gt: '' }, email: { $ne: null } })
    assert.equal(injection.status, 400)
    assert.ok(injection.body.errors.fullName)
  })

  test('honeypot submissions get a success response but are not stored', async () => {
    const app = createApp(makeConfig())
    const res = await request(app).post('/api/contact').send({ ...validBody(), website: 'http://spam.example' })
    assert.equal(res.status, 201)
    assert.equal(res.body.success, true)
    assert.equal(await ContactRequest.countDocuments(), 0)
  })

  test('link-stuffed messages are stored as SPAM without notification', async () => {
    const app = createApp(makeConfig())
    const message = 'اشترِ الآن http://a.io http://b.io http://c.io www.d.io'
    const res = await request(app).post('/api/contact').send({ ...validBody(), message })
    assert.equal(res.status, 201)
    const doc = await ContactRequest.findOne().lean()
    assert.equal(doc.status, 'SPAM')
    assert.equal(doc.notification.status, 'SKIPPED')
  })

  test('malformed JSON and oversized bodies are rejected cleanly', async () => {
    const app = createApp(makeConfig())
    const bad = await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{"fullName": ')
    assert.equal(bad.status, 400)
    assert.equal(bad.body.success, false)
    const big = await request(app).post('/api/contact').send({ ...validBody(), message: 'x'.repeat(20_000) })
    assert.equal(big.status, 413)
  })

  test('D. rate limit blocks after the configured number of requests', async () => {
    const app = createApp(makeConfig({ rateLimit: { windowMs: 60_000, max: 3 } }))
    for (let i = 0; i < 3; i++) {
      assert.equal((await request(app).post('/api/contact').send(validBody())).status, 201)
    }
    const blocked = await request(app).post('/api/contact').send(validBody())
    assert.equal(blocked.status, 429)
    assert.equal(blocked.body.success, false)
    assert.match(blocked.body.message, /تجاوزت/)
    assert.ok(blocked.headers['ratelimit-policy'] || blocked.headers['ratelimit'])
    assert.equal(await ContactRequest.countDocuments(), 3)
  })
})

describe('email notification', () => {
  test('sends the notification with all fields when SMTP is configured', async () => {
    const messages = []
    const smtp = new SMTPServer({
      authOptional: true,
      disabledCommands: ['STARTTLS'],
      onAuth: (auth, _session, cb) => cb(null, { user: auth.username }),
      onData(stream, _session, cb) {
        let raw = ''
        stream.on('data', (chunk) => (raw += chunk))
        stream.on('end', () => {
          messages.push(raw)
          cb()
        })
      },
    })
    await new Promise((r) => smtp.listen(0, '127.0.0.1', r))
    const { port } = smtp.server.address()

    try {
      const app = createApp(
        makeConfig({
          mail: {
            host: '127.0.0.1',
            port,
            secure: false,
            user: 'mailer',
            pass: 'secret',
            from: 'Cineview <no-reply@cineview.test>',
            to: ['sales@cineview.test'],
            timezone: 'Asia/Riyadh',
          },
        }),
      )
      const res = await request(app).post('/api/contact').send(validBody())
      assert.equal(res.status, 201)

      const doc = await waitFor(async () => {
        const d = await ContactRequest.findOne().lean()
        return d?.notification.status === 'SENT' ? d : null
      })
      assert.ok(doc.notification.sentAt)
      assert.equal(messages.length, 1)

      const raw = messages[0]
      assert.match(raw, /To: sales@cineview\.test/)
      assert.match(raw, /Reply-To: .*ahmed@example\.com/)
      const { buildNotificationEmail } = await import('../src/services/notifier.js')
      const { text } = buildNotificationEmail({ ...doc, id: doc._id.toString() }, { timezone: 'Asia/Riyadh' })
      for (const label of ['الاسم', 'الشركة', 'الهاتف', 'البريد', 'الخدمة', 'الرسالة', 'التاريخ']) {
        assert.ok(text.includes(`${label}:`), `email contains ${label}`)
      }
      assert.ok(text.includes('نظام إدارة مخزون'), 'service label, not key')
    } finally {
      await new Promise((r) => smtp.close(r))
    }
  })

  test('H. SMTP failure does not lose the saved request', async () => {
    const port = await closedPort()
    const app = createApp(
      makeConfig({
        mail: { host: '127.0.0.1', port, secure: false, from: 'x@cineview.test', to: ['sales@cineview.test'] },
      }),
    )
    const res = await request(app).post('/api/contact').send(validBody())
    assert.equal(res.status, 201, 'user still gets success')
    assert.equal(res.body.success, true)

    const doc = await waitFor(async () => {
      const d = await ContactRequest.findOne().lean()
      return d?.notification.status === 'FAILED' ? d : null
    })
    assert.equal(doc.fullName, 'أحمد محمد', 'request kept')
    assert.equal(doc.status, 'NEW')
    assert.ok(doc.notification.error)
  })
})

describe('security', () => {
  test('helmet headers and CORS allow-list', async () => {
    const app = createApp(makeConfig())
    const allowed = await request(app).options('/api/contact').set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
    assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173')

    const denied = await request(app).options('/api/contact').set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST')
    assert.equal(denied.headers['access-control-allow-origin'], undefined)

    const res = await request(app).get('/api/health')
    assert.equal(res.status, 200)
    assert.equal(res.headers['x-content-type-options'], 'nosniff')
    assert.equal(res.headers['x-powered-by'], undefined)
  })
})
