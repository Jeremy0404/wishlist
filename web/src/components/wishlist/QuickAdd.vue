<script setup lang="ts">
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../../services/api";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import ImageField from "./ImageField.vue";
import Input from "../ui/Input.vue";
import Select from "../ui/Select.vue";
import Spinner from "../ui/Spinner.vue";
import { useToasts } from "../ui/useToasts";
import { toHttpUrl } from "../../utils/link";
import { usePriorityOptions } from "../../composables/usePriorityOptions";
import type { WishlistItem } from "../../types.ts";

const emit = defineEmits<{ added: [WishlistItem] }>();

const { t } = useI18n();
const { push } = useToasts();

type Details = {
  url: string;
  price_eur: number | string | undefined;
  notes: string;
  priority: number | undefined;
  image_url: string;
};

const priorityOptions = usePriorityOptions();

const entry = ref("");
const showDetails = ref(false);
const submitting = ref(false);
const resolving = ref(false);
const resolvedUrl = ref<string | null>(null);
const photo = ref<File | null>(null);
const details = reactive<Details>({
  url: "",
  price_eur: undefined,
  notes: "",
  priority: undefined,
  image_url: "",
});

function isEmpty(value: number | string | undefined) {
  return value === undefined || value === null || value === "";
}

function toNumber(value: number | string | undefined) {
  return isEmpty(value) ? undefined : Number(value);
}

/** Fills what the page says about itself into the fields the user left empty.
 *  A value they typed is never overwritten, and a failed fetch is silent. */
async function resolve(url: string) {
  resolving.value = true;
  try {
    const preview = await api.previewItemUrl(url);

    if (preview.title && entry.value.trim() === url)
      entry.value = preview.title;
    if (isEmpty(details.price_eur) && preview.price_eur != null) {
      details.price_eur = preview.price_eur;
    }
    if (!details.image_url && !photo.value && preview.image_url)
      details.image_url = preview.image_url;
    if (preview.title || preview.price_eur != null || preview.image_url)
      showDetails.value = true;
  } catch {
    /* the fetch is a convenience, never a gate */
  } finally {
    if (!details.url) details.url = url;
    resolvedUrl.value = url;
    resolving.value = false;
  }
}

function onPaste(event: ClipboardEvent) {
  const url = toHttpUrl(event.clipboardData?.getData("text") ?? "");
  if (url) void resolve(url);
}

function reset() {
  entry.value = "";
  details.url = "";
  details.price_eur = undefined;
  details.notes = "";
  details.priority = undefined;
  details.image_url = "";
  photo.value = null;
  showDetails.value = false;
  resolvedUrl.value = null;
}

async function submit() {
  const entered = entry.value.trim();
  if (!entered || submitting.value) return;

  const url = toHttpUrl(entered);
  if (url && url !== resolvedUrl.value) await resolve(url);

  submitting.value = true;
  try {
    const created = await api.addMyItem(
      {
        title: entry.value.trim(),
        url: details.url || url || undefined,
        price_eur: toNumber(details.price_eur),
        notes: details.notes || undefined,
        priority: toNumber(details.priority),
        image_url: details.image_url || undefined,
      },
      photo.value,
    );

    emit("added", created);
    reset();
    push(t("toast.added"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Card class="mb-6" data-test="quick-add">
    <form class="grid gap-2" @submit.prevent="submit">
      <div class="flex flex-wrap items-end gap-2">
        <Input
          v-model="entry"
          class="min-w-[220px] flex-1"
          name="entry"
          data-test="quick-add-entry"
          :label="t('my.quick.label')"
          :placeholder="t('my.quick.placeholder')"
          required
          @paste="onPaste"
        />
        <span
          v-if="resolving"
          class="flex items-center gap-2 text-meta text-muted"
          data-test="quick-add-resolving"
        >
          <Spinner />
          {{ t("my.quick.resolving") }}
        </span>
        <Button
          variant="primary"
          type="submit"
          data-test="wishlist-add-submit"
          :loading="submitting"
        >
          {{ t("my.addBtn") }}
        </Button>
      </div>

      <Button
        variant="ghost"
        class="justify-self-start"
        data-test="quick-add-toggle"
        @click="showDetails = !showDetails"
      >
        {{
          showDetails ? t("my.quick.hideDetails") : t("my.quick.showDetails")
        }}
      </Button>

      <div
        v-if="showDetails"
        class="grid gap-3 sm:grid-cols-2"
        data-test="quick-add-details"
      >
        <Input
          v-model="details.url"
          name="url"
          data-test="item-url"
          :label="t('my.form.url')"
        />
        <Input
          v-model="details.price_eur"
          name="price_eur"
          data-test="item-price"
          type="number"
          step="0.01"
          min="0"
          :max="1000000"
          :label="t('my.form.price')"
        />
        <Select
          v-model="details.priority"
          name="priority"
          data-test="item-priority"
          :options="priorityOptions"
          :placeholder="t('priority.none')"
          :label="t('my.form.priority')"
        />
        <div class="sm:col-span-2">
          <ImageField
            v-model:image-url="details.image_url"
            v-model:file="photo"
          />
        </div>
        <div class="sm:col-span-2">
          <label
            class="mb-1 block text-label text-ink/70"
            for="quick-add-notes"
          >
            {{ t("my.form.notes") }}
          </label>
          <textarea
            id="quick-add-notes"
            v-model="details.notes"
            name="notes"
            data-test="item-notes"
            rows="3"
            class="w-full rounded-card border border-divider bg-surface px-4 py-2 text-control text-ink caret-accent transition-colors hover:border-ink/45 focus:border-accent focus:ring-0"
          ></textarea>
        </div>
      </div>
    </form>
  </Card>
</template>
