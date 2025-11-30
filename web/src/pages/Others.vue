<template>
  <h1 class="text-xl font-semibold mb-2">{{ t("others.title") }}</h1>
  <p class="text-zinc-600 mb-3">{{ t("others.hint") }}</p>

  <ul v-if="rows.length" class="grid gap-3">
    <li v-for="r in rows" :key="r.user_id">
      <WishlistItemCard
        :item="{
          id: r.user_id,
          title: r.name,
        }"
      >
        <template #actions>
          <RouterLink
            class="px-3 py-1.5 rounded hover:bg-zinc-100"
            :to="`/wishlists/${r.user_id}`"
            >{{ t("others.open") }}</RouterLink
          >
        </template>
      </WishlistItemCard>
    </li>
  </ul>
  <div v-else-if="!error" class="text-zinc-600">{{ t("others.empty") }}</div>

  <p v-if="error" class="text-red-600 mt-3">{{ error }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../services/api";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import WishlistItemCard from "../components/wishlist/WishlistItemCard.vue";

const { t } = useI18n();
const rows = ref<any[]>([]);
const error = ref("");

onMounted(async () => {
  try {
    rows.value = await api.others();
  } catch (e: any) {
    error.value = e.message ?? "Erreur";
  }
});
</script>
