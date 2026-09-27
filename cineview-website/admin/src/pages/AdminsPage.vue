<script setup>
import { ref, reactive, onMounted } from 'vue'
import { UserPlus, Pencil, KeyRound, Power, TriangleAlert } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import StateBlock from '@/components/StateBlock.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseModal from '@/components/BaseModal.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import CopyButton from '@/components/CopyButton.vue'
import { usersApi } from '@/services/api'
import { errorMessage, fieldErrors } from '@/services/http'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS, ADMIN_STATUS_LABELS } from '@/utils/labels'
import { formatDateTime, formatDate, timeAgo } from '@/utils/format'

const toast = useToastStore()
const auth = useAuthStore()

const admins = ref([])
const state = ref('loading')
const error = ref('')

async function load() {
  state.value = 'loading'
  try {
    admins.value = (await usersApi.list()).data
    state.value = 'ready'
  } catch (err) {
    error.value = errorMessage(err)
    state.value = 'error'
  }
}
onMounted(load)

const isSelf = (admin) => admin.id === auth.admin?.id
const replace = (updated) => {
  admins.value = admins.value.map((a) => (a.id === updated.id ? updated : a))
  if (isSelf(updated)) auth.updateProfile(updated)
}

/* ---------- Create / edit ---------- */
const editor = reactive({ open: false, mode: 'create', id: null, saving: false, errors: {} })
const form = reactive({ fullName: '', username: '', email: '', role: 'ADMIN', password: '' })

function openCreate() {
  Object.assign(form, { fullName: '', username: '', email: '', role: 'ADMIN', password: '' })
  Object.assign(editor, { open: true, mode: 'create', id: null, errors: {} })
}
function openEdit(admin) {
  Object.assign(form, { fullName: admin.fullName, username: admin.username, email: admin.email, role: admin.role, password: '' })
  Object.assign(editor, { open: true, mode: 'edit', id: admin.id, errors: {} })
}

async function saveEditor() {
  editor.saving = true
  editor.errors = {}
  try {
    if (editor.mode === 'create') {
      const res = await usersApi.create({ ...form })
      admins.value = [...admins.value, res.data]
      toast.success('تم إنشاء المستخدم')
    } else {
      const res = await usersApi.update(editor.id, { fullName: form.fullName, email: form.email, role: form.role })
      replace(res.data)
      toast.success('تم تحديث المستخدم')
    }
    editor.open = false
  } catch (err) {
    editor.errors = fieldErrors(err)
    if (!Object.keys(editor.errors).length) toast.error(errorMessage(err))
  } finally {
    editor.saving = false
  }
}

/* ---------- Enable / disable ---------- */
const toggling = ref('')
const confirmDisable = reactive({ open: false, admin: null })

