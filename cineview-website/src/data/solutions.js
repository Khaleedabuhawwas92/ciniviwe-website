import {
  Warehouse,
  Package,
  ScanBarcode,
  ArrowDownUp,
  ArrowLeftRight,
  ClipboardCheck,
  Truck,
  ChartColumn,
  Users,
  History,
  MonitorSmartphone,
  Building2,
} from 'lucide-vue-next'

/**
 * Products shown in "حلولنا" and on /solutions/:slug.
 * To add a product: append an object with a unique `slug`.
 * Set `featured: true` to show it as the large highlighted card.
 */
export const solutions = [
  {
    slug: 'inventory-system',
    featured: true,
    name: 'نظام إدارة المخزون',
    nameEn: 'Inventory Management System',
    badge: 'منتج رئيسي',
    summary: 'تحكم كامل في المخازن والأصناف والحركات من منصة واحدة.',
    description:
      'منصة متكاملة لإدارة المؤسسات والمخازن والأصناف والمستخدمين وحركات المخزون والمشتريات والجرد والباركود والتقارير.',
    platforms: ['Web', 'Windows'],
    contactValue: 'inventory',
    // Headings used on the product details page (/solutions/:slug)
    featuresTitle: 'كل ما تحتاجه لإدارة مخزونك',
    featuresSubtitle: 'وحدات متكاملة تغطي دورة العمل كاملة، من استلام الأصناف حتى التقارير.',
    features: [
      { icon: Warehouse, title: 'تعدد المخازن', text: 'إدارة عدة مخازن ومواقع تخزين من نظام واحد.' },
      { icon: Package, title: 'إدارة الأصناف', text: 'تصنيفات ووحدات وأسعار وبيانات تفصيلية لكل صنف.' },
      { icon: ScanBarcode, title: 'الباركود', text: 'توليد وقراءة الباركود لتسريع العمليات وتقليل الأخطاء.' },
      { icon: ArrowDownUp, title: 'إدخال وإخراج المخزون', text: 'تسجيل دقيق لكل حركة وارد وصادر.' },
      { icon: ArrowLeftRight, title: 'نقل بين المخازن', text: 'تحويلات موثقة بين المخازن مع تتبع الحالة.' },
      { icon: ClipboardCheck, title: 'الجرد والتسويات', text: 'جرد دوري ومفاجئ مع معالجة الفروقات والتسويات.' },
      { icon: Truck, title: 'الموردون والمشتريات', text: 'إدارة الموردين وأوامر الشراء والاستلام.' },
      { icon: ChartColumn, title: 'تقارير متقدمة', text: 'تقارير مرنة عن الأرصدة والحركات والمشتريات.' },
      { icon: Users, title: 'مستخدمون وصلاحيات', text: 'أدوار وصلاحيات دقيقة لكل مستخدم.' },
      { icon: History, title: 'سجل كامل للعمليات', text: 'تتبع كل عملية: من قام بها ومتى.' },
      { icon: MonitorSmartphone, title: 'العمل عبر الويب وتطبيق Windows', text: 'استخدم النظام من المتصفح أو كتطبيق سطح مكتب.' },
      { icon: Building2, title: 'دعم تعدد المؤسسات', text: 'إدارة أكثر من مؤسسة بفصل كامل للبيانات.' },
    ],
  },
]

export const findSolution = (slug) => solutions.find((solution) => solution.slug === slug)
