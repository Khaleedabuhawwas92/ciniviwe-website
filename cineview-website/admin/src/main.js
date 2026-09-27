import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/cairo/wght.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// When the API reports that the session has ended, go back to the login page.
useAuthStore().onExpired(() => {
  const current = router.currentRoute.value
  if (!current.meta.public) router.replace({ name: 'login', query: { redirect: current.fullPath, expired: '1' } })
})

app.mount('#app')
