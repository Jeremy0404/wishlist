<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Icon from "../ui/Icon.vue";
import ItemTile from "./ItemTile.vue";
import { fmtEUR } from "../../utils/money";
import { isFavorite } from "../../utils/favorite";
import type { WishlistItem } from "../../types.ts";

const props = defineProps<{ item: WishlistItem; tone: string }>();
const emit = defineEmits<{ open: [] }>();

const { t } = useI18n();

const meta = computed(() =>
  [
    props.item.price_eur != null ? fmtEUR.format(props.item.price_eur) : "",
    props.item.notes ?? "",
  ]
    .filter(Boolean)
    .join(" · "),
);
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3.5 px-1 py-3.5 text-left transition-colors hover:bg-neutral-200"
    data-test="wishlist-edit"
    @click="emit('open')"
  >
    <ItemTile :image-url="item.image_url" :tone="tone" />
    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="flex items-center gap-1.5 font-semibold">
        <span class="min-w-0">{{ item.title }}</span>
        <template v-if="isFavorite(item.priority)">
          <Icon
            name="heart"
            :size="16"
            class="fill-current text-accent"
            data-test="wishlist-favorite"
          />
          <span class="sr-only">{{ t("item.favorite") }}</span>
        </template>
      </span>
      <span v-if="meta" class="text-caption text-muted">{{ meta }}</span>
    </span>
    <Icon name="chevronRight" :size="20" class="text-neutral-500" />
  </button>
</template>