async function setStatus(admin, status) {
  toggling.value = admin.id
  try {
    const res = await usersApi.update(admin.id, { status })
    replace(res.data)
    toast.success(status === 'DISABLED' ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم')
    confirmDisable.open = false
  } catch (err) {
    toast.error(errorMessage(err))
  } finally {
    toggling.value = ''
  }
}

/* ---------- Password reset ---------- */
const reset = reactive({ open: false, admin: null, mode: 'generate', password: '', saving: false, error: '', temporary: '' })

function openReset(admin) {
  Object.assign(reset, { open: true, admin, mode: 'generate', password: '', saving: false, error: '', temporary: '' })
}
async function submitReset() {
  reset.saving = true
  reset.error = ''
  try {
    const res = await usersApi.resetPassword(reset.admin.id, reset.mode === 'manual' ? reset.password : undefined)
    if (res.data.temporaryPassword) {
      reset.temporary = res.data.temporaryPassword // shown once, never stored
    } else {
      reset.open = false
    }
    toast.success('تم إعادة تعيين كلمة المرور')
  } catch (err) {
    reset.error = fieldErrors(err).password || errorMessage(err)
  } finally {
    reset.saving = false
  }
}
function closeReset() {
  reset.open = false
  reset.temporary = ''
  reset.password = ''
}
</script>

<template>
  <div>
    <PageHeader title="المستخدمون" subtitle="إدارة حسابات فريق سينيفيو وصلاحياتهم.">
      <template #actions>
        <BaseButton size="sm" @click="openCreate"><UserPlus :size="15" aria-hidden="true" /> مستخدم جديد</BaseButton>
      </template>
    </PageHeader>

    <section class="card overflow-hidden">
      <StateBlock v-if="state === 'loading'" state="loading" />
      <StateBlock v-else-if="state === 'error'" state="error" :message="error" @retry="load" />
      <div v-else class="scrollbar-thin relative overflow-x-auto">
        <table class="w-full min-w-[900px] text-sm">
          <thead class="border-b border-navy-100 bg-navy-50/60 text-xs font-bold text-navy-500">
            <tr>
              <th scope="col" class="px-4 py-3 text-start">الاسم</th>
              <th scope="col" class="px-4 py-3 text-start">اسم المستخدم</th>
              <th scope="col" class="px-4 py-3 text-start">البريد الإلكتروني</th>
              <th scope="col" class="px-4 py-3 text-start">الصلاحية</th>
              <th scope="col" class="px-4 py-3 text-start">الحالة</th>
              <th scope="col" class="px-4 py-3 text-start">آخر دخول</th>
              <th scope="col" class="px-4 py-3 text-start">تاريخ الإنشاء</th>
              <th scope="col" class="px-4 py-3 text-start"><span class="sr-only">الإجراءات</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-navy-100">
            <tr v-for="admin in admins" :key="admin.id" :class="admin.status === 'DISABLED' && 'bg-navy-50/40'">
              <td class="px-4 py-3 font-bold text-navy-950">
                {{ admin.fullName }}
                <span v-if="isSelf(admin)" class="ms-1 rounded bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-bold text-brand-700">أنت</span>
              </td>
              <td class="px-4 py-3 text-navy-700" dir="ltr" style="text-align: right">{{ admin.username }}</td>
              <td class="px-4 py-3 text-navy-700" dir="ltr" style="text-align: right">{{ admin.email }}</td>
              <td class="px-4 py-3">
                <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold', admin.role === 'SUPER_ADMIN' ? 'bg-navy-900 text-white' : 'bg-navy-100 text-navy-700']">
                  {{ ROLE_LABELS[admin.role] }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center gap-1.5 text-xs font-bold', admin.status === 'ACTIVE' ? 'text-emerald-700' : 'text-navy-400']">
                  <span :class="['size-1.5 rounded-full', admin.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-navy-300']" aria-hidden="true" />
                  {{ ADMIN_STATUS_LABELS[admin.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-navy-600" :title="admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : ''">
                {{ admin.lastLoginAt ? timeAgo(admin.lastLoginAt) : 'لم يسجل الدخول' }}
              </td>
              <td class="px-4 py-3 text-navy-600">{{ formatDate(admin.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button type="button" class="inline-flex size-8 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-100 hover:text-navy-900" :aria-label="`تعديل ${admin.fullName}`" title="تعديل" @click="openEdit(admin)">
                    <Pencil :size="15" aria-hidden="true" />
                  </button>
                  <button type="button" class="inline-flex size-8 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-100 hover:text-navy-900" :aria-label="`إعادة تعيين كلمة مرور ${admin.fullName}`" title="إعادة تعيين كلمة المرور" @click="openReset(admin)">
                    <KeyRound :size="15" aria-hidden="true" />
                  </button>
                  <button
                    v-if="!isSelf(admin)"
                    type="button"
                    :disabled="toggling === admin.id"
                    :class="[
                      'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition disabled:opacity-50',
                      admin.status === 'ACTIVE' ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50',
                    ]"
                    @click="admin.status === 'ACTIVE' ? Object.assign(confirmDisable, { open: true, admin }) : setStatus(admin, 'ACTIVE')"
                  >
                    <Power :size="14" aria-hidden="true" />
                    {{ admin.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Create / edit -->
    <BaseModal :open="editor.open" :title="editor.mode === 'create' ? 'مستخدم جديد' : 'تعديل المستخدم'" @close="editor.open = false">
      <form id="admin-editor" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="saveEditor">
        <div class="sm:col-span-2">
          <label for="ae-name" class="mb-1.5 block text-sm font-bold text-navy-800">الاسم الكامل</label>
          <input id="ae-name" v-model="form.fullName" class="field" autocomplete="off" :aria-invalid="!!editor.errors.fullName" />
          <p v-if="editor.errors.fullName" class="mt-1.5 text-sm text-rose-600">{{ editor.errors.fullName }}</p>
        </div>
        <div>
          <label for="ae-username" class="mb-1.5 block text-sm font-bold text-navy-800">اسم المستخدم</label>
          <input
            id="ae-username"
            v-model="form.username"
            class="field text-right"
            dir="ltr"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            :disabled="editor.mode === 'edit'"
            :aria-invalid="!!editor.errors.username"
            aria-describedby="ae-username-hint"
          />
          <p v-if="editor.errors.username" class="mt-1.5 text-sm text-rose-600">{{ editor.errors.username }}</p>
          <p v-else id="ae-username-hint" class="mt-1.5 text-xs text-navy-500">
            {{ editor.mode === 'edit' ? 'لا يمكن تغيير اسم المستخدم.' : 'أحرف إنجليزية صغيرة وأرقام و . _ -' }}
          </p>
        </div>
        <div>
          <label for="ae-email" class="mb-1.5 block text-sm font-bold text-navy-800">البريد الإلكتروني</label>
          <input id="ae-email" v-model="form.email" type="email" class="field text-right" dir="ltr" autocomplete="off" :aria-invalid="!!editor.errors.email" />
          <p v-if="editor.errors.email" class="mt-1.5 text-sm text-rose-600">{{ editor.errors.email }}</p>
        </div>
        <fieldset class="sm:col-span-2">
          <legend class="mb-1.5 text-sm font-bold text-navy-800">الصلاحية</legend>
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="role in ['ADMIN', 'SUPER_ADMIN']"
              :key="role"
              :class="[
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                form.role === role ? 'border-navy-900 bg-navy-50' : 'border-navy-200 hover:border-navy-300',
                editor.mode === 'edit' && editor.id === auth.admin?.id && 'pointer-events-none opacity-60',
              ]"
            >
              <input v-model="form.role" type="radio" name="role" :value="role" class="mt-1 accent-navy-900" :disabled="editor.mode === 'edit' && editor.id === auth.admin?.id" />
              <span>
                <span class="block text-sm font-bold text-navy-900">{{ ROLE_LABELS[role] }}</span>
                <span class="block text-xs leading-5 text-navy-500">
                  {{ role === 'ADMIN' ? 'إدارة طلبات التواصل والملاحظات.' : 'كل الصلاحيات، بما فيها إدارة المستخدمين.' }}
                </span>
              </span>
            </label>
          </div>
          <p v-if="editor.errors.role" class="mt-1.5 text-sm text-rose-600">{{ editor.errors.role }}</p>
        </fieldset>
        <div v-if="editor.mode === 'create'" class="sm:col-span-2">
          <label for="ae-password" class="mb-1.5 block text-sm font-bold text-navy-800">كلمة المرور المبدئية</label>
          <PasswordInput id="ae-password" v-model="form.password" autocomplete="new-password" :aria-invalid="!!editor.errors.password" aria-describedby="ae-password-hint" />
          <p v-if="editor.errors.password" class="mt-1.5 text-sm text-rose-600">{{ editor.errors.password }}</p>
          <p v-else id="ae-password-hint" class="mt-1.5 text-xs text-navy-500">10 أحرف على الأقل، أحرف وأرقام. شاركها مع المستخدم بطريقة آمنة.</p>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="editor.open = false">إلغاء</BaseButton>
        <BaseButton type="submit" form="admin-editor" :loading="editor.saving">{{ editor.mode === 'create' ? 'إنشاء المستخدم' : 'حفظ التغييرات' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- Disable confirmation -->
    <BaseModal :open="confirmDisable.open" title="تعطيل المستخدم" size="sm" @close="confirmDisable.open = false">
      <p class="text-sm leading-7 text-navy-700">
        سيتم تسجيل خروج <strong>{{ confirmDisable.admin?.fullName }}</strong> فوراً ولن يتمكن من الدخول حتى تتم إعادة تفعيل حسابه.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="confirmDisable.open = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :loading="toggling === confirmDisable.admin?.id" @click="setStatus(confirmDisable.admin, 'DISABLED')">تعطيل</BaseButton>
      </template>
    </BaseModal>

    <!-- Password reset -->
    <BaseModal :open="reset.open" title="إعادة تعيين كلمة المرور" :description="reset.admin ? `للمستخدم: ${reset.admin.fullName}` : ''" size="sm" :dismissible="!reset.saving" @close="closeReset">
      <div v-if="reset.temporary" class="space-y-3">
        <p class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <TriangleAlert :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
          انسخ كلمة المرور المؤقتة الآن — لن تظهر مرة أخرى. تم تسجيل خروج المستخدم من جميع الأجهزة.
        </p>
        <div class="flex items-center justify-between gap-2 rounded-xl border border-navy-200 bg-navy-50 px-4 py-3">
          <code class="text-lg font-bold tracking-wider text-navy-950 select-all" dir="ltr">{{ reset.temporary }}</code>
          <CopyButton :value="reset.temporary" label="نسخ كلمة المرور" />
        </div>
      </div>
      <form v-else id="reset-form" class="space-y-3" novalidate @submit.prevent="submitReset">
        <label :class="['flex cursor-pointer items-start gap-3 rounded-xl border p-3', reset.mode === 'generate' ? 'border-navy-900 bg-navy-50' : 'border-navy-200']">
          <input v-model="reset.mode" type="radio" value="generate" class="mt-1 accent-navy-900" />
          <span>
            <span class="block text-sm font-bold text-navy-900">توليد كلمة مرور مؤقتة</span>
            <span class="block text-xs text-navy-500">كلمة مرور عشوائية قوية تظهر مرة واحدة.</span>
          </span>
        </label>
        <label :class="['flex cursor-pointer items-start gap-3 rounded-xl border p-3', reset.mode === 'manual' ? 'border-navy-900 bg-navy-50' : 'border-navy-200']">
          <input v-model="reset.mode" type="radio" value="manual" class="mt-1 accent-navy-900" />
          <span class="block text-sm font-bold text-navy-900">إدخال كلمة مرور جديدة</span>
        </label>
        <div v-if="reset.mode === 'manual'">
          <label for="reset-password" class="sr-only">كلمة المرور الجديدة</label>
          <PasswordInput id="reset-password" v-model="reset.password" autocomplete="new-password" placeholder="10 أحرف على الأقل، أحرف وأرقام" />
        </div>
        <p v-if="reset.error" class="text-sm text-rose-600" role="alert">{{ reset.error }}</p>
        <p class="text-xs leading-5 text-navy-500">سيتم تسجيل خروج المستخدم من جميع الأجهزة.</p>
      </form>
      <template #footer>
        <template v-if="reset.temporary">
          <BaseButton @click="closeReset">تم</BaseButton>
        </template>
        <template v-else>
          <BaseButton variant="secondary" @click="closeReset">إلغاء</BaseButton>
          <BaseButton type="submit" form="reset-form" :loading="reset.saving">إعادة التعيين</BaseButton>
        </template>
      </template>
    </BaseModal>
  </div>
</template>
