<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Avatar from "./ui/Avatar.vue";
import Button from "./ui/Button.vue";
import Icon from "./ui/Icon.vue";
import Input from "./ui/Input.vue";
import Sheet from "./ui/Sheet.vue";
import { useToasts } from "./ui/useToasts";
import { usePrintList } from "../composables/usePrintList";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import type { WishlistItem } from "../types.ts";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();
const router = useRouter();
const { printing, print } = usePrintList();

const renaming = ref(false);
const draft = ref("");
const saving = ref(false);
const field = ref<InstanceType<typeof Input> | null>(null);
const items = ref<WishlistItem[]>([]);

watch(
  () => props.open,
  async (open) => {
    renaming.value = false;
    if (!open) return;
    try {
      items.value = (await api.getMyWishlist()).items ?? [];
    } catch {
      items.value = [];
    }
  },
);

async function startRenaming() {
  draft.value = auth.user?.name ?? "";
  renaming.value = true;
  await nextTick();
  field.value?.focus();
}

async function saveName() {
  saving.value = true;
  try {
    await auth.updateName(draft.value);
    renaming.value = false;
    push(t("account.nameSaved"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    saving.value = false;
  }
}

async function onPrint() {
  await print(items.value);
}

async function onLogout() {
  emit("close");
  await auth.logout();
  push(t("toast.bye"), "info");
  await router.push("/");
}
</script>

<template>
  <Sheet :open="open" :title="t('account.title')" @close="emit('close')">
    <div class="flex items-center gap-3">
      <Avatar :name="auth.user?.name ?? ''" size="lg" />
      <div class="min-w-0">
        <p class="mb-0 truncate font-semibold" data-test="display-name-value">
          {{ auth.user?.name }}
        </p>
        <p class="mb-0 truncate text-caption text-muted">
          {{ auth.user?.email }}
        </p>
      </div>
    </div>

    <form
      v-if="renaming"
      class="grid gap-3"
      data-test="display-name-editor"
      @submit.prevent="saveName"
    >
      <Input
        ref="field"
        v-model="draft"
        name="display-name"
        data-test="display-name-input"
        :label="t('account.nameLabel')"
        required
      />
      <div class="flex gap-2">
        <Button
          variant="primary"
          type="submit"
          class="flex-1"
          :loading="saving"
          data-test="display-name-save"
        >
          {{ t("account.save") }}
        </Button>
        <Button
          variant="secondary"
          class="flex-1"
          data-test="display-name-cancel"
          @click="renaming = false"
        >
          {{ t("account.cancel") }}
        </Button>
      </div>
    </form>

    <ul class="m-0 list-none border-t border-divider p-0">
      <li v-if="!renaming" class="border-b border-divider">
        <button
          type="button"
          class="account-row"
          data-test="display-name-edit"
          @click="startRenaming"
        >
          <Icon name="pencil" :size="22" class="text-muted" />
          {{ t("account.rename") }}
        </button>
      </li>
      <li class="border-b border-divider">
        <button
          type="button"
          class="account-row"
          data-test="account-print"
          :disabled="!items.length || printing"
          @click="onPrint"
        >
          <Icon name="printer" :size="22" class="text-muted" />
          {{ t("account.print") }}
        </button>
      </li>
      <li class="border-b border-divider">
        <button
          type="button"
          class="account-row"
          data-test="logout"
          @click="onLogout"
        >
          <Icon name="logOut" :size="22" class="text-muted" />
          {{ t("account.logout") }}
        </button>
      </li>
    </ul>
  </Sheet>
</template>

<style scoped>
@reference "../index.css";

.account-row {
  @apply flex min-h-14 w-full items-center gap-3 rounded-md px-2 text-left text-body text-ink transition-colors enabled:hover:bg-neutral-200 enabled:active:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-45;
}
</style>
