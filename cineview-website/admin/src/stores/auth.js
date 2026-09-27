import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'
import { configureAuth } from '@/services/http'

/**
 * Admin session.
 * The access token is kept in memory only (never localStorage). On page load the session is
 * restored through the httpOnly refresh cookie via /auth/refresh.
 */
export const useAuthStore = defineStore('auth', () => {
  const admin = ref(null)
  const accessToken = ref(null)
  const ready = ref(false)
  let refreshing = null
  let onSessionExpired = () => {}

  const isAuthenticated = computed(() => Boolean(admin.value && accessToken.value))
  const isSuperAdmin = computed(() => admin.value?.role === 'SUPER_ADMIN')

  function setSession(payload) {
    admin.value = payload.admin
    accessToken.value = payload.accessToken
  }

  function clear() {
    admin.value = null
    accessToken.value = null
  }

  /** Silent refresh — concurrent callers share one request. Resolves to the new token or null. */
  function refresh() {
    refreshing ??= authApi
      .refresh()
      .then((res) => {
        setSession(res.data)
        return accessToken.value
      })
      .catch(() => {
        clear()
        return null
      })
      .finally(() => {
        refreshing = null
      })
    return refreshing
  }

  /** Restores the session once at startup. */
  async function init() {
    if (ready.value) return
    await refresh()
    ready.value = true
  }

  async function login(usernameOrEmail, password) {
    const res = await authApi.login(usernameOrEmail, password)
    setSession(res.data)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clear()
    }
  }

  function updateProfile(profile) {
    admin.value = { ...admin.value, ...profile }
  }

  /** Router hook: called when the API reports the session is gone. */
  function onExpired(handler) {
    onSessionExpired = handler
  }

  configureAuth({
    getToken: () => accessToken.value,
    refresh,
    onUnauthorized: () => {
      clear()
      onSessionExpired()
    },
  })

  return { admin, ready, isAuthenticated, isSuperAdmin, init, login, logout, refresh, updateProfile, onExpired }
})
