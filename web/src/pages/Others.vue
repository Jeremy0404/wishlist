<template>
  <PageHeader>
    {{ auth.myFamily?.name ?? t("nav.family") }}
    <template #lead>
      {{ rows.length ? t("browse.lead") : t("browse.leadAlone") }}
    </template>
  </PageHeader>

  <p v-if="error" class="text-danger">{{ error }}</p>

  <ListSkeleton v-else-if="loading" />

  <ul
    v-else-if="rows.length"
    class="m-0 list-none border-t border-divider p-0"
  >
    <li
      v-for="(row, index) in rows"
      :key="row.user_id"
      class="border-b border-divider"
      data-test="browse-card"
    >
      <RouterLink
        :to="`/wishlists/${row.user_id}`"
        class="flex items-center gap-3.5 px-1 py-3.5 text-ink no-underline transition-colors hover:bg-neutral-200"
        data-test="wishlist-open"
      >
        <Avatar
          :name="row.name"
          size="lg"
          :tone="toneAt(index)"
          aria-hidden="true"
        />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="font-semibold">{{ row.name }}</span>
          <span class="text-caption text-muted" data-test="browse-summary">
            {{ summary(row) }}
          </span>
        </span>
        <Icon name="chevronRight" :size="20" class="text-neutral-500" />
      </RouterLink>
    </li>
  </ul>

  <div v-if="!loading && !error" data-test="empty-state">
    <Button
      v-if="auth.inFamily"
      variant="secondary"
      block
      class="min-h-14 border-[1.5px] border-dashed border-neutral-400 text-body"
      data-test="browse-invite"
      @click="inviteOpen = true"
    >
      <Icon name="userPlus" :size="22" class="text-accent" />
      {{ t("browse.invite.action") }}
    </Button>
    <Button
      v-else
      variant="primary"
      block
      class="min-h-14 text-body"
      to="/family/create"
      data-test="browse-create"
    >
      <Icon name="userPlus" :size="22" />
      {{ t("browse.invite.action") }}
    </Button>
  </div>

  <InviteDialog :open="inviteOpen" @close="inviteOpen = false" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import InviteDialog from "../components/InviteDialog.vue";
import PageHeader from "../components/PageHeader.vue";
import { useAuth } from "../stores/auth.ts";
import { toneAt } from "../utils/tones";
import type { FamilyWishlist } from "../types.ts";

const { t } = useI18n();
const auth = useAuth();
const loading = ref(true);
const rows = ref<FamilyWishlist[]>([]);
const error = ref("");
const inviteOpen = ref(false);

function summary(row: FamilyWishlist) {
  const wishes = t("browse.wishCount", row.item_count);
  return row.reserved_by_me_count
    ? `${wishes} · ${t("browse.givingCount", { count: row.reserved_by_me_count })}`
    : wishes;
}

onMounted(async () => {
  try {
    if (auth.inFamily) rows.value = await api.others();
  } catch (e: any) {
    error.value = e.message ?? t("toast.error");
  } finally {
    loading.value = false;
  }
});
</script>
