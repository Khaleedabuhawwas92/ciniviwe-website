<script setup>
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowDownUp,
  ChartColumn,
  Users,
  Search,
  Bell,
  CircleCheck,
  ShieldCheck,
} from 'lucide-vue-next'

// Illustrative software interface for the hero. Decorative only — contains no real data.
const menu = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', active: true },
  { icon: Package, label: 'الأصناف' },
  { icon: Warehouse, label: 'المخازن' },
  { icon: ArrowDownUp, label: 'الحركات' },
  { icon: ChartColumn, label: 'التقارير' },
  { icon: Users, label: 'المستخدمون' },
]

const kpis = [
  { icon: Package, label: 'الأصناف', w: 'w-14', tone: 'text-brand-300 bg-brand-400/10' },
  { icon: ArrowDownUp, label: 'الحركات', w: 'w-10', tone: 'text-sky-300 bg-sky-400/10' },
  { icon: Warehouse, label: 'المخازن', w: 'w-8', tone: 'text-indigo-300 bg-indigo-400/10' },
]

const rows = [
  { w: 'w-24', status: 'متوفر', tone: 'bg-emerald-400/12 text-emerald-300' },
  { w: 'w-20', status: 'منخفض', tone: 'bg-amber-400/12 text-amber-300' },
  { w: 'w-28', status: 'متوفر', tone: 'bg-emerald-400/12 text-emerald-300' },
]

const bars = [38, 56, 44, 70, 52, 82, 64]
</script>

