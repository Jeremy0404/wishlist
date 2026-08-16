<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import Icon from "../ui/Icon.vue";
import InlineConfirm from "../ui/InlineConfirm.vue";
import Input from "../ui/Input.vue";
import Segmented from "../ui/Segmented.vue";
import { useToasts } from "../ui/useToasts";
import type { Wishlist } from "../../types.ts";

const props = defineProps<{ wishlist: Wishlist | null }>();
const emit = defineEmits<{ change: [Wishlist] }>();

const { t } = useI18n();
const { push } = useToasts();

const COPIED_FEEDBACK_MS = 2000;

const submitting = ref(false);
const copied = ref(false);
const confirmingPrivate = ref(false);

const isShared = computed(() => Boolean(props.wishlist?.published_at));
const link = computed(() =>
  props.wishlist?.public_slug
    ? `${window.location.origin}/share/${props.wishlist.public_slug}`
    : "",
);
const visibility = computed(() => (isShared.value ? "shared" : "private"));
const options = computed(() => [
  { value: "shared", label: t("my.share.shared") },
  { value: "private", label: t("my.share.private") },
]);

function setVisibility(next: string) {
  const shared = next === "shared";
  if (shared === isShared.value) return;
  if (!shared) {
    confirmingPrivate.value = true;
    return;
  }
  return applyVisibility(true);
}

async function applyVisibility(shared: boolean) {
  confirmingPrivate.value = false;
  submitting.value = true;
  try {
    const { wishlist } = shared
      ? await api.publishMyWishlist()
      : await api.unpublishMyWishlist();
    emit("change", wishlist);
    push(t(shared ? "my.share.nowShared" : "my.share.nowPrivate"), "info");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS);
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  }
}
</script>

<template>
  <Card class="mb-6" data-test="share-card">
    <div class="flex flex-wrap items-center gap-2">
      <span class="whitespace-nowrap text-label text-muted">
        {{ t("my.share.label") }}
      </span>
      <Input
        class="min-w-[220px] flex-1"
        :class="!isShared && 'opacity-45'"
        data-test="share-link"
        :model-value="link"
        :placeholder="t('my.share.placeholder')"
        readonly
      />
      <Button
        variant="ghost"
        class="whitespace-nowrap"
        data-test="share-copy"
        :disabled="!isShared || !link"
        @click="copyLink"
      >
        <Icon :name="copied ? 'check' : 'copy'" :size="14" />
        {{ copied ? t("my.share.copied") : t("my.share.copy") }}
      </Button>
      <Segmented
        name="share-visibility"
        :model-value="visibility"
        :options="options"
        :disabled="submitting"
        @update:model-value="setVisibility"
      />
    </div>
    <InlineConfirm
      v-if="confirmingPrivate"
      :question="t('my.share.privateConfirm')"
      :confirm-label="t('my.share.makePrivate')"
      :loading="submitting"
      @confirm="applyVisibility(false)"
      @cancel="confirmingPrivate = false"
    />
    <p
      v-if="!isShared"
      class="mb-0 text-meta text-muted"
      data-test="share-private-hint"
    >
      {{ t("my.share.privateHint") }}
    </p>
  </Card>
</template>
