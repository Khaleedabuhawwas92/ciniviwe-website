import { watch } from 'vue'
import { useRoute } from 'vue-router'

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
export const DEFAULT_TITLE = 'سينيفيو | حلول برمجية وتقنية للشركات'
export const DEFAULT_DESCRIPTION =
  'سينيفيو تقدم حلولاً برمجية وتقنية متكاملة تشمل تطوير الأنظمة، إدارة المخزون، المواقع الإلكترونية، تطبيقات سطح المكتب والحلول السحابية.'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = url
}

/** Keeps title, description, Open Graph and canonical in sync with route meta. */
export function useSeo() {
  const route = useRoute()

  watch(
    () => route.path,
    () => {
      const title = route.meta.title || DEFAULT_TITLE
      const description = route.meta.description || DEFAULT_DESCRIPTION
      document.title = title
      setMeta('name', 'description', description)
      setMeta('property', 'og:title', title)
      setMeta('property', 'og:description', description)
      setMeta('name', 'twitter:title', title)
      setMeta('name', 'twitter:description', description)
      setMeta('name', 'robots', route.meta.noindex ? 'noindex, follow' : 'index, follow')

      if (SITE_URL) {
        const url = `${SITE_URL}${route.path}`
        setCanonical(url)
        setMeta('property', 'og:url', url)
      }
    },
    { immediate: true },
  )
}
