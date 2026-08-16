<template>
  <div class="mx-auto max-w-[760px] px-4 py-6 sm:py-8" data-test="public-page">
    <div class="mb-6 inline-flex items-center gap-2 font-heading text-h5">
      <Icon name="gift" :size="22" class="text-accent-700" />
      <span>{{ t("nav.wishlist") }}</span>
    </div>

    <header class="mb-6 flex items-center gap-3">
      <Avatar :name="ownerDisplay" size="lg" />
      <div>
        <h1 class="mb-0 text-h3">
          {{ t("public.title", { name: ownerDisplay }) }}
        </h1>
        <p class="mb-0 text-caption text-muted">{{ t("public.subtitle") }}</p>
      </div>
    </header>

    <div class="mb-8">
      <p v-if="error" class="text-danger" data-test="public-error">
        {{ error }}
      </p>

      <ListSkeleton v-else-if="loading" />

      <EmptyState
        v-else-if="!items.length"
        icon="circle"
        :message="t('public.empty')"
      />

      <ul v-else class="grid gap-3">
        <li v-for="item in items" :key="item.id" data-test="public-item">
          <Card class="px-4">
            <div class="flex flex-wrap items-start gap-3">
              <ItemThumbnail :image-url="item.image_url" :size="56" />
              <div class="min-w-[200px] flex-1">
                <a
                  v-if="item.url"
                  :href="item.url"
                  target="_blank"
                  rel="noreferrer"
                  class="font-semibold text-accent"
                >
                  {{ item.title }}
                </a>
                <span v-else class="font-semibold">{{ item.title }}</span>

                <div
                  v-if="item.price_eur != null"
                  class="mt-1 text-caption text-muted"
                >
                  {{ fmtEUR.format(item.price_eur) }}
                </div>

                <p v-if="item.notes" class="mb-0 mt-1 text-caption opacity-80">
                  {{ item.notes }}
                </p>
              </div>
            </div>
          </Card>
        </li>
      </ul>
    </div>

    <Card elevation="md" class="items-start p-6" data-test="public-convert">
      <div class="font-heading text-card-title">
        {{ t("public.convert.title") }}
      </div>
      <p class="mb-0 text-caption opacity-80">{{ t("public.convert.body") }}</p>
      <Button variant="primary" class="mt-1" to="/">
        {{ t("public.convert.action") }}
      </Button>
    </Card>

    <p class="mt-8 text-center text-meta text-muted">
      {{ t("public.footer") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import ItemThumbnail from "../components/wishlist/ItemThumbnail.vue";
import { fmtEUR } from "../utils/money";
import type { WishlistItem } from "../types.ts";

const route = useRoute();
const { t } = useI18n();

const loading = ref(true);
const error = ref<string | null>(null);
const items = ref<WishlistItem[]>([]);
const ownerName = ref<string>("");

const slug = computed(() => route.params.slug as string);
const ownerDisplay = computed(() => ownerName.value || t("public.someone"));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api.viewPublicWishlist(slug.value);
    ownerName.value = data.owner?.name || "";
    items.value = data.items || [];
  } catch (e: any) {
    error.value = e?.message || t("public.missing");
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(slug, load);
</script>
