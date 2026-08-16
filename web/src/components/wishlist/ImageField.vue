<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_BYTES,
  IMAGE_TYPES,
  itemImageSrc,
} from "../../utils/image";

const props = defineProps<{ imageUrl: string; file: File | null }>();

const emit = defineEmits<{
  "update:imageUrl": [string];
  "update:file": [File | null];
}>();

const { t } = useI18n();

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const error = ref("");
const objectUrl = ref<string | null>(null);

const preview = computed(() => objectUrl.value ?? itemImageSrc(props.imageUrl));

watch(
  () => props.file,
  (file) => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = file ? URL.createObjectURL(file) : null;
  },
);

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
});

function accept(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) {
    error.value = t("my.form.imageType");
    return;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    error.value = t("my.form.imageTooLarge");
    return;
  }
  error.value = "";
  emit("update:file", file);
}

function onChange(event: Event) {
  const picked = (event.target as HTMLInputElement).files?.[0];
  if (picked) accept(picked);
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  const dropped = event.dataTransfer?.files?.[0];
  if (dropped) accept(dropped);
}

function onLink(value: string | number) {
  emit("update:file", null);
  emit("update:imageUrl", String(value));
}

function clear() {
  error.value = "";
  if (input.value) input.value.value = "";
  emit("update:file", null);
  emit("update:imageUrl", "");
}
</script>

<template>
  <div>
    <p class="mb-1 text-label text-ink/70">{{ t("my.form.image") }}</p>
    <div
      class="flex h-24 w-full items-center justify-center gap-3 rounded-[10px] border border-dashed px-4 transition-colors"
      :class="dragging ? 'border-accent bg-accent/10' : 'border-divider'"
      data-test="item-image-drop"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img
        v-if="preview"
        :src="preview"
        alt=""
        data-test="item-image-preview"
        class="h-16 w-16 flex-none rounded-sm object-cover"
      />
      <span v-else class="text-meta text-muted">
        {{ t("my.form.imageHint") }}
      </span>
      <Button variant="secondary" @click="input?.click()">
        {{ t("my.form.imagePick") }}
      </Button>
      <Button
        v-if="preview"
        variant="ghost"
        data-test="item-image-remove"
        @click="clear"
      >
        {{ t("my.form.imageRemove") }}
      </Button>
    </div>
    <input
      ref="input"
      type="file"
      class="hidden"
      data-test="item-image-file"
      :accept="IMAGE_ACCEPT"
      @change="onChange"
    />
    <p v-if="error" class="mt-1 text-meta text-danger" data-test="field-error">
      {{ error }}
    </p>
    <div class="mt-2">
      <Input
        name="image_url"
        data-test="item-image-url"
        :model-value="imageUrl"
        :label="t('my.form.imageUrl')"
        @update:model-value="onLink"
      />
    </div>
  </div>
</template>
