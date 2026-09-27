import { Braces, Boxes, Globe, Monitor, Cloud, Puzzle, LifeBuoy } from 'lucide-vue-next'

/**
 * Services shown in the "خدماتنا" section.
 * To add a service: append an object with a unique `id`, an icon from lucide-vue-next,
 * a title and a short description. `contactValue` preselects the matching option in the contact form.
 */
export const services = [
  {
    id: 'custom-systems',
    icon: Braces,
    title: 'تطوير الأنظمة والبرامج',
    description: 'تصميم وتطوير أنظمة مخصصة تناسب طبيعة عملك وتساعدك على إدارة عملياتك بكفاءة.',
    contactValue: 'system',
  },
  {
    id: 'inventory',
    icon: Boxes,
    title: 'أنظمة إدارة المخزون',
    description: 'حلول متكاملة لإدارة الأصناف، المخازن، الجرد، الباركود، المشتريات والتقارير.',
    contactValue: 'inventory',
  },
  {
    id: 'websites',
    icon: Globe,
    title: 'تطوير المواقع الإلكترونية',
    description: 'تصميم وتطوير مواقع احترافية، سريعة، متجاوبة ومتوافقة مع مختلف الأجهزة.',
    contactValue: 'website',
  },
  {
    id: 'desktop',
    icon: Monitor,
    title: 'تطبيقات سطح المكتب',
    description: 'تطوير برامج Windows وأنظمة مكتبية مخصصة لإدارة الأعمال والعمليات اليومية.',
    contactValue: 'desktop',
  },
  {
    id: 'cloud',
    icon: Cloud,
    title: 'الأنظمة السحابية',
    description: 'أنظمة حديثة يمكن الوصول إليها من أي مكان ومن مختلف الأجهزة بأمان.',
    contactValue: 'cloud',
  },
  {
    id: 'tailored',
    icon: Puzzle,
    title: 'تطوير حلول حسب الطلب',
    description: 'نحوّل احتياجات شركتك إلى نظام مخصص قابل للتوسع والتطوير.',
    contactValue: 'custom',
  },
  {
    id: 'support',
    icon: LifeBuoy,
    title: 'الدعم والصيانة',
    description: 'دعم فني، تحسين الأنظمة، معالجة المشاكل وإضافة ميزات جديدة بشكل مستمر.',
    contactValue: 'other',
  },
]
