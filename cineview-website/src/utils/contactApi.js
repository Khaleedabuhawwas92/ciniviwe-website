/**
 * Contact form submission.
 * Set VITE_CONTACT_ENDPOINT in .env to any endpoint that accepts a JSON POST
 * (your own API, Formspree, Getform, a serverless function...).
 */
const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim() || ''

export const isContactApiConfigured = Boolean(endpoint)

export class ContactNotConfiguredError extends Error {
  constructor() {
    super('Contact endpoint is not configured')
    this.name = 'ContactNotConfiguredError'
  }
}

export async function submitContactRequest(payload) {
  if (!endpoint) throw new ContactNotConfiguredError()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error(`Contact request failed with status ${response.status}`)
  return response.json().catch(() => ({}))
}
