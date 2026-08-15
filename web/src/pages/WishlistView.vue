<template>
  <Button variant="ghost" to="/wishlists" class="-ml-1 mb-3">
    <Icon name="arrowLeft" :size="14" />
    {{ t("view.back") }}
  </Button>

  <div v-if="ownerName" class="mb-6 flex items-center gap-3">
    <Avatar :name="ownerName" size="lg" />
    <div>
      <h1 class="mb-0">{{ t("view.title", { name: ownerName }) }}</h1>
      <p class="mb-0 text-caption text-muted">
        {{ t("view.counter", { remaining, total: items.length }) }}
      </p>
    </div>
  </div>

  <p v-if="error" class="text-accent-700">{{ error }}</p>

  <ul v-if="items.length" class="grid gap-3">
    <li v-for="it in items" :key="it.id">
      <PersonWishlistItem
        :item="it"
        :viewer-id="auth.user?.id"
        @reserve="reserve(it.id)"
        @purchase="purchase(it.id)"
        @unreserve="unreserve(it.id)"
      />
    </li>
  </ul>

  <div v-else-if="!error" class="text-muted">{{ t("view.empty") }}</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import PersonWishlistItem from "../components/wishlist/PersonWishlistItem.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth.ts";
import type { WishlistItem } from "../types.ts";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();

const ownerName = ref("");
const items = ref<WishlistItem[]>([]);
const error = ref("");

const props = defineProps<{ userId: string }>();

const remaining = computed(
  () => items.value.filter((it) => !it.reserved).length,
);

async function load() {
  try {
    const list = await api.viewWishlist(props.userId);
    ownerName.value = list.owner?.name ?? "";
    items.value = list.items ?? [];
  } catch (e: any) {
    error.value = e.message ?? "Erreur";
  }
}
async function reserve(id: string) {
  await api.reserve(id);
  push(t("toast.reserved"), "success");
  await load();
}
async function unreserve(id: string) {
  await api.unreserve(id);
  push(t("toast.unreserved"), "info");
  await load();
}
async function purchase(id: string) {
  await api.purchase(id);
  push(t("toast.purchased"), "success");
  await load();
}

onMounted(load);
</script>
