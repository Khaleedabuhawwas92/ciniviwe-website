<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { authApi } from '@/services/api'
import { errorMessage, fieldErrors } from '@/services/http'
import { useToastStore } from '@/stores/toast'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const toast = useToastStore()

const form = reactive({ current: '', next: '', confirm: '' })
const errors = ref({})
const saving = ref(false)

watch(
  () => props.open,
  (open) => {
    if (open) {
      Object.assign(form, { current: '', next: '', confirm: '' })
      errors.value = {}
    }
  },
)

async function submit() {
  errors.value = {}
  if (form.next !== form.confirm) {
    errors.value = { confirm: 'كلمتا المرور غير متطابقتين.' }
    return
  }
  saving.value = true
  try {
    await authApi.changePassword(form.current, form.next)
    toast.success('تم تغيير كلمة المرور')
    emit('close')
  } catch (error) {
    const fields = fieldErrors(error)
    errors.value = { current: fields.currentPassword, next: fields.newPassword }
    if (!fields.currentPassword && !fields.newPassword) toast.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" title="تغيير كلمة المرور" description="سيتم تسجيل خروجك من الأجهزة الأخرى بعد التغيير." size="sm" @close="emit('close')">
    <form id="change-password-form" class="space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="cp-current" class="mb-1.5 block text-sm font-bold text-navy-800">كلمة المرور الحالية</label>
        <PasswordInput id="cp-current" v-model="form.current" autocomplete="current-password" :aria-invalid="!!errors.current" required />
        <p v-if="errors.current" class="mt-1.5 text-sm text-rose-600" role="alert">{{ errors.current }}</p>
      </div>
      <div>
        <label for="cp-next" class="mb-1.5 block text-sm font-bold text-navy-800">كلمة المرور الجديدة</label>
        <PasswordInput id="cp-next" v-model="form.next" autocomplete="new-password" :aria-invalid="!!errors.next" aria-describedby="cp-hint" required />
        <p v-if="errors.next" class="mt-1.5 text-sm text-rose-600" role="alert">{{ errors.next }}</p>
        <p v-else id="cp-hint" class="mt-1.5 text-xs text-navy-500">10 أحرف على الأقل، وتحتوي على أحرف وأرقام.</p>
      </div>
      <div>
        <label for="cp-confirm" class="mb-1.5 block text-sm font-bold text-navy-800">تأكيد كلمة المرور الجديدة</label>
        <PasswordInput id="cp-confirm" v-model="form.confirm" autocomplete="new-password" :aria-invalid="!!errors.confirm" required />
        <p v-if="errors.confirm" class="mt-1.5 text-sm text-rose-600" role="alert">{{ errors.confirm }}</p>
      </div>
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton type="submit" form="change-password-form" :loading="saving">حفظ</BaseButton>
    </template>
  </BaseModal>
</template>
