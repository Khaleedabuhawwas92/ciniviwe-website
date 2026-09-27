import { company } from '@/data/company'
import { hasValue } from './contactLinks'

/** Adds schema.org Organization JSON-LD, using only the values configured in company.js. */
export function injectOrganizationSchema() {
  const siteUrl = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
  const sameAs = Object.values(company.social || {}).filter(hasValue)

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.companyNameEn,
    alternateName: company.companyNameAr,
    description: company.descriptionAr,
    ...(siteUrl && { url: siteUrl }),
    ...(siteUrl && hasValue(company.logo) && { logo: `${siteUrl}${company.logo}` }),
    ...(hasValue(company.email) && { email: company.email }),
    ...(hasValue(company.phone) && { telephone: company.phone }),
    ...(hasValue(company.address) && { address: company.address }),
    ...(sameAs.length && { sameAs }),
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}
