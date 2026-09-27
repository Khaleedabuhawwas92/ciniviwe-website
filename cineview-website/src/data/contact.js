// Options for the "الخدمة المطلوبة" field in the contact form.
export const serviceOptions = [
  { value: 'system', label: 'تطوير نظام' },
  { value: 'inventory', label: 'نظام إدارة مخزون' },
  { value: 'website', label: 'موقع إلكتروني' },
  { value: 'desktop', label: 'تطبيق سطح مكتب' },
  { value: 'cloud', label: 'حل سحابي' },
  { value: 'custom', label: 'حل مخصص' },
  { value: 'other', label: 'أخرى' },
]

export function serviceLabel(value) {
  return serviceOptions.find((option) => option.value === value)?.label ?? ''
}
