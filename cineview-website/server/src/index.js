import { loadConfig } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './db/connect.js'
import { createApp } from './app.js'
import { logger } from './utils/logger.js'

const config = loadConfig()

if (config.adminApiKeyTooShort) logger.warn('ADMIN_API_KEY ignored: it must be at least 32 characters')
if (!config.ipHashSecret) logger.warn('IP_HASH_SECRET not set: client IP hashes will not be stored')
if (config.isProduction && !config.corsOrigins.length) logger.warn('CORS_ORIGINS is empty: browsers cannot call the API')

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
    adminApi: Boolean(config.adminApiKey),
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
