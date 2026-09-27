<script setup>
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Send, ChevronDown, CircleCheck, LoaderCircle, Info, Mail, RotateCcw } from 'lucide-vue-next'
import FormField from '@/components/ui/FormField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BrandIcon from '@/components/icons/BrandIcon.vue'
import { serviceOptions } from '@/data/contact'
import { company } from '@/data/company'
import { useContactForm } from '@/composables/useContactForm'
import { hasValue, whatsappLink, mailtoLink } from '@/utils/contactLinks'

const route = useRoute()
const validService = (value) => (serviceOptions.some((o) => o.value === value) ? value : '')

const { form, errors, status, summary, onBlur, onInput, submit, reset } = useContactForm(validService(route.query.service))

// Preselect the service when arriving from a "request demo" link (/?service=inventory#contact).
watch(
  () => route.query.service,
  (value) => {
    const service = validService(value)
    if (service) form.service = service
  },
)

// Fallback channels shown when no backend endpoint is configured yet.
const fallbackWhatsapp = computed(() =>
  hasValue(company.whatsapp) ? whatsappLink(company.whatsapp, summary.value) : '',
)
const fallbackEmail = computed(() =>
  hasValue(company.email) ? mailtoLink(company.email, 'طلب خدمة من موقع سينيفيو', summary.value) : '',
)

const inputClass = (field) => [
  'block w-full rounded-xl border bg-white px-4 text-[0.95rem] text-navy-900 shadow-[0_1px_2px_rgb(6_13_31/0.04)] transition outline-none placeholder:text-navy-400 focus:ring-4',
  errors[field]
    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
    : 'border-navy-200 hover:border-navy-300 focus:border-brand-500 focus:ring-brand-400/20',
]

async function onSubmit(event) {
  const formEl = event.currentTarget
  const ok = await submit()
  // Validation failed: move focus to the first invalid field.
  if (!ok) formEl.querySelector('[aria-invalid="true"]')?.focus()
}
</script>

