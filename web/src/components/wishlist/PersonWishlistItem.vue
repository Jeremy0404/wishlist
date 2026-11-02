<template>
  <div class="flex flex-col gap-3 px-1 py-4">
    <div class="flex items-start gap-3.5">
      <button
        v-if="photoSrc"
        type="button"
        class="pressable flex-none rounded-md"
        :aria-label="t('view.photo', { title: item.title })"
        data-test="item-photo-open"
        @click="photoOpen = true"
      >
        <ItemTile :image-url="item.image_url" :tone="tileTone" />
      </button>
      <ItemTile v-else :image-url="item.image_url" :tone="tileTone" />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          class="flex items-center gap-1.5 font-semibold"
          :class="state === 'other' && 'text-muted'"
        >
          <span class="min-w-0">{{ item.title }}</span>
          <template v-if="isFavorite(item.priority)">
            <Icon name="heart" :size="16" class="fill-current text-accent" />
            <span class="sr-only">{{ t("item.favorite") }}</span>
          </template>
        </span>
        <span v-if="price" class="text-caption font-semibold" data-test="wishlist-price">
          {{ price }}
        </span>
        <p
          v-if="item.notes"
          class="mb-0 whitespace-pre-line text-caption"
          data-test="wishlist-notes"
        >
          {{ item.notes }}
        </p>
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1 self-start text-caption font-semibold hover:text-accent-800 hover:underline active:text-accent-900"
        >
          {{ t("view.link") }}
          <Icon name="externalLink" :size="14" />
        </a>
      </div>
    </div>

    <div class="pl-[66px]">
      <Button
        v-if="state === 'open'"
        variant="primary"
        class="min-h-11 px-5"
        :loading="busy"
        data-test="wishlist-reserve"
        @click="emit('reserve')"
      >
        {{ t("view.give") }}
      </Button>

      <div v-else-if="state === 'mine'" class="flex flex-wrap items-center gap-2">
        <span
          class="inline-flex h-9 items-center gap-1.5 rounded-pill bg-tone-green px-3.5 text-caption font-semibold text-tone-green-ink"
          data-test="wishlist-status"
        >
          <Icon name="check" :size="18" />
          {{ t("view.giving") }}
        </span>
        <button
          type="button"
          class="pressable min-h-11 rounded-md px-2 text-caption text-muted underline underline-offset-4 hover:bg-ink/7 hover:text-ink active:bg-ink/14 disabled:opacity-50"
          :disabled="busy"
          data-test="wishlist-unreserve"
          @click="emit('unreserve')"
        >
          {{ t("view.cancel") }}
        </button>
      </div>

      <span
        v-else
        class="flex items-center gap-1.5 text-caption text-muted"
        data-test="wishlist-status"
      >
        <Icon name="check" :size="18" />
        {{ t("view.takenByOther") }}
      </span>
    </div>

    <Sheet :open="photoOpen" :title="item.title" @close="photoOpen = false">
      <img
        :src="photoSrc ?? undefined"
        :alt="item.title"
        data-test="item-photo-large"
        class="max-h-[60dvh] w-full rounded-md object-contain"
      />
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import ItemTile from "./ItemTile.vue";
import Sheet from "../ui/Sheet.vue";
import { itemImageSrc } from "../../utils/image";
import { fmtEUR } from "../../utils/money";
import { isFavorite } from "../../utils/favorite";
import { QUIET_TONE } from "../../utils/tones";
import type { WishlistItem } from "../../types.ts";

const props = defineProps<{
  item: WishlistItem;
  viewerId?: string;
  tone: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  reserve: [];
  unreserve: [];
}>();

const { t } = useI18n();

const state = computed(() => {
  if (!props.item.reserved) return "open";
  return props.item.reserver_user_id === props.viewerId ? "mine" : "other";
});

const price = computed(() =>
  props.item.price_eur != null ? fmtEUR.format(props.item.price_eur) : "",
);

const tileTone = computed(() => (state.value === "other" ? QUIET_TONE : props.tone));
const photoSrc = computed(() => itemImageSrc(props.item.image_url));
const photoOpen = ref(false);
</script>
