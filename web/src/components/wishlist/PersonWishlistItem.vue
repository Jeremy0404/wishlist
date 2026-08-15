<template>
  <Card data-test="wishlist-item" :data-id="item.id">
    <div class="flex flex-wrap items-start gap-3">
      <div class="min-w-[200px] flex-1">
        <div class="flex items-center gap-2 font-semibold">
          {{ item.title }}
          <a
            v-if="item.url"
            :href="item.url"
            target="_blank"
            rel="noreferrer"
            :aria-label="t('view.link')"
          >
            <Icon name="externalLink" :size="14" />
          </a>
        </div>
        <p v-if="item.notes" class="mb-0 mt-0.5 text-caption opacity-80">
          {{ item.notes }}
        </p>
        <span v-if="item.price_eur != null" class="text-caption text-muted">
          {{ fmtEUR.format(item.price_eur) }}
        </span>
      </div>

      <div class="flex flex-none flex-col items-end gap-2">
        <Button
          v-if="state === 'open'"
          variant="primary"
          data-test="wishlist-reserve"
          @click="emit('reserve')"
        >
          <Icon name="gift" :size="14" />
          {{ t("view.reserve") }}
        </Button>

        <template v-else-if="state === 'mine'">
          <Tag variant="accent-2" data-test="wishlist-status">
            {{ statusLabel }}
          </Tag>
          <div class="flex gap-1">
            <Button
              v-if="item.reservation_status !== 'purchased'"
              variant="secondary"
              data-test="wishlist-purchase"
              @click="emit('purchase')"
            >
              <Icon name="check" :size="14" />
              {{ t("view.purchase") }}
            </Button>
            <Button
              variant="ghost"
              data-test="wishlist-unreserve"
              @click="emit('unreserve')"
            >
              <Icon name="undo" :size="14" />
              {{ t("view.unreserve") }}
            </Button>
          </div>
        </template>

        <Tag v-else variant="neutral" data-test="wishlist-status">
          {{ statusLabel }}
        </Tag>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import Icon from "../ui/Icon.vue";
import Tag from "../ui/Tag.vue";
import { fmtEUR } from "../../utils/money";
import type { WishlistItem } from "../../types.ts";

const props = defineProps<{ item: WishlistItem; viewerId?: string }>();

const emit = defineEmits<{
  reserve: [];
  purchase: [];
  unreserve: [];
}>();

const { t } = useI18n();

const state = computed(() => {
  if (!props.item.reserved) return "open";
  return props.item.reserver_user_id === props.viewerId ? "mine" : "other";
});

const statusLabel = computed(() => {
  if (state.value === "other")
    return t("view.reservedByOther", { name: props.item.reserver_name });
  return props.item.reservation_status === "purchased"
    ? t("view.purchasedByYou")
    : t("view.reservedByYou");
});
</script>
