import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 1

/** Small Arabic toast notifications (never window.alert). */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(message, type = 'success', timeout = 3500) {
    const id = nextId++
    toasts.value = [...toasts.value.slice(-2), { id, message, type }] // at most 3 on screen
    if (timeout) setTimeout(() => dismiss(id), timeout)
    return id
  }

  return {
    toasts,
    dismiss,
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error', 5000),
    info: (message) => show(message, 'info'),
  }
})
