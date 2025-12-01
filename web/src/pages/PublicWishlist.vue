<template>
  <div class="relative">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-50 via-white to-amber-50"></div>
    <div class="relative max-w-4xl mx-auto">
      <div class="text-center mb-8 space-y-2">
        <p class="text-xs uppercase tracking-[0.25em] text-rose-700 font-semibold">{{
          t("public.eyebrow")
        }}</p>
        <h1 class="text-3xl sm:text-4xl font-serif text-rose-900">
          {{ t("public.title", { name: ownerDisplay }) }}
        </h1>
        <p class="text-sm text-rose-700">{{ t("public.subtitle") }}</p>
      </div>

      <div
        class="relative overflow-hidden rounded-[32px] border border-rose-100 bg-white/90 shadow-xl shadow-rose-100/70"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-white to-rose-50/70"></div>
        <div class="relative p-6 sm:p-10 space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                {{ t("public.stamp") }}
              </p>
              <p class="text-sm text-zinc-500" v-if="publishedAt">
                {{ t("common.createdAt") }} : {{ formatDate(publishedAt) }}
              </p>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              {{ t("public.online") }}
            </div>
          </div>

          <div v-if="loading" class="text-center text-zinc-500 py-12">
            {{ t("common.loading") }}
          </div>
          <div
            v-else-if="error"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-rose-700"
          >
            {{ error }}
          </div>
          <div v-else>
            <ul v-if="items.length" class="space-y-3">
              <li v-for="item in items" :key="item.id">
                <div
                  class="group rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="space-y-1">
                      <p class="text-lg font-semibold text-rose-900">{{ item.title }}</p>
                      <p class="text-sm text-amber-800" v-if="item.notes">{{ item.notes }}</p>
                    </div>
                    <div class="text-right text-sm font-semibold text-emerald-700" v-if="item.price_eur">
                      {{ fmtEUR(item.price_eur) }}
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>{{ t("public.priority", { value: item.priority ?? 3 }) }}</span>
                    <a
                      v-if="item.url"
                      :href="item.url ?? undefined"
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800"
                    >
                      {{ t("public.link") }}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </li>
            </ul>
            <div
              v-else
              class="rounded-2xl border border-dashed border-rose-200 bg-white/90 px-4 py-8 text-center text-rose-700"
            >
              {{ t("public.empty") }}
            </div>

            <div class="pt-6 text-right font-serif text-rose-900">
              <p class="text-lg">{{ t("public.signature", { name: ownerDisplay }) }}</p>
              <p class="text-sm text-rose-700">{{ t("public.footer") }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import { fmtEUR } from "../utils/money";
import type { WishlistItem } from "../types.ts";

const route = useRoute();
const { t } = useI18n();

const loading = ref(true);
const error = ref<string | null>(null);
const items = ref<WishlistItem[]>([]);
const ownerName = ref<string>("");
const publishedAt = ref<string | null>(null);

const slug = computed(() => route.params.slug as string);
const ownerDisplay = computed(() => ownerName.value || t("public.someone"));

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api.viewPublicWishlist(slug.value);
    ownerName.value = data.owner?.name || "";
    items.value = data.items || [];
    publishedAt.value = data.wishlist?.published_at ?? null;
  } catch (e: any) {
    error.value = e?.message || t("public.missing");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(slug, load);
</script>
