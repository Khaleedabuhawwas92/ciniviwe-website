<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, PhoneCall, Hourglass, CircleCheck, Ban, StickyNote, History, Send, ShieldCheck, Lock } from 'lucide-vue-next'
import StateBlock from '@/components/StateBlock.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import NotificationBadge from '@/components/NotificationBadge.vue'
import CopyButton from '@/components/CopyButton.vue'
import ContactQuickActions from '@/components/ContactQuickActions.vue'
import BaseButton from '@/components/BaseButton.vue'
import { contactsApi } from '@/services/api'
import { errorMessage, fieldErrors } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { CONTACT_STATUSES, statusLabel, serviceLabel } from '@/utils/labels'
import { formatDateTime, timeAgo } from '@/utils/format'

const route = useRoute()
const toast = useToastStore()

const contact = ref(null)
const state = ref('loading')
const error = ref('')
const statusSaving = ref('')
const selectedStatus = ref('')
const noteText = ref('')
const noteError = ref('')
const noteSaving = ref(false)
const NOTE_MAX = 2000

async function load() {
  state.value = 'loading'
  try {
    contact.value = (await contactsApi.get(route.params.id)).data
    selectedStatus.value = contact.value.status
    state.value = 'ready'
  } catch (err) {
    error.value = err?.response?.status === 404 ? 'طلب التواصل غير موجود.' : errorMessage(err)
    state.value = 'error'
  }
}
watch(() => route.params.id, (id) => id && load(), { immediate: true })

const quickActions = [
  { status: 'CONTACTED', label: 'تم التواصل', icon: PhoneCall },
  { status: 'IN_PROGRESS', label: 'قيد المتابعة', icon: Hourglass },
  { status: 'CLOSED', label: 'إغلاق', icon: CircleCheck },
  { status: 'SPAM', label: 'مزعج', icon: Ban },
]

async function setStatus(status) {
  if (!contact.value || status === contact.value.status || statusSaving.value) return
  statusSaving.value = status
  try {
    const res = await contactsApi.setStatus(contact.value.id, status)
    contact.value = res.data
    selectedStatus.value = res.data.status
    toast.success('تم تحديث حالة الطلب')
  } catch (err) {
    selectedStatus.value = contact.value.status
    toast.error(errorMessage(err))
  } finally {
    statusSaving.value = ''
  }
}

async function addNote() {
  noteError.value = ''
  const text = noteText.value.trim()
  if (!text) {
    noteError.value = 'يرجى كتابة الملاحظة.'
    return
  }
  noteSaving.value = true
  try {
    const res = await contactsApi.addNote(contact.value.id, text)
    contact.value = res.data
    noteText.value = ''
    toast.success('تم إضافة الملاحظة')
  } catch (err) {
    noteError.value = fieldErrors(err).text || ''
    if (!noteError.value) toast.error(errorMessage(err))
  } finally {
    noteSaving.value = false
  }
}

