import { randomBytes } from 'node:crypto'
import { loadConfig } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './db/connect.js'
import { createApp } from './app.js'
import { logger } from './utils/logger.js'

const config = loadConfig()

if (config.auth.jwtSecret.length < 32) {
  if (config.isProduction) {
    logger.error('ADMIN_JWT_SECRET must be set (at least 32 characters) in production')
    process.exit(1)
  }
  // Development only: a per-process secret. Access tokens become invalid on restart, and the
  // dashboard transparently gets a new one through the refresh cookie.
  config.auth.jwtSecret = randomBytes(48).toString('hex')
  logger.warn('ADMIN_JWT_SECRET not set — using a temporary development secret')
}
if (config.adminApiKeyDeprecated) {
  logger.warn('ADMIN_API_KEY is no longer used: the admin API now requires admin accounts. Remove it from .env')
}
if (!config.ipHashSecret) logger.warn('IP_HASH_SECRET not set: client IP hashes will not be stored')
if (config.isProduction && !config.corsOrigins.length) logger.warn('CORS_ORIGINS is empty: browsers cannot call the API')
if (config.auth.cookie.sameSite === 'none' && !config.auth.cookie.secure) {
  logger.warn('ADMIN_COOKIE_SAMESITE=none requires ADMIN_COOKIE_SECURE=true — browsers will reject the cookie')
}

try {
  await connectDatabase(config.mongoUri)
} catch (error) {
  logger.error('Could not connect to MongoDB', { error: error.message })
  process.exit(1)
}

const app = createApp(config)
const { notifier } = app.locals
if (notifier.enabled) notifier.verify().then((ok) => ok && logger.info('SMTP connection verified'))

const server = app.listen(config.port, () => {
  logger.info(`Cineview API listening on port ${config.port}`, {
    env: config.nodeEnv,
    emailNotifications: notifier.enabled,
    corsOrigins: config.corsOrigins,
  })
})

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`)
  server.close(async () => {
    notifier.close?.()
    await disconnectDatabase()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
