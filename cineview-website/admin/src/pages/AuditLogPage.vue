<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import StateBlock from '@/components/StateBlock.vue'
import ActivityList from '@/components/ActivityList.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { auditApi } from '@/services/api'
import { errorMessage } from '@/services/http'
import { AUDIT_ACTION_LABELS } from '@/utils/labels'
import { formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()

const entries = ref([])
const pagination = ref({ page: 1, pages: 1, total: 0, limit: 30 })
const state = ref('loading')
const error = ref('')

const action = computed(() => (typeof route.query.action === 'string' ? route.query.action : ''))
const page = computed(() => Math.max(1, Number.parseInt(route.query.page, 10) || 1))

async function load() {
  state.value = 'loading'
  try {
    const res = await auditApi.list({ action: action.value, page: page.value, limit: 30 })
    entries.value = res.data
    pagination.value = res.pagination
    state.value = 'ready'
  } catch (err) {
    error.value = errorMessage(err)
    state.value = 'error'
  }
}
watch(() => route.query, load, { immediate: true })

const setQuery = (changes) =>
  router.push({ query: Object.fromEntries(Object.entries({ action: action.value, page: page.value, ...changes }).filter(([k, v]) => v && !(k === 'page' && v === 1))) })
</script>

<template>
  <div>
    <PageHeader title="سجل النشاط" :subtitle="state === 'ready' ? `${formatNumber(pagination.total)} عملية مسجلة` : 'كل العمليات التي قام بها فريق الإدارة.'">
      <template #actions>
        <label for="audit-action" class="sr-only">نوع العملية</label>
        <select id="audit-action" class="field w-56" :value="action" @change="setQuery({ action: $event.target.value, page: 1 })">
          <option value="">كل العمليات</option>
          <option v-for="(label, key) in AUDIT_ACTION_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </template>
    </PageHeader>

    <section class="card">
      <StateBlock v-if="state === 'loading' && !entries.length" state="loading" />
      <StateBlock v-else-if="state === 'error'" state="error" :message="error" @retry="load" />
      <StateBlock v-else-if="!entries.length" state="empty" title="لا توجد عمليات مسجلة" />
      <template v-else>
        <ActivityList :entries="entries" :class="['px-5', state === 'loading' && 'opacity-60']" />
        <div class="border-t border-navy-100 px-5 py-3">
          <PaginationBar v-bind="pagination" @change="(p) => setQuery({ page: p })" />
        </div>
      </template>
    </section>
  </div>
</template>
