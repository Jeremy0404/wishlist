<template>
  <PageHeader>
    {{ t("admin.title") }}
    <template #lead>{{ t("admin.lead") }}</template>
  </PageHeader>

  <p v-if="error" class="text-danger">{{ error }}</p>

  <ListSkeleton v-else-if="loading" />

  <template v-else>
    <Button
      variant="primary"
      block
      class="min-h-14 text-body"
      data-test="admin-add"
      @click="adding = true"
    >
      <Icon name="userPlus" :size="22" />
      {{ t("admin.add") }}
    </Button>

    <section
      v-for="group in groups"
      :key="group.id"
      data-test="admin-family"
      :data-name="group.name"
    >
      <h2 class="mb-2 text-h4">{{ group.name }}</h2>
      <ul
        v-if="group.members.length"
        class="m-0 list-none border-t border-divider p-0"
      >
        <li
          v-for="(member, index) in group.members"
          :key="member.id"
          class="border-b border-divider"
        >
          <RouterLink
            :to="`/admin/users/${member.id}`"
            class="flex items-center gap-3.5 px-1 py-3.5 text-ink no-underline transition-colors hover:bg-neutral-200 active:bg-neutral-300"
            data-test="admin-member"
            :data-name="member.name"
          >
            <Avatar
              :name="member.name"
              size="lg"
              :tone="toneAt(index)"
              aria-hidden="true"
            />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="font-semibold">{{ member.name }}</span>
              <span class="truncate text-caption text-muted">
                {{ summary(member) }}
              </span>
            </span>
            <Icon name="chevronRight" :size="20" class="text-neutral-500" />
          </RouterLink>
        </li>
      </ul>
      <p v-else class="text-muted">{{ t("admin.noMember") }}</p>
    </section>
  </template>

  <AccountCreateSheet
    :open="adding"
    :families="overview.families"
    @close="adding = false"
    @created="openCreated"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import AccountCreateSheet from "../components/admin/AccountCreateSheet.vue";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import PageHeader from "../components/PageHeader.vue";
import { toneAt } from "../utils/tones";
import type { AdminFamily, AdminMember, AdminOverview } from "../types.ts";

const FAMILYLESS_GROUP_ID = "familyless";

const { t } = useI18n();
const loading = ref(true);
const error = ref("");
const overview = ref<AdminOverview>({ families: [], familyless: [] });
const adding = ref(false);
const router = useRouter();

async function openCreated(userId: string) {
  adding.value = false;
  await router.push(`/admin/users/${userId}`);
}

const groups = computed<AdminFamily[]>(() => {
  const { families, familyless } = overview.value;
  if (!familyless.length) return families;
  return [
    ...families,
    { id: FAMILYLESS_GROUP_ID, name: t("admin.familyless"), members: familyless },
  ];
});

function summary(member: AdminMember) {
  const identifier = member.email ?? member.username ?? "";
  const wishes = member.wish_count
    ? t("admin.wishCount", member.wish_count)
    : t("admin.noWish");
  return `${identifier} · ${wishes}`;
}

onMounted(async () => {
  try {
    overview.value = await api.adminOverview();
  } catch (e: any) {
    error.value = e.message ?? t("toast.error");
  } finally {
    loading.value = false;
  }
});
</script>
