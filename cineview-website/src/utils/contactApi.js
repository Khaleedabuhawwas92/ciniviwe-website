/**
 * Contact form submission to the Cineview API (see /server).
 * VITE_API_URL is the API base URL, e.g. https://api.your-domain.com.
 * Leave it empty when the API is served from the same domain under /api (and in local development,
 * where Vite proxies /api to the local server).
 */
const API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
export const CONTACT_ENDPOINT = `${API_URL}/api/contact`

const REQUEST_TIMEOUT_MS = 15_000

export const API_MESSAGES = {
  network: 'تعذّر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
  timeout: 'استغرق الإرسال وقتاً أطول من المتوقع. يرجى المحاولة مرة أخرى.',
  server: 'حدث خطأ أثناء إرسال طلبك. يرجى المحاولة لاحقاً.',
}

export class ContactApiError extends Error {
  constructor(message, { status = 0, fieldErrors = null } = {}) {
    super(message)
    this.name = 'ContactApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/**
 * Sends the request. Resolves with the API response ({ success, message }).
 * Rejects with ContactApiError carrying an Arabic message (and field errors on HTTP 400).
 */
export async function submitContactRequest(payload) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (error) {
    throw new ContactApiError(error.name === 'AbortError' ? API_MESSAGES.timeout : API_MESSAGES.network)
  } finally {
    clearTimeout(timer)
  }

  const data = await response.json().catch(() => null)
  if (response.ok && data?.success) return data

  throw new ContactApiError(data?.message || API_MESSAGES.server, {
    status: response.status,
    fieldErrors: data?.errors && typeof data.errors === 'object' ? data.errors : null,
  })
}
