<script setup>
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

defineOptions({ inheritAttrs: false })
const model = defineModel({ type: String, default: '' })
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input v-model="model" v-bind="$attrs" :type="visible ? 'text' : 'password'" dir="ltr" class="field pe-11 text-right" />
    <button
      type="button"
      class="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-[0.625rem] text-navy-400 hover:text-navy-700"
      :aria-label="visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="18" aria-hidden="true" />
      <Eye v-else :size="18" aria-hidden="true" />
    </button>
  </div>
</template>