<template>
  <div class="relative" role="img" aria-label="واجهة توضيحية لنظام إدارة أعمال من تطوير سينيفيو">
    <!-- glow -->
    <div aria-hidden="true" class="absolute -inset-6 rounded-[2rem] bg-brand-400/10 blur-3xl" />

    <div
      aria-hidden="true"
      class="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-900/90 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/5"
    >
      <!-- window bar -->
      <div class="flex items-center gap-3 border-b border-white/[0.07] bg-navy-950/60 px-4 py-3">
        <div class="flex gap-1.5" dir="ltr">
          <span class="size-2.5 rounded-full bg-white/15" />
          <span class="size-2.5 rounded-full bg-white/15" />
          <span class="size-2.5 rounded-full bg-white/15" />
        </div>
        <div class="mx-auto flex h-6 w-1/2 items-center justify-center gap-1.5 rounded-md bg-white/[0.05] px-3">
          <ShieldCheck :size="11" class="text-emerald-300/80" />
          <span class="h-1.5 w-24 rounded-full bg-white/15" />
        </div>
      </div>

      <div class="flex">
        <!-- sidebar -->
        <aside class="hidden w-40 shrink-0 border-e border-white/[0.07] bg-navy-950/40 p-3 sm:block">
          <div class="mb-4 flex items-center gap-2 px-2 pt-1">
            <span class="flex size-6 items-center justify-center rounded-md bg-linear-to-br from-brand-300 to-indigo-glow">
              <span class="size-2 rounded-full bg-navy-950" />
            </span>
            <span class="h-2 w-14 rounded-full bg-white/20" />
          </div>
          <ul class="space-y-1">
            <li
              v-for="item in menu"
              :key="item.label"
              :class="[
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.68rem] font-semibold',
                item.active ? 'bg-brand-400/10 text-brand-200' : 'text-navy-300',
              ]"
            >
              <component :is="item.icon" :size="13" />
              {{ item.label }}
            </li>
          </ul>
        </aside>

        <!-- main -->
        <div class="min-w-0 flex-1 p-4 sm:p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-white">لوحة التحكم</p>
              <span class="mt-1.5 block h-1.5 w-20 rounded-full bg-white/10" />
            </div>
            <div class="flex items-center gap-2">
              <span class="hidden h-7 w-28 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 md:flex">
                <Search :size="11" class="text-navy-400" />
                <span class="h-1.5 w-12 rounded-full bg-white/10" />
              </span>
              <span class="relative flex size-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04]">
                <Bell :size="12" class="text-navy-300" />
                <span class="absolute -top-0.5 -end-0.5 size-2 rounded-full bg-brand-400 animate-pulse-soft" />
              </span>
            </div>
          </div>

          <!-- kpis -->
          <div class="mt-4 grid grid-cols-3 gap-2.5">
            <div v-for="kpi in kpis" :key="kpi.label" class="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 sm:p-3">
              <span :class="['flex size-6 items-center justify-center rounded-md', kpi.tone]">
                <component :is="kpi.icon" :size="12" />
              </span>
              <p class="mt-2 text-[0.65rem] font-semibold text-navy-300">{{ kpi.label }}</p>
              <span :class="['mt-1.5 block h-2 rounded-full bg-white/25', kpi.w]" />
            </div>
          </div>

          <!-- chart + list -->
          <div class="mt-2.5 grid gap-2.5 md:grid-cols-5">
            <div class="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 md:col-span-3">
              <div class="flex items-center justify-between">
                <p class="text-[0.68rem] font-bold text-navy-100">حركة المخزون</p>
                <span class="flex gap-1">
                  <span class="h-1.5 w-5 rounded-full bg-brand-400/70" />
                  <span class="h-1.5 w-5 rounded-full bg-white/15" />
                </span>
              </div>
              <svg viewBox="0 0 220 90" class="mt-2 h-24 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hero-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stop-color="#3ec3ee" stop-opacity="0.35" />
                    <stop offset="1" stop-color="#3ec3ee" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
                  <line x1="0" x2="220" y1="22" y2="22" />
                  <line x1="0" x2="220" y1="45" y2="45" />
                  <line x1="0" x2="220" y1="68" y2="68" />
                </g>
                <path
                  d="M0 70 C 20 64, 30 52, 50 55 S 80 38, 100 42 S 130 24, 150 30 S 185 14, 220 12 L 220 90 L 0 90 Z"
                  fill="url(#hero-area)"
                />
                <path
                  d="M0 70 C 20 64, 30 52, 50 55 S 80 38, 100 42 S 130 24, 150 30 S 185 14, 220 12"
                  fill="none"
                  stroke="#3ec3ee"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M0 78 C 25 74, 40 68, 60 70 S 95 58, 120 60 S 160 48, 220 44"
                  fill="none"
                  stroke="rgba(125,156,245,0.55)"
                  stroke-width="1.5"
                  stroke-dasharray="4 4"
                />
              </svg>
            </div>
            <div class="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 md:col-span-2">
              <p class="text-[0.68rem] font-bold text-navy-100">أداء المخازن</p>
              <div class="mt-3 flex h-20 items-end justify-between gap-1.5" dir="ltr">
                <span
                  v-for="(h, i) in bars"
                  :key="i"
                  class="w-full rounded-t-[3px] bg-linear-to-t from-brand-600/50 to-brand-300/90"
                  :style="{ height: `${h}%` }"
                />
              </div>
            </div>
          </div>

          <!-- table -->
          <div class="mt-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
            <div
              v-for="(row, i) in rows"
              :key="i"
              :class="['flex items-center gap-3 px-3 py-2.5', i > 0 && 'border-t border-white/[0.05]']"
            >
              <span class="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05]">
                <Package :size="11" class="text-navy-300" />
              </span>
              <span :class="['h-1.5 rounded-full bg-white/20', row.w]" />
              <span class="ms-auto h-1.5 w-10 rounded-full bg-white/10" />
              <span :class="['rounded-md px-2 py-0.5 text-[0.6rem] font-bold', row.tone]">{{ row.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- floating cards -->
    <div
      aria-hidden="true"
      class="glass-dark absolute -bottom-6 start-4 hidden items-center gap-3 rounded-xl px-4 py-3 shadow-2xl animate-float sm:flex lg:-start-8"
    >
      <span class="flex size-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
        <CircleCheck :size="16" />
      </span>
      <span>
        <span class="block text-xs font-bold text-white">تمت مزامنة المخزون</span>
        <span class="mt-0.5 block text-[0.65rem] text-navy-300">الويب وسطح المكتب</span>
      </span>
    </div>
    <div
      aria-hidden="true"
      class="glass-dark absolute -top-5 end-6 hidden items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-2xl animate-float-delayed sm:flex lg:-end-6"
    >
      <span class="flex size-7 items-center justify-center rounded-lg bg-brand-400/15 text-brand-300">
        <ShieldCheck :size="14" />
      </span>
      <span class="text-xs font-bold text-white">صلاحيات دقيقة لكل مستخدم</span>
    </div>
  </div>
</template>
