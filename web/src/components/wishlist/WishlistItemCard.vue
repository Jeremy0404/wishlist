<template>
  <Card>
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="font-medium">
          {{ item.title }}
          <span v-if="item.priority" class="text-xs text-zinc-500">P{{ item.priority }}</span>
        </div>
        <div v-if="item.url" class="text-sm text-brand-700">
          <a :href="item.url" target="_blank">{{ item.url }}</a>
        </div>
        <div v-if="item.price_eur != null" class="text-sm text-zinc-600">
          {{ fmtEUR.format(item.price_eur) }}
        </div>
        <div v-if="item.notes" class="text-sm text-zinc-700 whitespace-pre-wrap mt-1">
          {{ item.notes }}
        </div>
      </div>
      <div v-if="showActionsComputed" class="flex flex-col gap-2">
        <slot name="actions" :on-edit="emitEdit" :on-delete="emitDelete">
          <Button variant="ghost" data-test="wishlist-edit" @click="emitEdit">
            {{ t("my.edit") }}
          </Button>
          <Button variant="ghost" data-test="wishlist-delete" @click="emitDelete">
            {{ t("my.delete") }}
          </Button>
        </slot>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import { fmtEUR } from "../../utils/money";
import type { WishlistItem } from "../../types.ts";

const props = withDefaults(
  defineProps<{
    item: WishlistItem;
    showActions?: boolean;
  }>(),
  {
    showActions: true,
  },
);

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const { t } = useI18n();

const showActionsComputed = computed(() => props.showActions);

const emitEdit = () => emit("edit");
const emitDelete = () => emit("delete");
</script>
