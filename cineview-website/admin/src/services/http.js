import axios from 'axios'

/**
 * Axios instance for the Cineview API.
 * - The access token lives only in memory (auth store) and is sent as a Bearer header.
 * - The refresh token is an httpOnly cookie (withCredentials) — JavaScript never sees it.
 * - On 401 the request is retried once after a silent refresh.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '')

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

let authHooks = {
  getToken: () => null,
  refresh: async () => null,
  onUnauthorized: () => {},
}

/** Connected by the auth store (avoids a circular import). */
export function configureAuth(hooks) {
  authHooks = { ...authHooks, ...hooks }
}

const isAuthEndpoint = (url = '') => /\/auth\/(login|refresh|logout)$/.test(url)

http.interceptors.request.use((config) => {
  const token = authHooks.getToken()
  if (token && !isAuthEndpoint(config.url)) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (response?.status === 401 && config && !config._retried && !isAuthEndpoint(config.url)) {
      config._retried = true
      const token = await authHooks.refresh().catch(() => null)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        return http(config)
      }
      authHooks.onUnauthorized()
    }
    return Promise.reject(error)
  },
)

/** Arabic, user-facing message for any API/network error. */
export function errorMessage(error, fallback = 'حدث خطأ، حاول مرة أخرى') {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'انتهت مهلة الاتصال بالخادم، حاول مرة أخرى.'
      : 'تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.'
  }
  const message = error.response.data?.message
  if (typeof message === 'string' && message) return message
  if (error.response.status === 403) return 'ليست لديك صلاحية لتنفيذ هذا الإجراء.'
  if (error.response.status === 429) return 'طلبات كثيرة، يرجى الانتظار قليلاً.'
  return fallback
}

/** Field errors returned by the API on 400/409 ({ field: message }). */
export const fieldErrors = (error) => error?.response?.data?.errors || {}
