<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import Icon from "../ui/Icon.vue";
import InlineConfirm from "../ui/InlineConfirm.vue";
import Tag from "../ui/Tag.vue";
import { fmtEUR } from "../../utils/money";
import { PRIORITY_TAG_VARIANTS, priorityLevel } from "../../utils/priority";
import type { WishlistItem } from "../../types.ts";

const props = defineProps<{ item: WishlistItem }>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const { t } = useI18n();

const level = computed(() => priorityLevel(props.item.priority));
const confirming = ref(false);

function confirmDelete() {
  confirming.value = false;
  emit("delete");
}
</script>

<template>
  <Card>
    <div class="flex items-start gap-3">
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

        <div class="mt-1 flex flex-wrap items-center gap-2">
          <span v-if="item.price_eur != null" class="text-caption text-muted">
            {{ fmtEUR.format(item.price_eur) }}
          </span>
          <Tag
            v-if="level"
            :variant="PRIORITY_TAG_VARIANTS[level]"
            data-test="wishlist-priority"
          >
            {{ t(`priority.${level}`) }}
          </Tag>
        </div>

        <p v-if="item.notes" class="mb-0 mt-1 text-caption opacity-80">
          {{ item.notes }}
        </p>
      </div>

      <div class="flex flex-none items-center gap-1">
        <template v-if="!confirming">
          <Button
            variant="ghost"
            icon
            data-test="wishlist-edit"
            :aria-label="t('my.edit')"
            :title="t('my.edit')"
            @click="emit('edit')"
          >
            <Icon name="pencil" :size="16" />
          </Button>
          <Button
            variant="ghost-danger"
            icon
            data-test="wishlist-delete"
            :aria-label="t('my.delete')"
            :title="t('my.delete')"
            @click="confirming = true"
          >
            <Icon name="trash" :size="16" />
          </Button>
        </template>

        <InlineConfirm
          v-else
          :question="t('my.confirmDelete')"
          :confirm-label="t('my.delete')"
          @confirm="confirmDelete"
          @cancel="confirming = false"
        >
          <template #icon><Icon name="trash" :size="14" /></template>
        </InlineConfirm>
      </div>
    </div>
  </Card>
</template>
