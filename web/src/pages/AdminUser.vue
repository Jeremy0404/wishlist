<template>
  <RouterLink
    to="/admin"
    class="pressable -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-md pl-1 pr-3 font-semibold text-muted no-underline hover:bg-ink/7 hover:text-ink active:bg-ink/14"
    data-test="admin-back"
  >
    <Icon name="chevronLeft" :size="20" />
    {{ t("admin.back") }}
  </RouterLink>

  <p v-if="error" class="text-danger">{{ error }}</p>

  <ListSkeleton v-else-if="loading || !detail" />

  <template v-else>
    <PageHeader>
      {{ detail.user.name }}
      <template #lead>{{ lead }}</template>
    </PageHeader>

    <div v-if="isOwnList" class="flex flex-col gap-2">
      <p class="mb-0 text-caption text-muted">{{ t("admin.ownListHint") }}</p>
      <Button
        variant="secondary"
        class="self-start"
        data-test="admin-toggle-reservations"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        {{
          revealed ? t("admin.hideReservations") : t("admin.showReservations")
        }}
      </Button>
    </div>

    <Button
      variant="primary"
      block
      class="min-h-14 text-body"
      data-test="admin-item-add"
      @click="openItem(null)"
    >
      <Icon name="plus" :size="22" />
      {{ t("item.add") }}
    </Button>

    <ul
      v-if="detail.items.length"
      class="m-0 list-none border-t border-divider p-0"
    >
      <li
        v-for="(item, index) in detail.items"
        :key="item.id"
        class="flex items-center gap-3.5 border-b border-divider px-1 py-4"
        data-test="admin-item"
        :data-title="item.title"
      >
        <ItemTile :image-url="item.image_url" :tone="toneAt(index)" />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="font-semibold">{{ item.title }}</span>
          <span v-if="meta(item)" class="text-caption text-muted">
            {{ meta(item) }}
          </span>
          <span
            v-if="showReservations"
            class="flex items-center gap-1.5 text-caption"
            :class="item.reserved ? 'text-tone-green-ink' : 'text-muted'"
            data-test="admin-reservation"
          >
            <Icon v-if="item.reserved" name="check" :size="16" />
            {{ reservation(item) }}
          </span>
        </div>
        <Button
          icon
          variant="ghost"
          :aria-label="t('admin.item.editTitle')"
          data-test="admin-item-edit"
          @click="openItem(item)"
        >
          <Icon name="pencil" :size="20" />
        </Button>
      </li>
    </ul>

    <p v-else class="py-8 text-center text-muted" data-test="empty-state">
      {{ t("admin.empty", { name: detail.user.name }) }}
    </p>

    <div class="flex flex-col gap-2">
      <Button variant="secondary" block data-test="admin-edit" @click="editing = true">
        <Icon name="pencil" :size="20" />
        {{ t("admin.edit") }}
      </Button>
      <Button
        variant="secondary"
        block
        data-test="admin-password"
        @click="settingPassword = true"
      >
        <Icon name="user" :size="20" />
        {{ t("admin.password") }}
      </Button>
      <Button
        v-if="!isOwnList && !impact"
        variant="ghost-danger"
        block
        data-test="admin-delete"
        @click="askDeletion"
      >
        <Icon name="trash" :size="20" />
        {{ t("admin.delete") }}
      </Button>
    </div>

    <div v-if="impact" class="flex flex-col gap-2">
      <ul class="m-0 pl-5 text-caption text-muted" data-test="admin-delete-impact">
        <li>{{ t("admin.impactWishes", impact.wishes) }}</li>
        <li>{{ t("admin.impactMade", impact.reservations_made) }}</li>
        <li>{{ t("admin.impactReceived", impact.reservations_received) }}</li>
      </ul>
      <InlineConfirm
        :question="t('admin.deleteConfirm', { name: detail.user.name })"
        :confirm-label="t('admin.deleteYes')"
        :loading="deleting"
        @confirm="deleteAccount"
        @cancel="impact = null"
      />
    </div>

    <AccountEditSheet
      :open="editing"
      :user="detail.user"
      @close="editing = false"
      @saved="onSaved"
    />
    <PasswordSheet
      :open="settingPassword"
      :user-id="userId"
      @close="settingPassword = false"
    />
    <ItemSheet
      :open="itemOpen"
      :item="editedItem"
      :owner-id="userId"
      @close="itemOpen = false"
      @added="load"
      @updated="load"
      @removed="load"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import AccountEditSheet from "../components/admin/AccountEditSheet.vue";
import PasswordSheet from "../components/admin/PasswordSheet.vue";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import InlineConfirm from "../components/ui/InlineConfirm.vue";
import { useToasts } from "../components/ui/useToasts";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import PageHeader from "../components/PageHeader.vue";
import ItemSheet from "../components/wishlist/ItemSheet.vue";
import ItemTile from "../components/wishlist/ItemTile.vue";
import { useAuth } from "../stores/auth.ts";
import { fmtEUR } from "../utils/money";
import { toneAt } from "../utils/tones";
import type {
  AdminProfile,
  AdminUserDetail,
  DeletionImpact,
  WishlistItem,
} from "../types.ts";

const props = defineProps<{ userId: string }>();

const { t } = useI18n();
const auth = useAuth();
const loading = ref(true);
const error = ref("");
const detail = ref<AdminUserDetail | null>(null);
const revealed = ref(false);
const editing = ref(false);
const settingPassword = ref(false);
const impact = ref<DeletionImpact | null>(null);
const deleting = ref(false);
const itemOpen = ref(false);
const editedItem = ref<WishlistItem | null>(null);
const { push } = useToasts();
const router = useRouter();

function onSaved(user: AdminProfile) {
  if (detail.value) detail.value.user = user;
  editing.value = false;
}

async function askDeletion() {
  try {
    impact.value = await api.adminDeletionImpact(props.userId);
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  }
}

async function deleteAccount() {
  deleting.value = true;
  try {
    await api.adminDeleteUser(props.userId);
    push(t("admin.deleted"), "success");
    await router.push("/admin");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    deleting.value = false;
  }
}

const isOwnList = computed(() => props.userId === auth.user?.id);
const showReservations = computed(() => !isOwnList.value || revealed.value);

const lead = computed(() => {
  if (!detail.value) return "";
  const { user, family } = detail.value;
  return [user.email ?? user.username, family?.name ?? t("admin.familyless")]
    .filter(Boolean)
    .join(" · ");
});

function meta(item: WishlistItem) {
  return [
    item.price_eur != null ? fmtEUR.format(item.price_eur) : "",
    item.notes ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function reservation(item: WishlistItem) {
  if (!item.reserved) return t("admin.free");
  const name = item.reserver_name ?? "";
  return item.reservation_status === "purchased"
    ? t("admin.purchasedBy", { name })
    : t("admin.reservedBy", { name });
}

async function load() {
  try {
    detail.value = await api.adminUser(props.userId);
  } catch (e: any) {
    error.value = e.message ?? t("toast.error");
  } finally {
    loading.value = false;
  }
}

function openItem(item: WishlistItem | null) {
  editedItem.value = item;
  itemOpen.value = true;
}

onMounted(load);
</script>
