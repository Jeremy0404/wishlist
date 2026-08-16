<template>
  <h1 class="mb-1">{{ t("browse.title") }}</h1>
  <p class="mb-6 text-muted">{{ t("browse.subtitle") }}</p>

  <p v-if="error" class="text-accent-700">{{ error }}</p>

  <ListSkeleton v-else-if="loading" />

  <EmptyState
    v-else-if="!rows.length"
    icon="users"
    :message="auth.inFamily ? t('browse.empty') : t('browse.noFamily')"
  >
    <template v-if="auth.inFamily" #action>
      <Button
        variant="secondary"
        data-test="browse-invite"
        @click="inviteOpen = true"
      >
        {{ t("browse.emptyAction") }}
      </Button>
    </template>
  </EmptyState>

  <div
    v-else
    class="grid gap-4"
    style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))"
  >
    <Card v-for="row in rows" :key="row.user_id" data-test="browse-card">
      <Avatar :name="row.name" />
      <div class="mt-1 font-heading text-card-title">{{ row.name }}</div>
      <p class="mb-0 text-caption opacity-80" data-test="browse-summary">
        {{ summary(row) }}
      </p>
      <Button
        variant="secondary"
        block
        class="justify-between"
        data-test="wishlist-open"
        :to="`/wishlists/${row.user_id}`"
      >
        {{ t("browse.open") }}
        <Icon name="arrowRight" :size="14" />
      </Button>
    </Card>

    <div
      v-if="auth.inFamily"
      class="flex flex-col items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-divider p-4 text-center"
    >
      <Icon name="users" :size="20" class="text-accent" />
      <div class="font-heading text-card-title">
        {{ t("browse.inviteCard.title") }}
      </div>
      <p class="mb-0 text-caption opacity-80">
        {{ t("browse.inviteCard.body") }}
      </p>
      <Button
        variant="secondary"
        class="mt-1"
        data-test="browse-invite"
        @click="inviteOpen = true"
      >
        {{ t("browse.inviteCard.action") }}
      </Button>
    </div>
  </div>

  <InviteDialog :open="inviteOpen" @close="inviteOpen = false" />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import InviteDialog from "../components/InviteDialog.vue";
import { useAuth } from "../stores/auth.ts";
import type { FamilyWishlist } from "../types.ts";

const { t } = useI18n();
const auth = useAuth();
const loading = ref(true);
const rows = ref<FamilyWishlist[]>([]);
const error = ref("");
const inviteOpen = ref(false);

function summary(row: FamilyWishlist) {
  const items = t("browse.itemCount", row.item_count);
  const reserved = row.reserved_by_me_count
    ? t("browse.reservedCount", row.reserved_by_me_count)
    : t("browse.reservedNone");
  return `${items} · ${reserved}`;
}

onMounted(async () => {
  try {
    if (auth.inFamily) rows.value = await api.others();
  } catch (e: any) {
    error.value = e.message ?? "Erreur";
  } finally {
    loading.value = false;
  }
});
</script>
