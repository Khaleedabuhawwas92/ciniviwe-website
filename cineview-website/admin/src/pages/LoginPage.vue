<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogIn, CircleAlert, ShieldCheck } from 'lucide-vue-next'
import BrandMark from '@/components/BrandMark.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ usernameOrEmail: '', password: '' })
const errors = reactive({ usernameOrEmail: '', password: '' })
const serverError = ref('')
const loading = ref(false)
const expired = computed(() => route.query.expired === '1')

/** Only same-app paths are accepted as redirect targets (no open redirects). */
const redirectTarget = () => {
  const target = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return target.startsWith('/') && !target.startsWith('//') ? target : { name: 'dashboard' }
}

async function submit() {
  serverError.value = ''
  errors.usernameOrEmail = form.usernameOrEmail.trim() ? '' : 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني.'
  errors.password = form.password ? '' : 'يرجى إدخال كلمة المرور.'
  if (errors.usernameOrEmail || errors.password) return

  loading.value = true
  try {
    await auth.login(form.usernameOrEmail.trim(), form.password)
    await router.replace(redirectTarget())
  } catch (error) {
    serverError.value = errorMessage(error, 'تعذّر تسجيل الدخول، حاول مرة أخرى.')
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden bg-navy-950 px-4 py-10">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div class="absolute inset-x-0 -top-40 mx-auto h-96 max-w-2xl rounded-full bg-brand-400/10 blur-3xl" />
      <div
        class="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_70%)]"
      />
    </div>

    <main class="relative w-full max-w-[26rem]">
      <div class="mb-8 flex flex-col items-center text-center">
        <BrandMark :size="52" />
        <p class="mt-4 text-2xl font-extrabold text-white">سينيفيو</p>
        <h1 class="mt-1 text-sm font-semibold text-navy-300">لوحة إدارة سينيفيو</h1>
      </div>

      <div class="rounded-2xl border border-white/10 bg-white p-6 shadow-pop sm:p-8">
        <h2 class="text-lg font-bold text-navy-950">تسجيل الدخول</h2>
        <p class="mt-1 text-sm text-navy-500">أدخل بيانات حسابك للمتابعة.</p>

        <p v-if="expired && !serverError" class="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800" role="status">
          انتهت الجلسة، يرجى تسجيل الدخول مجدداً.
        </p>
        <p v-if="serverError" class="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
          <CircleAlert :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
          {{ serverError }}
        </p>

        <form class="mt-6 space-y-5" novalidate @submit.prevent="submit">
          <div>
            <label for="login-id" class="mb-1.5 block text-sm font-bold text-navy-800">اسم المستخدم أو البريد الإلكتروني</label>
            <input
              id="login-id"
              v-model="form.usernameOrEmail"
              type="text"
              class="field text-right"
              dir="ltr"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              autofocus
              :aria-invalid="!!errors.usernameOrEmail"
              :aria-describedby="errors.usernameOrEmail ? 'login-id-error' : undefined"
            />
            <p v-if="errors.usernameOrEmail" id="login-id-error" class="mt-1.5 text-sm text-rose-600">{{ errors.usernameOrEmail }}</p>
          </div>
          <div>
            <label for="login-password" class="mb-1.5 block text-sm font-bold text-navy-800">كلمة المرور</label>
            <PasswordInput
              id="login-password"
              v-model="form.password"
              autocomplete="current-password"
              :aria-invalid="!!errors.password"
              :aria-describedby="errors.password ? 'login-password-error' : undefined"
            />
            <p v-if="errors.password" id="login-password-error" class="mt-1.5 text-sm text-rose-600">{{ errors.password }}</p>
          </div>

          <button
            type="submit"
            class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 font-bold text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-70"
            :disabled="loading"
          >
            <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            <LogIn v-else :size="18" class="rtl:-scale-x-100" aria-hidden="true" />
            {{ loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول' }}
          </button>
        </form>
      </div>

      <p class="mt-6 flex items-center justify-center gap-1.5 text-xs text-navy-400">
        <ShieldCheck :size="14" aria-hidden="true" />
        وصول مخصص لفريق سينيفيو فقط
      </p>
    </main>
  </div>
</template>
