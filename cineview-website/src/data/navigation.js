// Section anchors used by the header, footer and scroll-spy.
export const navLinks = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'services', label: 'خدماتنا' },
  { id: 'about', label: 'من نحن' },
  { id: 'solutions', label: 'حلولنا' },
  { id: 'portfolio', label: 'أعمالنا' },
  { id: 'why-cineview', label: 'لماذا سينيفيو' },
  { id: 'contact', label: 'تواصل معنا' },
]

export const footerLinks = navLinks.filter((link) =>
  ['home', 'services', 'about', 'solutions', 'portfolio', 'contact'].includes(link.id),
)
