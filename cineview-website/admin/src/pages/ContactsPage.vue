<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Download, FilterX, SearchX } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import StateBlock from '@/components/StateBlock.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import NotificationBadge from '@/components/NotificationBadge.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import ContactQuickActions from '@/components/ContactQuickActions.vue'
import BaseButton from '@/components/BaseButton.vue'
import { contactsApi } from '@/services/api'
import { errorMessage } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { CONTACT_STATUSES, SERVICE_OPTIONS, statusLabel, serviceLabel } from '@/utils/labels'
import { formatDateTime, formatDate, formatTime, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const PAGE_SIZE = 20

/** Filters live in the URL, so they survive refresh, back/forward and can be shared. */
const readQuery = () => ({
  q: typeof route.query.q === 'string' ? route.query.q : '',
  status: typeof route.query.status === 'string' ? route.query.status : '',
  service: typeof route.query.service === 'string' ? route.query.service : '',
  from: typeof route.query.from === 'string' ? route.query.from : '',
  to: typeof route.query.to === 'string' ? route.query.to : '',
  sort: route.query.sort === 'oldest' ? 'oldest' : 'newest',
  page: Math.max(1, Number.parseInt(route.query.page, 10) || 1),
})

const filters = reactive(readQuery())
const search = ref(filters.q)
const items = ref([])
const pagination = ref({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE })
const state = ref('loading')
const error = ref('')
const exporting = ref(false)
let requestId = 0

const hasFilters = computed(() => Boolean(filters.q || filters.status || filters.service || filters.from || filters.to))
const apiParams = () => ({ ...filters, page: filters.page, limit: PAGE_SIZE })

async function load() {
  const current = ++requestId
  state.value = 'loading'
  try {
    const res = await contactsApi.list(apiParams())
    if (current !== requestId) return // a newer request is in flight
    items.value = res.data
    pagination.value = res.pagination
    state.value = 'ready'
  } catch (err) {
    if (current !== requestId) return
    error.value = errorMessage(err)
    state.value = 'error'
  }
}

function pushQuery(changes, { resetPage = true } = {}) {
  const next = { ...filters, ...changes, ...(resetPage && !('page' in changes) ? { page: 1 } : {}) }
  const query = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => value && !(key === 'sort' && value === 'newest') && !(key === 'page' && value === 1)),
  )
  router.push({ query })
}

watch(
  () => route.query,
  () => {
    Object.assign(filters, readQuery())
    search.value = filters.q
    load()
  },
  { immediate: true },
)

let searchTimer
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (value.trim() !== filters.q) pushQuery({ q: value.trim() })
  }, 350)
})

function clearFilters() {
  search.value = ''
  router.push({ query: {} })
}

async function exportCsv() {
  exporting.value = true
  try {
    const { blob, filename } = await contactsApi.exportCsv({ ...filters, page: undefined })
    const url = URL.createObjectURL(blob)
    const link = Object.assign(document.createElement('a'), { href: url, download: filename })
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('تم تصدير الملف')
  } catch (err) {
    toast.error(errorMessage(err))
  } finally {
    exporting.value = false
  }
}

const openContact = (id) => router.push({ name: 'contact', params: { id } })
</script>

