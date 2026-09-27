import { http } from './http'

const data = (response) => response.data

/** Removes empty filter values so URLs stay clean. */
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))

export const authApi = {
  login: (usernameOrEmail, password) => http.post('/admin/auth/login', { usernameOrEmail, password }).then(data),
  refresh: () => http.post('/admin/auth/refresh').then(data),
  logout: () => http.post('/admin/auth/logout').then(data),
  me: () => http.get('/admin/auth/me').then(data),
  changePassword: (currentPassword, newPassword) =>
    http.post('/admin/auth/change-password', { currentPassword, newPassword }).then(data),
}

export const dashboardApi = {
  get: () => http.get('/admin/dashboard').then(data),
}

export const contactsApi = {
  list: (params) => http.get('/admin/contacts', { params: clean(params) }).then(data),
  get: (id) => http.get(`/admin/contacts/${encodeURIComponent(id)}`).then(data),
  setStatus: (id, status) => http.patch(`/admin/contacts/${encodeURIComponent(id)}/status`, { status }).then(data),
  addNote: (id, text) => http.post(`/admin/contacts/${encodeURIComponent(id)}/notes`, { text }).then(data),
  /** Returns { blob, filename } for the filtered CSV. */
  async exportCsv(params) {
    const response = await http.get('/admin/contacts/export', { params: clean(params), responseType: 'blob' })
    const match = /filename="([^"]+)"/.exec(response.headers['content-disposition'] || '')
    return { blob: response.data, filename: match?.[1] || 'cineview-contacts.csv' }
  },
}

export const usersApi = {
  list: () => http.get('/admin/users').then(data),
  create: (payload) => http.post('/admin/users', payload).then(data),
  update: (id, payload) => http.patch(`/admin/users/${encodeURIComponent(id)}`, payload).then(data),
  resetPassword: (id, password) =>
    http.post(`/admin/users/${encodeURIComponent(id)}/reset-password`, password ? { password } : {}).then(data),
}

export const auditApi = {
  list: (params) => http.get('/admin/audit', { params: clean(params) }).then(data),
}