<template>
  <div class="rounded-3xl border border-navy-100 bg-white p-6 shadow-lift sm:p-8 lg:p-10">
    <!-- Success -->
    <div v-if="status === 'success'" class="py-10 text-center" role="status">
      <span class="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CircleCheck :size="32" aria-hidden="true" />
      </span>
      <h3 class="mt-6 text-2xl font-bold text-navy-950">تم استلام طلبك بنجاح</h3>
      <p class="mx-auto mt-3 max-w-md leading-8 text-navy-600">شكراً لتواصلك مع سينيفيو. سيقوم فريقنا بمراجعة طلبك والتواصل معك.</p>
      <BaseButton variant="outline" class="mt-8" @click="reset">
        <RotateCcw :size="16" aria-hidden="true" />
        إرسال طلب جديد
      </BaseButton>
    </div>

    <form v-else novalidate aria-labelledby="contact-form-title" @submit.prevent="onSubmit">
      <h3 id="contact-form-title" class="text-xl font-bold text-navy-950">أرسل طلبك</h3>
      <p class="mt-1.5 text-sm text-navy-500">الحقول المعلّمة بـ <span class="text-rose-600">*</span> مطلوبة.</p>

      <div class="mt-7 grid gap-5 sm:grid-cols-2">
        <FormField id="cf-name" v-slot="{ id, describedBy, invalid }" label="الاسم الكامل" required :error="errors.fullName">
          <input
            :id="id"
            v-model="form.fullName"
            type="text"
            name="fullName"
            autocomplete="name"
            maxlength="100"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            aria-required="true"
            :class="[inputClass('fullName'), 'h-12']"
            @blur="onBlur('fullName')"
            @input="onInput('fullName')"
          />
        </FormField>

        <FormField id="cf-company" v-slot="{ id, describedBy, invalid }" label="اسم الشركة" :error="errors.company">
          <input
            :id="id"
            v-model="form.company"
            type="text"
            name="company"
            autocomplete="organization"
            maxlength="120"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            :class="[inputClass('company'), 'h-12']"
            @blur="onBlur('company')"
            @input="onInput('company')"
          />
        </FormField>

        <FormField id="cf-phone" v-slot="{ id, describedBy, invalid }" label="رقم الهاتف" required :error="errors.phone">
          <input
            :id="id"
            v-model="form.phone"
            type="tel"
            name="phone"
            dir="ltr"
            inputmode="tel"
            autocomplete="tel"
            maxlength="20"
            placeholder="+000 00 000 0000"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            aria-required="true"
            :class="[inputClass('phone'), 'h-12 text-right']"
            @blur="onBlur('phone')"
            @input="onInput('phone')"
          />
        </FormField>

        <FormField id="cf-email" v-slot="{ id, describedBy, invalid }" label="البريد الإلكتروني" required :error="errors.email">
          <input
            :id="id"
            v-model="form.email"
            type="email"
            name="email"
            dir="ltr"
            autocomplete="email"
            maxlength="120"
            placeholder="name@company.com"
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            aria-required="true"
            :class="[inputClass('email'), 'h-12 text-right']"
            @blur="onBlur('email')"
            @input="onInput('email')"
          />
        </FormField>

        <FormField
          id="cf-service"
          v-slot="{ id, describedBy, invalid }"
          label="الخدمة المطلوبة"
          required
          :error="errors.service"
          class="sm:col-span-2"
        >
          <div class="relative">
            <select
              :id="id"
              v-model="form.service"
              name="service"
              :aria-invalid="invalid"
              :aria-describedby="describedBy"
              aria-required="true"
              :class="[inputClass('service'), 'h-12 appearance-none pe-11', !form.service && 'text-navy-400']"
              @blur="onBlur('service')"
              @change="onBlur('service')"
            >
              <option value="" disabled>اختر الخدمة</option>
              <option v-for="option in serviceOptions" :key="option.value" :value="option.value" class="text-navy-900">
                {{ option.label }}
              </option>
            </select>
            <ChevronDown :size="18" class="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          </div>
        </FormField>

        <FormField
          id="cf-message"
          v-slot="{ id, describedBy, invalid }"
          label="الرسالة"
          required
          :error="errors.message"
          class="sm:col-span-2"
        >
          <textarea
            :id="id"
            v-model="form.message"
            name="message"
            rows="5"
            maxlength="2000"
            placeholder="أخبرنا باختصار عن مشروعك أو احتياجك..."
            :aria-invalid="invalid"
            :aria-describedby="describedBy"
            aria-required="true"
            :class="[inputClass('message'), 'resize-y py-3 leading-7']"
            @blur="onBlur('message')"
            @input="onInput('message')"
          />
        </FormField>

        <!-- Honeypot (hidden from users and assistive tech) -->
        <div class="hidden" aria-hidden="true">
          <label for="cf-website">Website</label>
          <input id="cf-website" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
        </div>
      </div>

      <!-- Not configured: offer the configured channels instead -->
      <div
        v-if="status === 'unconfigured'"
        class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm leading-7 text-navy-800"
        role="status"
      >
        <p class="flex items-start gap-2 font-semibold">
          <Info :size="18" class="mt-1 shrink-0 text-brand-700" aria-hidden="true" />
          <template v-if="fallbackWhatsapp || fallbackEmail">
            الإرسال المباشر من الموقع غير مفعّل حالياً. يمكنك إرسال طلبك بنفس البيانات عبر:
          </template>
          <template v-else>الإرسال من الموقع غير متاح حالياً. يرجى المحاولة لاحقاً.</template>
        </p>
        <div v-if="fallbackWhatsapp || fallbackEmail" class="mt-4 flex flex-wrap gap-3">
          <BaseButton v-if="fallbackWhatsapp" :href="fallbackWhatsapp" external variant="whatsapp" size="sm">
            <BrandIcon name="whatsapp" :size="16" />
            إرسال عبر واتساب
          </BaseButton>
          <BaseButton v-if="fallbackEmail" :href="fallbackEmail" variant="outline" size="sm">
            <Mail :size="16" aria-hidden="true" />
            إرسال عبر البريد
          </BaseButton>
        </div>
      </div>

      <p
        v-if="status === 'error'"
        class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
        role="alert"
      >
        تعذّر إرسال الطلب. يرجى التحقق من الاتصال والمحاولة مرة أخرى.
      </p>

      <BaseButton type="submit" size="lg" class="mt-7 w-full sm:w-auto" :disabled="status === 'submitting'">
        <LoaderCircle v-if="status === 'submitting'" :size="18" class="animate-spin" aria-hidden="true" />
        <Send v-else :size="18" class="rtl:-scale-x-100" aria-hidden="true" />
        {{ status === 'submitting' ? 'جارٍ الإرسال...' : 'إرسال الطلب' }}
      </BaseButton>
    </form>
  </div>
</template>
