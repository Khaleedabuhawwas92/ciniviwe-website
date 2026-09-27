import { reactive, ref } from 'vue'
import { CONTACT_FIELDS, sanitizeContact, validateContact } from '@shared/contact.js'
import { submitContactRequest, API_MESSAGES } from '@/utils/contactApi'

export const SUCCESS_MESSAGE = 'تم إرسال طلبك بنجاح، سنتواصل معك قريباً.'

const emptyForm = () => ({
  fullName: '',
  companyName: '',
  phone: '',
  email: '',
  service: '',
  message: '',
  website: '', // honeypot — must stay empty
})

// Phone and email share the "at least one of them" rule, so they are validated together.
const linkedFields = (field) => (field === 'phone' || field === 'email' ? ['phone', 'email'] : [field])

/**
 * Contact form state, validation (same rules as the API) and submission.
 * status: 'idle' | 'submitting' | 'success' | 'error'
 */
export function useContactForm(initialService = '') {
  const form = reactive({ ...emptyForm(), service: initialService })
  const errors = reactive({})
  const touched = reactive({})
  const status = ref('idle')
  const feedback = ref('')

  const currentErrors = () => validateContact(sanitizeContact(form))

  function validateField(field) {
    const all = currentErrors()
    for (const name of linkedFields(field)) {
      if (name === field || touched[name]) errors[name] = all[name] || ''
    }
  }

  function onBlur(field) {
    touched[field] = true
    validateField(field)
  }

  function onInput(field) {
    // A new edit hides the previous success/error banner.
    if (status.value === 'success' || status.value === 'error') status.value = 'idle'
    if (touched[field] || errors[field]) validateField(field)
  }

  function clearForm() {
    Object.assign(form, emptyForm())
    for (const key of Object.keys(errors)) delete errors[key]
    for (const key of Object.keys(touched)) delete touched[key]
  }

  async function submit() {
    if (status.value === 'submitting') return false

    const all = currentErrors()
    for (const field of CONTACT_FIELDS) {
      touched[field] = true
      errors[field] = all[field] || ''
    }
    if (Object.keys(all).length) {
      status.value = 'idle'
      return false
    }

    status.value = 'submitting'
    try {
      const response = await submitContactRequest({ ...sanitizeContact(form), website: form.website })
      clearForm()
      feedback.value = response.message || SUCCESS_MESSAGE
      status.value = 'success'
      return true
    } catch (error) {
      if (error.fieldErrors) Object.assign(errors, error.fieldErrors)
      feedback.value = error.message || API_MESSAGES.server
      status.value = 'error'
      return false
    }
  }

  return { form, errors, status, feedback, onBlur, onInput, submit }
}
