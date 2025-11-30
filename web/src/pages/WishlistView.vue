<template>
  <h1 class="text-xl font-semibold mb-4">
    {{ ownerName ? t("view.title", { name: ownerName }) : "Wishlist" }}
  </h1>
  <p v-if="error" class="text-red-600">{{ error }}</p>

  <ul v-if="items.length" class="grid gap-3">
    <li v-for="it in items" :key="it.id">
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">
              {{ it.title }}
              <span v-if="it.priority" class="text-xs text-zinc-500"
                >• P{{ it.priority }}</span
              >
            </div>
            <div v-if="it.url" class="text-sm text-brand-700">
              <a :href="it.url" target="_blank">{{ it.url }}</a>
            </div>
            <div v-if="it.price_eur != null" class="text-sm text-zinc-600">
              {{ fmtEUR.format(it.price_eur) }}
            </div>
            <div
              v-if="it.notes"
              class="text-sm text-zinc-700 whitespace-pre-wrap mt-1"
            >
              {{ it.notes }}
            </div>
          </div>

          <div class="flex gap-2 items-center">
            <template v-if="it.reserved">
              <span class="text-sm text-zinc-600">
                {{ statusLabel(it.reservation_status) }}
                {{ t("view.by", { name: it.reserver_name }) }}
              </span>
              <Button variant="ghost" @click="unreserve(it.id)">{{
                t("view.unreserve")
              }}</Button>
              <Button
                v-if="it.reservation_status !== 'purchased'"
                variant="primary"
                @click="purchase(it.id)"
                >{{ t("view.purchase") }}</Button
              >
            </template>
            <template v-else>
              <Button variant="primary" @click="reserve(it.id)">{{
                t("view.reserve")
              }}</Button>
            </template>
          </div>
        </div>
      </Card>
    </li>
  </ul>

  <div v-else class="text-zinc-600">{{ t("view.empty") }}</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Card from "../components/ui/Card.vue";
import Button from "../components/ui/Button.vue";
import { useToasts } from "../components/ui/useToasts";
import { fmtEUR } from "../utils/money.ts";
import type { WishlistItem } from "../types.ts";

const { t, te } = useI18n();
const { push } = useToasts();

const ownerName = ref("");
const items = ref<WishlistItem[]>([]);
const error = ref("");

const props = defineProps<{ userId: string }>();

async function load() {
  try {
    const userId = props.userId;
    const list = await api.viewWishlist(userId);
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
function statusLabel(s?: string | null) {
  const key = `status.${s}`;
  return te(key) ? t(key) : s;
}

onMounted(load);
</script>
