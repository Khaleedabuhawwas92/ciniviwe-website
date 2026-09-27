import { Phone, Mail, MapPin } from 'lucide-vue-next'
import { company } from '@/data/company'
import { hasValue, telLink, mailtoLink, whatsappLink } from '@/utils/contactLinks'

/**
 * Contact channels derived from src/data/company.js.
 * Empty values are filtered out, so nothing is rendered for missing details.
 */
export function useCompanyContact() {
  const whatsappHref = hasValue(company.whatsapp) ? whatsappLink(company.whatsapp, company.whatsappMessage) : ''

  const channels = [
    hasValue(company.phone) && {
      key: 'phone',
      icon: Phone,
      label: 'الهاتف',
      value: company.phone,
      href: telLink(company.phone),
      ltr: true,
    },
    hasValue(company.email) && {
      key: 'email',
      icon: Mail,
      label: 'البريد الإلكتروني',
      value: company.email,
      href: mailtoLink(company.email),
      ltr: true,
    },
    whatsappHref && {
      key: 'whatsapp',
      brand: 'whatsapp',
      label: 'واتساب',
      value: company.whatsapp,
      href: whatsappHref,
      external: true,
      ltr: true,
    },
    hasValue(company.address) && {
      key: 'address',
      icon: MapPin,
      label: 'العنوان',
      value: company.address,
    },
  ].filter(Boolean)

  const socials = [
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'youtube', label: 'YouTube' },
  ]
    .filter(({ key }) => hasValue(company.social?.[key]))
    .map((social) => ({ ...social, href: company.social[social.key] }))

  return { channels, socials, whatsappHref }
}