<template>
  <div>
    <PageHeader title="طلبات التواصل" :subtitle="state === 'ready' ? `${formatNumber(pagination.total)} طلب${hasFilters ? ' مطابق للبحث' : ''}` : 'جميع الطلبات المرسلة من موقع سينيفيو'">
      <template #actions>
        <BaseButton variant="secondary" size="sm" :loading="exporting" :disabled="state !== 'ready' || !pagination.total" @click="exportCsv">
          <Download v-if="!exporting" :size="15" aria-hidden="true" />
          تصدير CSV
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Filters -->
    <section class="card mb-4 p-4" aria-label="البحث والفلاتر">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
        <div class="relative sm:col-span-2 lg:col-span-4">
          <label for="f-search" class="sr-only">بحث</label>
          <Search :size="17" class="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          <input id="f-search" v-model="search" type="search" class="field ps-10" placeholder="بحث بالاسم، الشركة، الهاتف أو البريد" autocomplete="off" />
        </div>
        <div class="lg:col-span-2">
          <label for="f-status" class="sr-only">الحالة</label>
          <select id="f-status" class="field" :value="filters.status" @change="pushQuery({ status: $event.target.value })">
            <option value="">كل الحالات</option>
            <option v-for="s in CONTACT_STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
        </div>
        <div class="lg:col-span-2">
          <label for="f-service" class="sr-only">الخدمة</label>
          <select id="f-service" class="field" :value="filters.service" @change="pushQuery({ service: $event.target.value })">
            <option value="">كل الخدمات</option>
            <option v-for="s in SERVICE_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2 lg:col-span-3">
          <label for="f-from" class="sr-only">من تاريخ</label>
          <input id="f-from" type="date" class="field min-w-0" :value="filters.from" :max="filters.to || undefined" title="من تاريخ" @change="pushQuery({ from: $event.target.value })" />
          <span class="text-navy-400" aria-hidden="true">–</span>
          <label for="f-to" class="sr-only">إلى تاريخ</label>
          <input id="f-to" type="date" class="field min-w-0" :value="filters.to" :min="filters.from || undefined" title="إلى تاريخ" @change="pushQuery({ to: $event.target.value })" />
        </div>
        <div class="lg:col-span-1">
          <label for="f-sort" class="sr-only">الترتيب</label>
          <select id="f-sort" class="field" :value="filters.sort" @change="pushQuery({ sort: $event.target.value })">
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
          </select>
        </div>
      </div>
      <div v-if="hasFilters" class="mt-3 flex justify-end">
        <button type="button" class="inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-900" @click="clearFilters">
          <FilterX :size="15" aria-hidden="true" /> مسح الفلاتر
        </button>
      </div>
    </section>

    <!-- Results -->
    <section class="card overflow-hidden" aria-live="polite" :aria-busy="state === 'loading'">
      <StateBlock v-if="state === 'loading' && !items.length" state="loading" />
      <StateBlock v-else-if="state === 'error'" state="error" :message="error" @retry="load" />
      <StateBlock
        v-else-if="!items.length"
        state="empty"
        :icon="hasFilters ? SearchX : null"
        :title="hasFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد طلبات تواصل بعد'"
        :message="hasFilters ? 'جرّب تعديل البحث أو الفلاتر.' : 'ستظهر هنا الطلبات المرسلة من نموذج التواصل في الموقع.'"
      >
        <button v-if="hasFilters" type="button" class="mt-4 text-sm font-bold text-brand-700 hover:underline" @click="clearFilters">مسح الفلاتر</button>
      </StateBlock>

      <template v-else>
        <!-- Desktop table -->
        <div :class="['scrollbar-thin relative hidden overflow-x-auto md:block', state === 'loading' && 'opacity-60']">
          <table class="w-full min-w-[960px] text-sm">
            <thead class="border-b border-navy-100 bg-navy-50/60 text-xs font-bold text-navy-500">
              <tr>
                <th scope="col" class="px-2.5 py-3 text-start">الاسم</th>
                <th scope="col" class="px-2.5 py-3 text-start">الشركة</th>
                <th scope="col" class="px-2.5 py-3 text-start">الهاتف</th>
                <th scope="col" class="px-2.5 py-3 text-start">البريد الإلكتروني</th>
                <th scope="col" class="px-2.5 py-3 text-start">الخدمة المطلوبة</th>
                <th scope="col" class="px-2.5 py-3 text-start">الحالة</th>
                <th scope="col" class="px-2.5 py-3 text-start">تاريخ الطلب</th>
                <th scope="col" class="px-2.5 py-3 text-start">إشعار البريد</th>
                <th scope="col" class="px-2.5 py-3 text-start"><span class="sr-only">الإجراءات</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-navy-100">
              <tr v-for="contact in items" :key="contact.id" class="cursor-pointer transition-colors hover:bg-navy-50/50" @click="openContact(contact.id)">
                <td class="px-2.5 py-3 whitespace-nowrap">
                  <RouterLink :to="{ name: 'contact', params: { id: contact.id } }" class="font-bold text-navy-950 hover:text-brand-700" @click.stop>
                    {{ contact.fullName }}
                  </RouterLink>
                </td>
                <td class="max-w-36 truncate px-2.5 py-3 text-navy-600">{{ contact.companyName || '—' }}</td>
                <td class="px-2.5 py-3 whitespace-nowrap text-navy-700" dir="ltr" style="text-align: right">{{ contact.phone || '—' }}</td>
                <td class="max-w-40 truncate px-2.5 py-3 text-navy-700" dir="ltr" style="text-align: right">{{ contact.email || '—' }}</td>
                <td class="px-2.5 py-3 whitespace-nowrap text-navy-700">{{ serviceLabel(contact.service) }}</td>
                <td class="px-2.5 py-3"><StatusBadge :status="contact.status" /></td>
                <td class="px-2.5 py-3 whitespace-nowrap text-navy-600" :title="formatDateTime(contact.createdAt)">
                  {{ formatDate(contact.createdAt) }}
                  <span class="block text-xs text-navy-400">{{ formatTime(contact.createdAt) }}</span>
                </td>
                <td class="px-2.5 py-3"><NotificationBadge :status="contact.notification?.status" compact /></td>
                <td class="px-2.5 py-3">
                  <!-- The row and the name link open the details page -->
                  <div class="flex items-center justify-end">
                    <ContactQuickActions :contact="contact" compact />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <ul :class="['divide-y divide-navy-100 md:hidden', state === 'loading' && 'opacity-60']">
          <li v-for="contact in items" :key="contact.id" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <RouterLink :to="{ name: 'contact', params: { id: contact.id } }" class="min-w-0">
                <p class="truncate font-bold text-navy-950">{{ contact.fullName }}</p>
                <p class="truncate text-sm text-navy-500">{{ contact.companyName || serviceLabel(contact.service) }}</p>
              </RouterLink>
              <StatusBadge :status="contact.status" />
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <dt class="text-navy-400">الخدمة</dt>
              <dd class="text-navy-700">{{ serviceLabel(contact.service) }}</dd>
              <dt class="text-navy-400">التاريخ</dt>
              <dd class="text-navy-700">{{ formatDateTime(contact.createdAt) }}</dd>
              <dt class="text-navy-400">إشعار البريد</dt>
              <dd><NotificationBadge :status="contact.notification?.status" /></dd>
            </dl>
            <div class="mt-3 flex items-center justify-between gap-2">
              <ContactQuickActions :contact="contact" compact />
              <RouterLink :to="{ name: 'contact', params: { id: contact.id } }" class="text-sm font-bold text-brand-700">التفاصيل</RouterLink>
            </div>
          </li>
        </ul>

        <div class="border-t border-navy-100 px-4 py-3">
          <PaginationBar v-bind="pagination" @change="(page) => pushQuery({ page }, { resetPage: false })" />
        </div>
      </template>
    </section>
  </div>
</template>
