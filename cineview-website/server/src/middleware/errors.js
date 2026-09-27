import { logger } from '../utils/logger.js'

export function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'المسار غير موجود.' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Malformed JSON / body too large (thrown by express.json()).
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'صيغة البيانات المرسلة غير صحيحة.' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'حجم البيانات المرسلة كبير جداً.' })
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'يرجى مراجعة البيانات المدخلة.' })
  }

  logger.error('Unhandled error', { path: req.path, method: req.method, error: err.message })
  res.status(500).json({ success: false, message: 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.' })
}
