import { createApp } from 'vue'
import '@fontsource-variable/cairo/wght.css'
import './assets/styles/main.css'

import App from './App.vue'
import router from './router'
import { vReveal } from './composables/useReveal'
import { injectOrganizationSchema } from './utils/structuredData'

createApp(App).use(router).directive('reveal', vReveal).mount('#app')

injectOrganizationSchema()
