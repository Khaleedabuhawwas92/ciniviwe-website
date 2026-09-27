import { reactive, ref, computed } from 'vue'
import { contactRules } from '@/utils/validation'
import { toLatinDigits } from '@/utils/contactLinks'
import { submitContactRequest, ContactNotConfiguredError } from '@/utils/contactApi'
import { serviceLabel } from '@/data/contact'

const emptyForm = () => ({ fullName: '', company: '', phone: '', email: '', service: '', message: '', website: '' })

/**
 * Contact form state, validation and submission.
 * status: 'idle' | 'submitting' | 'success' | 'error' | 'unconfigured'
 */
export function useContactForm(initialService = '') {
  const form = reactive({ ...emptyForm(), service: initialService })
  const errors = reactive({})
  const touched = reactive({})
  const status = ref('idle')

  const validateField = (field) => {
    const rule = contactRules[field]
    errors[field] = rule ? rule(form[field]) : ''
    return !errors[field]
  }

  const validateAll = () => Object.keys(contactRules).map(validateField).every(Boolean)

  const onBlur = (field) => {
    touched[field] = true
    validateField(field)
  }

  const onInput = (field) => {
    if (touched[field]) validateField(field)
  }

  /** Plain-text summary of the request (used for the WhatsApp / email fallback). */
  const summary = computed(() =>
    [
      'طلب خدمة من موقع سينيفيو',
      `الاسم: ${form.fullName.trim()}`,
      form.company.trim() && `الشركة: ${form.company.trim()}`,
      `الهاتف: ${toLatinDigits(form.phone).trim()}`,
      `البريد: ${form.email.trim()}`,
      `الخدمة: ${serviceLabel(form.service)}`,
      `الرسالة: ${form.message.trim()}`,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  async function submit() {
    Object.keys(contactRules).forEach((field) => (touched[field] = true))
    if (!validateAll()) return false

    // Honeypot: bots fill the hidden "website" field; silently accept and drop.
    if (form.website) {
      status.value = 'success'
      return true
    }

    status.value = 'submitting'
    try {
      await submitContactRequest({
        fullName: form.fullName.trim(),
        company: form.company.trim(),
        phone: toLatinDigits(form.phone).trim(),
        email: form.email.trim(),
        service: form.service,
        serviceLabel: serviceLabel(form.service),
        message: form.message.trim(),
        source: 'cineview-website',
        submittedAt: new Date().toISOString(),
      })
      status.value = 'success'
      return true
    } catch (error) {
      status.value = error instanceof ContactNotConfiguredError ? 'unconfigured' : 'error'
      return false
    }
  }

  function reset() {
    Object.assign(form, emptyForm())
    Object.keys(errors).forEach((key) => delete errors[key])
    Object.keys(touched).forEach((key) => delete touched[key])
    status.value = 'idle'
  }

  return { form, errors, status, summary, onBlur, onInput, submit, reset }
}
