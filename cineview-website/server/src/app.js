import express from 'express'
import helmet from 'helmet'
import { corsMiddleware } from './middleware/security.js'
import { notFound, errorHandler } from './middleware/errors.js'
import { createRoutes } from './routes/index.js'
import { createNotifier } from './services/notifier.js'

/**
 * Builds the Express app. Kept separate from index.js so tests can create it
 * with their own configuration without opening a port.
 */
export function createApp(config, { notifier = createNotifier(config.mail) } = {}) {
  const app = express()

  app.set('trust proxy', config.trustProxy)
  app.disable('x-powered-by')

  app.use(helmet())
  app.use(corsMiddleware(config.corsOrigins))
  app.use(express.json({ limit: '10kb', strict: true }))

  app.use('/api', createRoutes(config, { notifier }))

  app.use(notFound)
  app.use(errorHandler)

  app.locals.notifier = notifier
  return app
}
