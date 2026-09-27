<script setup>
import {
  LogIn,
  LogOut,
  ShieldAlert,
  Eye,
  RefreshCw,
  StickyNote,
  FileSpreadsheet,
  UserPlus,
  UserCog,
  UserCheck,
  UserX,
  KeyRound,
  Activity,
} from 'lucide-vue-next'
import { AUDIT_ACTION_LABELS, describeAudit } from '@/utils/labels'
import { formatDateTime, timeAgo } from '@/utils/format'

defineProps({
  entries: { type: Array, required: true },
  dense: { type: Boolean, default: false },
})

const icons = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  LOGIN_FAILED: ShieldAlert,
  CONTACT_VIEWED: Eye,
  CONTACT_STATUS_CHANGED: RefreshCw,
  CONTACT_NOTE_ADDED: StickyNote,
  CONTACTS_EXPORTED: FileSpreadsheet,
  ADMIN_CREATED: UserPlus,
  ADMIN_UPDATED: UserCog,
  ADMIN_ROLE_CHANGED: UserCog,
  ADMIN_ENABLED: UserCheck,
  ADMIN_DISABLED: UserX,
  PASSWORD_RESET: KeyRound,
  PASSWORD_CHANGED: KeyRound,
}
const warn = new Set(['LOGIN_FAILED', 'ADMIN_DISABLED'])
</script>

<template>
  <ol class="divide-y divide-navy-100">
    <li v-for="entry in entries" :key="entry.id" :class="['flex items-start gap-3', dense ? 'py-3' : 'py-3.5']">
      <span
        :class="[
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          warn.has(entry.action) ? 'bg-rose-50 text-rose-600' : 'bg-navy-50 text-navy-500',
        ]"
      >
        <component :is="icons[entry.action] || Activity" :size="15" aria-hidden="true" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm leading-6 text-navy-800">
          <span class="font-bold text-navy-950">{{ entry.admin?.fullName || 'النظام' }}</span>
          <span class="text-navy-500"> — {{ AUDIT_ACTION_LABELS[entry.action] || entry.action }}</span>
        </p>
        <p v-if="describeAudit(entry)" class="truncate text-sm text-navy-600">
          <RouterLink
            v-if="entry.entityType === 'ContactRequest' && entry.entityId"
            :to="{ name: 'contact', params: { id: entry.entityId } }"
            class="hover:text-brand-700 hover:underline"
          >
            {{ describeAudit(entry) }}
          </RouterLink>
          <template v-else>{{ describeAudit(entry) }}</template>
        </p>
      </div>
      <time :datetime="entry.createdAt" :title="formatDateTime(entry.createdAt)" class="shrink-0 text-xs whitespace-nowrap text-navy-400">
        {{ timeAgo(entry.createdAt) }}
      </time>
    </li>
  </ol>
</template>
