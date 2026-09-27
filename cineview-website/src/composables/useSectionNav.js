import { useRoute } from 'vue-router'
import { scrollToSection } from '@/utils/scroll'

/** Helpers for links that point to sections of the home page (/#id). */
export function useSectionNav() {
  const route = useRoute()

  const sectionLink = (id) => ({ path: '/', hash: `#${id}` })

  // The router ignores clicks on the hash that is already active, so scroll manually then.
  function onSectionClick(event, id) {
    if (route.path === '/' && route.hash === `#${id}`) {
      event.preventDefault()
      scrollToSection(id)
    }
  }

  return { sectionLink, onSectionClick }
}
