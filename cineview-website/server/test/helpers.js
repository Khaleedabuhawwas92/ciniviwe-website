// Shared test setup. Import this module FIRST in each test file (it sets NODE_ENV before app modules load).
process.env.NODE_ENV = 'test'

const { default: mongoose } = await import('mongoose')
const { loadConfig } = await import('../src/config/env.js')
const { createApp } = await import('../src/app.js')
const { connectDatabase, disconnectDatabase } = await import('../src/db/connect.js')
const { createAdmin } = await import('../src/services/adminUser.service.js')

export { mongoose, createApp }

const MONGO_TEST_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/cineview_test'

export const validContact = () => ({
  fullName: 'أحمد محمد',
  companyName: 'شركة الاختبار',
  phone: '+٩٦٦ ٥٠ ١٢٣ ٤٥٦٧',
  email: 'Ahmed@Example.com',
  service: 'inventory',
  message: 'نحتاج نظاماً لإدارة المخزون في ثلاثة فروع.',
})

/** Test configuration; overrides are merged on top. Mail is disabled unless overridden. */
export function makeConfig(overrides = {}) {
  const base = loadConfig()
  return {
    ...base,
    corsOrigins: ['http://localhost:5173', 'http://localhost:5174'],
    rateLimit: { windowMs: 60_000, max: 1000 },
    ipHashSecret: 'test-secret',
    timezone: 'Asia/Riyadh',
    ...overrides,
    auth: {
      ...base.auth,
      jwtSecret: 'test-jwt-secret-0123456789-abcdefghijklmnopqrstuvwxyz',
      bcryptRounds: 4,
      cookie: { ...base.auth.cookie, secure: false, sameSite: 'strict' },
      loginRateLimit: { windowMs: 60_000, max: 1000 },
      ...(overrides.auth || {}),
    },
    mail: { ...base.mail, host: '', from: '', to: [], ...(overrides.mail || {}) },
  }
}

export async function setupDatabase() {
  await connectDatabase(MONGO_TEST_URI)
  await mongoose.connection.dropDatabase()
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
}

export async function teardownDatabase() {
  await mongoose.connection.dropDatabase()
  await disconnectDatabase()
}

export async function clearCollections() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})))
}

export const PASSWORD = 'Str0ngPassw0rd'

/** Creates an admin directly through the service (as the CLI does). */
export function seedAdmin(overrides = {}) {
  const suffix = overrides.username || `admin${Math.random().toString(36).slice(2, 8)}`
  return createAdmin(
    {
      fullName: 'مدير الاختبار',
      username: suffix,
      email: `${suffix}@cineview.test`,
      password: PASSWORD,
      role: 'ADMIN',
      ...overrides,
    },
    { bcryptRounds: 4, via: 'test' },
  )
}

export async function waitFor(check, { timeout = 8000, interval = 50 } = {}) {
  const start = Date.now()
  for (;;) {
    const result = await check()
    if (result) return result
    if (Date.now() - start > timeout) throw new Error('waitFor timed out')
    await new Promise((r) => setTimeout(r, interval))
  }
}
