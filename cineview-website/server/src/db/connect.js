import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

mongoose.set('strictQuery', true)
// Treat query filters built from user input as literal values (blocks $-operator injection).
mongoose.set('sanitizeFilter', true)

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGO_URI is not set')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, autoIndex: true })
  logger.info(`MongoDB connected (${mongoose.connection.name})`)
  return mongoose.connection
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

export const isDatabaseReady = () => mongoose.connection.readyState === 1
