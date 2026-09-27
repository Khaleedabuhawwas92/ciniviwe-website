<script setup>
import { ref, computed, onMounted } from 'vue'
import { Inbox, Sparkles, PhoneCall, Hourglass, CircleCheck, CalendarDays, TrendingUp, ArrowLeft, RefreshCw } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import StateBlock from '@/components/StateBlock.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ActivityList from '@/components/ActivityList.vue'
import BaseButton from '@/components/BaseButton.vue'
import DailyColumnChart from '@/components/charts/DailyColumnChart.vue'
import ServiceBars from '@/components/charts/ServiceBars.vue'
import { dashboardApi } from '@/services/api'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { formatNumber, timeAgo, formatDateTime } from '@/utils/format'
import { serviceLabel } from '@/utils/labels'

const auth = useAuthStore()
const state = ref('loading')
const error = ref('')
const data = ref(null)

async function load() {
  state.value = 'loading'
  try {
    data.value = (await dashboardApi.get()).data
    state.value = 'ready'
  } catch (err) {
    error.value = errorMessage(err)
    state.value = 'error'
  }
}
onMounted(load)

const stats = computed(() => data.value?.stats)
const cards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: 'إجمالي طلبات التواصل', value: s.total, icon: Inbox, to: { name: 'contacts' }, hint: s.byStatus.SPAM ? `منها ${formatNumber(s.byStatus.SPAM)} مزعج` : '' },
    { label: 'الطلبات الجديدة', value: s.byStatus.NEW, icon: Sparkles, to: { name: 'contacts', query: { status: 'NEW' } }, accent: true },
    { label: 'تم التواصل', value: s.byStatus.CONTACTED, icon: PhoneCall, to: { name: 'contacts', query: { status: 'CONTACTED' } } },
    { label: 'قيد المتابعة', value: s.byStatus.IN_PROGRESS, icon: Hourglass, to: { name: 'contacts', query: { status: 'IN_PROGRESS' } } },
    { label: 'الطلبات المغلقة', value: s.byStatus.CLOSED, icon: CircleCheck, to: { name: 'contacts', query: { status: 'CLOSED' } } },
    { label: 'طلبات اليوم', value: s.today, icon: CalendarDays },
    { label: 'طلبات هذا الشهر', value: s.thisMonth, icon: TrendingUp },
  ]
})
const weekTotal = computed(() => stats.value?.lastDays.reduce((sum, d) => sum + d.count, 0) ?? 0)
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? 'صباح الخير' : 'مساء الخير'
})
</script>

<template>
  <div>
    <PageHeader :title="`${greeting}، ${auth.admin?.fullName?.split(' ')[0] || ''}`" subtitle="نظرة عامة على طلبات التواصل ونشاط الفريق.">
      <template #actions>
        <BaseButton variant="secondary" size="sm" :loading="state === 'loading' && !!data" @click="load">
          <RefreshCw v-if="!(state === 'loading' && data)" :size="15" aria-hidden="true" />
          تحديث
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="state === 'loading' && !data" class="card"><StateBlock state="loading" /></div>
    <div v-else-if="state === 'error'" class="card"><StateBlock state="error" :message="error" @retry="load" /></div>

    <template v-else-if="stats">
      <!-- Summary cards -->
      <ul class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-7">
        <li v-for="card in cards" :key="card.label" :class="card === cards[0] ? 'col-span-2 md:col-span-1' : ''">
          <component
            :is="card.to ? 'RouterLink' : 'div'"
            :to="card.to"
            :class="[
              'card flex h-full flex-col justify-between gap-3 p-4 transition',
              card.to && 'hover:border-navy-200 hover:shadow-pop',
              card.accent && 'border-brand-200 bg-brand-50/40',
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-[0.8rem] leading-5 font-semibold text-navy-500">{{ card.label }}</p>
              <component :is="card.icon" :size="17" :class="card.accent ? 'text-brand-600' : 'text-navy-300'" aria-hidden="true" />
            </div>
            <div>
              <p class="text-2xl font-extrabold text-navy-950 tabular-nums sm:text-[1.7rem]">{{ formatNumber(card.value) }}</p>
              <p v-if="card.hint" class="mt-0.5 text-xs text-navy-400">{{ card.hint }}</p>
            </div>
          </component>
        </li>
      </ul>

      <!-- Charts -->
      <div class="mt-6 grid gap-4 lg:grid-cols-5">
        <section class="card p-5 lg:col-span-3" aria-labelledby="chart-days-title">
          <div class="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="chart-days-title" class="font-bold text-navy-950">طلبات آخر 7 أيام</h2>
              <p class="mt-0.5 text-xs text-navy-500">بدون الطلبات المزعجة</p>
            </div>
            <p class="text-sm text-navy-500">
              المجموع <span class="font-bold text-navy-900 tabular-nums">{{ formatNumber(weekTotal) }}</span>
            </p>
          </div>
          <DailyColumnChart :days="stats.lastDays" label="طلبات التواصل في آخر 7 أيام" />
        </section>

        <section class="card p-5 lg:col-span-2" aria-labelledby="chart-services-title">
          <div class="mb-5">
            <h2 id="chart-services-title" class="font-bold text-navy-950">توزيع الطلبات حسب الخدمة</h2>
            <p class="mt-0.5 text-xs text-navy-500">جميع الفترات، بدون الطلبات المزعجة</p>
          </div>
          <ServiceBars :items="stats.byService" />
        </section>
      </div>

      <!-- Latest requests + activity -->
      <div class="mt-4 grid gap-4 lg:grid-cols-5">
        <section class="card lg:col-span-3" aria-labelledby="latest-title">
          <div class="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h2 id="latest-title" class="font-bold text-navy-950">آخر طلبات التواصل</h2>
            <RouterLink :to="{ name: 'contacts' }" class="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-600">
              عرض الكل <ArrowLeft :size="15" aria-hidden="true" />
            </RouterLink>
          </div>
          <StateBlock v-if="!data.latestContacts.length" state="empty" title="لا توجد طلبات بعد" message="ستظهر هنا الطلبات المرسلة من نموذج التواصل في الموقع." />
          <ul v-else class="divide-y divide-navy-100">
            <li v-for="contact in data.latestContacts" :key="contact.id">
              <RouterLink :to="{ name: 'contact', params: { id: contact.id } }" class="flex items-center gap-3 px-5 py-3.5 transition hover:bg-navy-50/60">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-navy-950">
                    {{ contact.fullName }}
                    <span v-if="contact.companyName" class="font-medium text-navy-500"> — {{ contact.companyName }}</span>
                  </p>
                  <p class="truncate text-xs text-navy-500">{{ serviceLabel(contact.service) }}</p>
                </div>
                <StatusBadge :status="contact.status" />
                <time :datetime="contact.createdAt" :title="formatDateTime(contact.createdAt)" class="hidden w-24 shrink-0 text-end text-xs text-navy-400 sm:block">
                  {{ timeAgo(contact.createdAt) }}
                </time>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="card lg:col-span-2" aria-labelledby="activity-title">
          <div class="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h2 id="activity-title" class="font-bold text-navy-950">النشاط الأخير</h2>
            <RouterLink :to="{ name: 'audit' }" class="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-600">
              السجل الكامل <ArrowLeft :size="15" aria-hidden="true" />
            </RouterLink>
          </div>
          <StateBlock v-if="!data.recentActivity.length" state="empty" title="لا يوجد نشاط بعد" />
          <ActivityList v-else :entries="data.recentActivity" dense class="px-5" />
        </section>
      </div>
    </template>
  </div>
</template>
