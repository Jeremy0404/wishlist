<template>
  <div
    class="relative min-h-screen overflow-hidden px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent-100 via-bg to-accent-100"
    ></div>
    <div class="relative max-w-4xl mx-auto">
      <div class="relative mb-6 sm:mb-8 text-center">
        <RouterLink
          class="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-surface/70 px-4 py-2 text-sm font-medium text-accent-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          to="/"
          target="_blank"
        >
          {{ t("public.back") }}
          <span aria-hidden="true">↗</span>
        </RouterLink>
        <div class="space-y-2">
          <p
            class="text-xs uppercase tracking-[0.25em] text-accent-700 font-semibold"
          >
            {{ t("public.eyebrow") }}
          </p>
          <h1 class="text-3xl sm:text-4xl font-serif text-accent-900">
            {{ t("public.title", { name: ownerDisplay }) }}
          </h1>
          <p v-if="subtitle" class="text-sm text-accent-700">{{ subtitle }}</p>
        </div>
      </div>

      <div
        class="relative overflow-hidden rounded-card border border-accent-200 bg-surface/90 shadow-lg"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-accent-100 via-bg to-accent-100"
        ></div>
        <div class="relative p-6 sm:p-10 space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-accent-700"
              >
                {{ t("public.stamp") }}
              </p>
              <p class="text-sm text-neutral-600" v-if="publishedAt">
                {{ t("common.createdAt") }} : {{ formatDate(publishedAt) }}
              </p>
            </div>
            <div
              class="inline-flex items-center gap-2 rounded-full bg-accent-2-100 px-3 py-1 text-xs font-medium text-accent-2-800"
            >
              <span class="h-2 w-2 rounded-full bg-accent-2-500"></span>
              {{ t("public.online") }}
            </div>
          </div>

          <div v-if="loading" class="text-center text-neutral-600 py-12">
            {{ t("common.loading") }}
          </div>
          <div
            v-else-if="error"
            class="rounded-2xl border border-accent-200 bg-accent-100 px-4 py-3 text-center text-accent-700"
          >
            {{ error }}
          </div>
          <div v-else>
            <ul v-if="items.length" class="space-y-3">
              <li v-for="item in items" :key="item.id">
                <div
                  class="group rounded-2xl border border-accent-200 bg-surface/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="space-y-1">
                      <p class="text-lg font-semibold text-accent-900">
                        {{ item.title }}
                      </p>
                      <p class="text-sm text-accent-800" v-if="item.notes">
                        {{ item.notes }}
                      </p>
                    </div>
                    <div
                      class="text-right text-sm font-semibold text-accent-2-700"
                      v-if="item.price_eur"
                    >
                      {{ fmtEUR.format(item.price_eur) }}
                    </div>
                  </div>
                  <div
                    class="mt-2 flex items-center justify-between text-xs text-neutral-600"
                  >
                    <span>{{ priorityText(item.priority) }}</span>
                    <a
                      v-if="item.url"
                      :href="item.url ?? undefined"
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex items-center gap-1 text-accent-700 hover:text-accent-800"
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
              class="rounded-2xl border border-dashed border-accent-200 bg-surface/90 px-4 py-8 text-center text-accent-700"
            >
              {{ t("public.empty") }}
            </div>

            <div class="pt-6 text-right font-serif text-accent-900">
              <p class="text-lg">
                {{ t("public.signature", { name: ownerDisplay }) }}
              </p>
              <p class="text-sm text-accent-700">{{ t("public.footer") }}</p>
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
import { priorityLevel } from "../utils/priority";
import type { WishlistItem } from "../types.ts";

const route = useRoute();
const { t } = useI18n();

function priorityText(priority?: number | null) {
  const level = priorityLevel(priority);
  return level ? t(`priority.${level}`) : "";
}

const loading = ref(true);
const error = ref<string | null>(null);
const items = ref<WishlistItem[]>([]);
const ownerName = ref<string>("");
const publishedAt = ref<string | null>(null);

const slug = computed(() => route.params.slug as string);
const ownerDisplay = computed(() => ownerName.value || t("public.someone"));
const subtitle = computed(() => t("public.subtitle"));

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