const details = computed(() => {
  const c = contact.value
  if (!c) return []
  return [
    { label: 'الاسم الكامل', value: c.fullName },
    { label: 'اسم الشركة', value: c.companyName || '—' },
    { label: 'الهاتف', value: c.phone || '—', ltr: true, copy: c.phone },
    { label: 'البريد الإلكتروني', value: c.email || '—', ltr: true, copy: c.email },
    { label: 'الخدمة', value: serviceLabel(c.service) },
  ]
})
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'contacts' }" class="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy-500 hover:text-navy-900">
      <ArrowRight :size="16" aria-hidden="true" /> العودة إلى طلبات التواصل
    </RouterLink>

    <div v-if="state === 'loading' && !contact" class="card"><StateBlock state="loading" /></div>
    <div v-else-if="state === 'error'" class="card"><StateBlock state="error" :message="error" @retry="load" /></div>

    <template v-else-if="contact">
      <!-- Header -->
      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-xl font-extrabold text-navy-950 sm:text-2xl">{{ contact.fullName }}</h1>
            <StatusBadge :status="contact.status" />
          </div>
          <p class="mt-1 text-sm text-navy-500">
            {{ serviceLabel(contact.service) }} · أُرسل {{ timeAgo(contact.createdAt) }}
          </p>
        </div>
        <ContactQuickActions :contact="contact" />
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Main column -->
        <div class="space-y-4 lg:col-span-2">
          <section class="card" aria-labelledby="details-title">
            <h2 id="details-title" class="border-b border-navy-100 px-5 py-4 font-bold text-navy-950">بيانات الطلب</h2>
            <dl class="grid gap-x-6 sm:grid-cols-2">
              <div v-for="row in details" :key="row.label" class="border-b border-navy-100 px-5 py-3.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
                <dt class="text-xs font-semibold text-navy-500">{{ row.label }}</dt>
                <dd class="mt-1 flex items-center gap-1 font-semibold text-navy-900">
                  <span :dir="row.ltr ? 'ltr' : undefined" class="min-w-0 truncate">{{ row.value }}</span>
                  <CopyButton v-if="row.copy" :value="row.copy" :label="`نسخ ${row.label}`" />
                </dd>
              </div>
            </dl>
            <div class="border-t border-navy-100 px-5 py-4">
              <h3 class="text-xs font-semibold text-navy-500">الرسالة</h3>
              <p class="mt-2 leading-8 whitespace-pre-line text-navy-900">{{ contact.message }}</p>
            </div>
          </section>

          <!-- Notes -->
          <section class="card" aria-labelledby="notes-title">
            <div class="flex items-center justify-between border-b border-navy-100 px-5 py-4">
              <h2 id="notes-title" class="flex items-center gap-2 font-bold text-navy-950">
                <StickyNote :size="17" class="text-navy-400" aria-hidden="true" /> ملاحظات داخلية
              </h2>
              <span class="inline-flex items-center gap-1 text-xs text-navy-400"><Lock :size="12" aria-hidden="true" /> مرئية لفريق سينيفيو فقط</span>
            </div>
            <form class="border-b border-navy-100 p-5" novalidate @submit.prevent="addNote">
              <label for="note-text" class="sr-only">ملاحظة جديدة</label>
              <textarea
                id="note-text"
                v-model="noteText"
                rows="3"
                :maxlength="NOTE_MAX"
                class="field h-auto resize-y py-2.5 leading-7"
                placeholder="أضف ملاحظة عن المتابعة مع العميل..."
                :aria-invalid="!!noteError"
                :aria-describedby="noteError ? 'note-error' : undefined"
              />
              <div class="mt-2 flex items-center justify-between gap-3">
                <p v-if="noteError" id="note-error" class="text-sm text-rose-600" role="alert">{{ noteError }}</p>
                <p v-else class="text-xs text-navy-400 tabular-nums">{{ noteText.length }} / {{ NOTE_MAX }}</p>
                <BaseButton type="submit" size="sm" :loading="noteSaving" :disabled="!noteText.trim()">
                  <Send v-if="!noteSaving" :size="14" class="rtl:-scale-x-100" aria-hidden="true" />
                  إضافة ملاحظة
                </BaseButton>
              </div>
            </form>
            <p v-if="!contact.notes.length" class="px-5 py-8 text-center text-sm text-navy-400">لا توجد ملاحظات بعد.</p>
            <ol v-else class="divide-y divide-navy-100">
              <li v-for="note in contact.notes" :key="note.id" class="px-5 py-4">
                <div class="flex items-center justify-between gap-3 text-xs">
                  <span class="font-bold text-navy-800">{{ note.admin?.fullName || 'مستخدم محذوف' }}</span>
                  <time :datetime="note.createdAt" :title="formatDateTime(note.createdAt)" class="text-navy-400">{{ timeAgo(note.createdAt) }}</time>
                </div>
                <p class="mt-1.5 text-sm leading-7 whitespace-pre-line text-navy-800">{{ note.text }}</p>
              </li>
            </ol>
          </section>
        </div>

        <!-- Side column -->
        <div class="space-y-4">
          <section class="card p-5" aria-labelledby="status-title">
            <h2 id="status-title" class="font-bold text-navy-950">حالة الطلب</h2>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                v-for="action in quickActions"
                :key="action.status"
                type="button"
                :disabled="!!statusSaving || contact.status === action.status"
                :aria-pressed="contact.status === action.status"
                :class="[
                  'flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-bold transition disabled:cursor-default',
                  contact.status === action.status
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50 disabled:opacity-60',
                ]"
                @click="setStatus(action.status)"
              >
                <span v-if="statusSaving === action.status" class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                <component :is="action.icon" v-else :size="15" aria-hidden="true" />
                {{ action.label }}
              </button>
            </div>
            <label for="status-select" class="mt-4 mb-1.5 block text-xs font-semibold text-navy-500">تغيير الحالة إلى</label>
            <div class="flex gap-2">
              <select id="status-select" v-model="selectedStatus" class="field">
                <option v-for="s in CONTACT_STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
              </select>
              <BaseButton size="sm" class="h-[2.625rem] shrink-0" :disabled="selectedStatus === contact.status" :loading="!!statusSaving && statusSaving === selectedStatus" @click="setStatus(selectedStatus)">
                حفظ
              </BaseButton>
            </div>
          </section>

          <section class="card p-5" aria-labelledby="meta-title">
            <h2 id="meta-title" class="font-bold text-navy-950">معلومات إضافية</h2>
            <dl class="mt-3 space-y-3 text-sm">
              <div class="flex justify-between gap-3"><dt class="text-navy-500">تاريخ الإرسال</dt><dd class="text-end font-semibold text-navy-800">{{ formatDateTime(contact.createdAt) }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-navy-500">آخر تحديث</dt><dd class="text-end font-semibold text-navy-800">{{ formatDateTime(contact.updatedAt) }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-navy-500">مصدر الطلب</dt><dd class="font-semibold text-navy-800">{{ contact.source === 'WEBSITE' ? 'الموقع الإلكتروني' : contact.source }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-navy-500">إشعار البريد</dt><dd><NotificationBadge :status="contact.notification?.status" /></dd></div>
              <div class="flex justify-between gap-3">
                <dt class="text-navy-500">عنوان IP</dt>
                <dd class="inline-flex items-center gap-1 font-semibold text-navy-800">
                  <template v-if="contact.hasIpHash"><ShieldCheck :size="14" class="text-emerald-600" aria-hidden="true" /> محفوظ مشفّراً</template>
                  <template v-else>غير محفوظ</template>
                </dd>
              </div>
            </dl>
            <p v-if="contact.notification?.status === 'FAILED'" class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
              تعذّر إرسال إشعار البريد لهذا الطلب، لكن الطلب محفوظ بالكامل.
            </p>
          </section>

          <section class="card p-5" aria-labelledby="history-title">
            <h2 id="history-title" class="flex items-center gap-2 font-bold text-navy-950">
              <History :size="17" class="text-navy-400" aria-hidden="true" /> سجل الحالة
            </h2>
            <ol class="mt-4 space-y-4 border-s-2 border-navy-100 ps-4">
              <li v-for="(entry, i) in contact.statusHistory" :key="i" class="relative">
                <span class="absolute -start-[1.4rem] top-1.5 size-2.5 rounded-full bg-brand-400 ring-4 ring-white" aria-hidden="true" />
                <p class="flex flex-wrap items-center gap-1.5 text-sm">
                  <StatusBadge :status="entry.fromStatus" />
                  <span class="text-navy-400" aria-label="إلى">←</span>
                  <StatusBadge :status="entry.toStatus" />
                </p>
                <p class="mt-1 text-xs text-navy-500">
                  {{ entry.changedBy?.fullName || 'مستخدم محذوف' }} ·
                  <time :datetime="entry.changedAt" :title="formatDateTime(entry.changedAt)">{{ timeAgo(entry.changedAt) }}</time>
                </p>
              </li>
              <li class="relative">
                <span class="absolute -start-[1.4rem] top-1.5 size-2.5 rounded-full bg-navy-300 ring-4 ring-white" aria-hidden="true" />
                <p class="text-sm font-semibold text-navy-800">تم استلام الطلب من الموقع</p>
                <p class="mt-1 text-xs text-navy-500">{{ formatDateTime(contact.createdAt) }}</p>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
