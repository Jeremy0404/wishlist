<template>
  <PageHeader>
    {{ auth.myFamily?.name ?? t("nav.family") }}
    <template #lead>
      {{ alone ? t("browse.leadAlone") : t("browse.lead") }}
    </template>
  </PageHeader>

  <ListSkeleton v-if="loading" />

  <LoadError v-else-if="loadFailed" @retry="load" />

  <div
    v-if="locked"
    class="flex flex-col gap-3 rounded-card bg-accent-100 p-4"
    data-test="browse-locked"
  >
    <p class="mb-0 flex items-start gap-2.5">
      <Icon name="lock" :size="20" class="mt-0.5 shrink-0 text-accent" />
      <span>{{ lockedMessage }}</span>
    </p>
    <div class="flex items-center gap-3">
      <div
        class="h-2 flex-1 overflow-hidden rounded-full bg-accent-200"
        role="progressbar"
        :aria-valuenow="wishesHeld"
        aria-valuemin="0"
        :aria-valuemax="unlock.wishesRequired"
      >
        <div
          class="h-full rounded-full bg-accent"
          :style="{ width: `${(wishesHeld / unlock.wishesRequired) * 100}%` }"
        />
      </div>
      <span class="text-caption text-muted" data-test="browse-locked-progress">
        {{
          t("browse.locked.progress", {
            have: wishesHeld,
            required: unlock.wishesRequired,
          })
        }}
      </span>
    </div>
    <Button variant="primary" to="/me" data-test="browse-locked-add">
      <Icon name="plus" :size="20" />
      {{ t("browse.locked.add") }}
    </Button>
  </div>

  <ul
    v-if="!loadFailed && !loading && rows.length"
    class="m-0 list-none border-t border-divider p-0"
  >
    <li
      v-for="row in rows"
      :key="row.user_id"
      class="border-b border-divider"
      data-test="browse-card"
    >
      <component
        :is="rowElement(row)"
        v-bind="rowAttributes(row)"
        class="flex w-full items-center gap-3.5 px-1 py-3.5 text-left text-ink no-underline"
        :class="
          (locked || row.item_count) &&
          'transition-colors hover:bg-neutral-200 active:bg-neutral-300'
        "
      >
        <Avatar
          :name="row.name"
          size="lg"
          :tone="toneFor(row.user_id)"
          aria-hidden="true"
        />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="font-semibold">{{ row.name }}</span>
          <span class="text-caption text-muted" data-test="browse-summary">
            {{ summary(row) }}
          </span>
        </span>
        <Icon
          v-if="locked"
          name="lock"
          :size="20"
          class="text-neutral-500"
          data-test="browse-lock"
        />
        <Icon
          v-else-if="row.item_count"
          name="chevronRight"
          :size="20"
          class="text-neutral-500"
        />
      </component>
    </li>
  </ul>

  <div v-if="!loading && !loadFailed" data-test="empty-state">
    <Button
      :variant="rows.length ? 'secondary' : 'primary'"
      block
      class="min-h-14 text-body"
      :class="rows.length && 'border-[1.5px] border-dashed border-neutral-400'"
      data-test="browse-invite"
      @click="inviteOpen = true"
    >
      <Icon name="userPlus" :size="22" :class="rows.length && 'text-accent'" />
      {{ t("invite.action") }}
    </Button>
  </div>

  <InviteSheet :open="inviteOpen" @close="inviteOpen = false" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import LoadError from "../components/ui/LoadError.vue";
import { useToasts } from "../components/ui/useToasts";
import InviteSheet from "../components/InviteSheet.vue";
import PageHeader from "../components/PageHeader.vue";
import { useAuth } from "../stores/auth.ts";
import { toneFor } from "../utils/tones";
import type { FamilyWishlist, FamilyWishlists } from "../types.ts";

const { t } = useI18n();
const auth = useAuth();
const loading = ref(true);
const rows = ref<FamilyWishlist[]>([]);
const unlock = ref<Omit<FamilyWishlists, "wishlists">>({
  wishesRequired: 0,
  wishesMissing: 0,
});
const loadFailed = ref(false);
const inviteOpen = ref(false);
const { push } = useToasts();

const locked = computed(() => unlock.value.wishesMissing > 0);
const alone = computed(
  () => !loading.value && !loadFailed.value && rows.value.length === 0,
);
const wishesHeld = computed(
  () => unlock.value.wishesRequired - unlock.value.wishesMissing,
);
const lockedMessage = computed(() =>
  t("browse.locked.message", unlock.value.wishesMissing),
);

function rowElement(row: FamilyWishlist) {
  if (locked.value) return "button";
  return row.item_count ? RouterLink : "div";
}

function rowAttributes(row: FamilyWishlist) {
  if (locked.value)
    return {
      type: "button",
      "aria-label": t("browse.locked.rowLabel", { name: row.name }),
      "data-test": "wishlist-locked",
      onClick: () => push(lockedMessage.value),
    };
  if (row.item_count)
    return { to: `/wishlists/${row.user_id}`, "data-test": "wishlist-open" };
  return { "data-test": "wishlist-pending" };
}

function summary(row: FamilyWishlist) {
  if (!row.item_count) return t("browse.noWish");
  const wishes = t("browse.wishCount", row.item_count);
  return row.reserved_by_me_count
    ? `${wishes} · ${t("browse.givingCount", { count: row.reserved_by_me_count })}`
    : wishes;
}

async function loadRows() {
  if (auth.familyLoadFailed) await auth.refreshFamilies();
  if (auth.familyLoadFailed) throw new Error("family unavailable");
  if (!auth.inFamily) return;
  const { wishlists, ...status } = await api.others();
  rows.value = wishlists;
  unlock.value = status;
}

async function load() {
  loading.value = true;
  loadFailed.value = false;
  try {
    await loadRows();
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
