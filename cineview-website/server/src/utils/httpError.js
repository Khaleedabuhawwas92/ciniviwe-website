/** Error with an HTTP status and a user-facing (Arabic) message, handled by middleware/errors.js. */
export class HttpError extends Error {
  constructor(status, message, { code, errors } = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

export const badRequest = (message, errors) => new HttpError(400, message, { code: 'BAD_REQUEST', errors })
export const notFoundError = (message = 'العنصر المطلوب غير موجود.') => new HttpError(404, message, { code: 'NOT_FOUND' })
export const conflict = (message, errors) => new HttpError(409, message, { code: 'CONFLICT', errors })
