<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import InlineConfirm from "../ui/InlineConfirm.vue";
import Input from "../ui/Input.vue";
import Sheet from "../ui/Sheet.vue";
import Spinner from "../ui/Spinner.vue";
import ImageField from "./ImageField.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";
import { toHttpUrl } from "../../utils/link";
import { isFavorite, priorityFor } from "../../utils/favorite";
import type { OwnItem, WishlistItemForm } from "../../types.ts";
import { errorMessage } from "../../utils/errors";

/** Without an owner the sheet edits the caller's own list; with one, the admin
 *  edits that user's list through the admin routes. */
const props = defineProps<{
  open: boolean;
  item: OwnItem | null;
  ownerId?: string;
}>();
const emit = defineEmits<{
  close: [];
  added: [OwnItem];
  updated: [OwnItem];
  removed: [string];
}>();

const { t } = useI18n();
const { push } = useToasts();

type Form = {
  title: string;
  url: string;
  price_eur: number | string | undefined;
  notes: string;
  favorite: boolean;
  image_url: string;
};

const form = reactive<Form>({
  title: "",
  url: "",
  price_eur: undefined,
  notes: "",
  favorite: false,
  image_url: "",
});
const photo = ref<File | null>(null);
const showDetails = ref(false);
const submitting = ref(false);
const resolving = ref(false);
const resolvedUrl = ref<string | null>(null);
const previewMissed = ref(false);
const pristine = ref("");
const titleError = ref("");
const confirmingRemoval = ref(false);
const removing = ref(false);
let sheetSession = 0;
let pendingPreview: { url: string; done: Promise<void> } | null = null;

const OWNER_COPY = {
  editTitle: "item.editTitle",
  submitAdd: "item.submitAdd",
  remove: "item.remove",
  removeConfirm: "item.removeConfirm",
  added: "toast.added",
  removed: "toast.removed",
};

const ADMIN_COPY: typeof OWNER_COPY = {
  editTitle: "admin.item.editTitle",
  submitAdd: "admin.item.submitAdd",
  remove: "admin.item.remove",
  removeConfirm: "admin.item.removeConfirm",
  added: "admin.item.added",
  removed: "admin.item.removed",
};

const copy = computed(() => (props.ownerId ? ADMIN_COPY : OWNER_COPY));

const itemApi = computed(() => {
  const ownerId = props.ownerId;
  if (!ownerId)
    return {
      add: api.addMyItem,
      update: api.updateMyItem,
      remove: api.deleteMyItem,
    };
  return {
    add: (body: WishlistItemForm, image?: File | null) =>
      api.adminAddItem(ownerId, body, image),
    update: (id: string, body: WishlistItemForm, image?: File | null) =>
      api.adminUpdateItem(ownerId, id, body, image),
    remove: (id: string) => api.adminDeleteItem(ownerId, id),
  };
});

const editing = computed(() => props.item !== null);
const sheetTitle = computed(() =>
  editing.value ? t(copy.value.editTitle) : t("item.addTitle"),
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const item = props.item;
    sheetSession++;
    pendingPreview = null;
    resolving.value = false;
    previewMissed.value = false;
    form.title = item?.title ?? "";
    form.url = item?.url ?? "";
    form.price_eur = item?.price_eur ?? undefined;
    form.notes = item?.notes ?? "";
    form.favorite = isFavorite(item?.priority);
    form.image_url = item?.image_url ?? "";
    photo.value = null;
    showDetails.value = editing.value;
    resolvedUrl.value = null;
    titleError.value = "";
    confirmingRemoval.value = false;
    pristine.value = JSON.stringify(form);
  },
);

const dirty = computed(
  () => photo.value !== null || JSON.stringify(form) !== pristine.value,
);

function isEmpty(value: number | string | undefined) {
  return value === undefined || value === null || value === "";
}

function toPrice(value: number | string | undefined): number | "" {
  return isEmpty(value) ? "" : Number(value);
}

/** A preview answers for one link in one opening of the sheet: a newer link or
 *  a reopened sheet makes it stale. */
function isStale(url: string, session: number) {
  return session !== sheetSession || pendingPreview?.url !== url;
}

function resolve(url: string) {
  if (pendingPreview?.url === url) return pendingPreview.done;
  pendingPreview = { url, done: fillFromPreview(url, sheetSession) };
  return pendingPreview.done;
}

/** Fills what the page says about itself into the fields left empty.
 *  A value the user typed is never overwritten; a page that tells nothing only
 *  earns a quiet hint. */
async function fillFromPreview(url: string, session: number) {
  resolving.value = true;
  previewMissed.value = false;
  let found = false;
  try {
    const preview = await api.previewItemUrl(url);
    if (isStale(url, session)) return;
    if (preview.title && form.title.trim() === url) form.title = preview.title;
    if (isEmpty(form.price_eur) && preview.price_eur != null)
      form.price_eur = preview.price_eur;
    if (!form.image_url && !photo.value && preview.image_url)
      form.image_url = preview.image_url;
    found = !!(preview.title || preview.price_eur != null || preview.image_url);
    if (found) showDetails.value = true;
  } catch {
    /* the fetch is a convenience, never a gate */
  } finally {
    if (!isStale(url, session)) {
      if (!form.url) form.url = url;
      resolvedUrl.value = url;
      resolving.value = false;
      previewMissed.value = !found;
      pendingPreview = null;
    }
  }
}

function onPaste(event: ClipboardEvent) {
  if (editing.value) return;
  const url = toHttpUrl(event.clipboardData?.getData("text") ?? "");
  if (url) void resolve(url);
}

async function submit() {
  if (submitting.value) return;
  const entered = form.title.trim();
  if (!entered) {
    titleError.value = t("item.titleRequired");
    return;
  }

  submitting.value = true;
  try {
    const typedUrl = editing.value ? null : toHttpUrl(entered);
    if (typedUrl && typedUrl !== resolvedUrl.value) await resolve(typedUrl);

    const body = {
      title: form.title.trim(),
      url: form.url || typedUrl || "",
      price_eur: toPrice(form.price_eur),
      notes: form.notes,
      priority: priorityFor(form.favorite),
      image_url: form.image_url,
    };

    if (props.item) {
      const updated = await itemApi.value.update(
        props.item.id,
        body,
        photo.value,
      );
      emit("updated", updated);
      push(t("toast.updated"), "success");
    } else {
      const created = await itemApi.value.add(
        { ...body, image_url: body.image_url || undefined },
        photo.value,
      );
      emit("added", created);
      push(t(copy.value.added), "success");
    }
    emit("close");
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    submitting.value = false;
  }
}

async function remove() {
  if (!props.item) return;
  removing.value = true;
  try {
    await itemApi.value.remove(props.item.id);
    emit("removed", props.item.id);
    push(t(copy.value.removed), "success");
    emit("close");
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    removing.value = false;
  }
}
</script>

<template>
  <Sheet
    :open="open"
    :title="sheetTitle"
    :hold-on-backdrop="dirty"
    @close="emit('close')"
  >
    <form class="grid gap-4" novalidate @submit.prevent="submit">
      <div v-if="!editing" class="grid gap-2">
        <Input
          v-model="form.title"
          name="entry"
          data-test="quick-add-entry"
          :label="t('item.entryLabel')"
          :placeholder="t('item.entryPlaceholder')"
          :error="titleError"
          :help="t('item.entryHint')"
          @paste="onPaste"
          @update:model-value="titleError = ''"
        />
        <span
          v-if="resolving"
          class="flex items-center gap-2 text-caption text-muted"
          data-test="quick-add-resolving"
        >
          <Spinner />
          {{ t("item.resolving") }}
        </span>
        <span
          v-else-if="previewMissed"
          class="text-caption text-muted"
          data-test="quick-add-manual"
        >
          {{ t("item.previewMissed") }}
        </span>
      </div>
      <Input
        v-else
        v-model="form.title"
        name="title"
        :label="t('item.titleLabel')"
        :error="titleError"
        required
        @update:model-value="titleError = ''"
      />

      <button
        type="button"
        class="pressable flex min-h-12 items-center gap-2 justify-self-start rounded-md border px-4 font-semibold"
        :class="
          form.favorite
            ? 'border-accent bg-accent-100 text-accent-700 hover:bg-accent-200 active:bg-accent-200'
            : 'border-neutral-400 text-ink hover:bg-neutral-200 active:bg-neutral-300'
        "
        data-test="item-favorite"
        :aria-pressed="form.favorite"
        @click="form.favorite = !form.favorite"
      >
        <Icon
          name="heart"
          :size="20"
          :class="form.favorite && 'fill-current'"
        />
        {{ t("item.favorite") }}
      </button>

      <button
        v-if="!showDetails"
        type="button"
        class="pressable -ml-3 flex min-h-11 items-center gap-1.5 justify-self-start rounded-md px-3 text-left font-semibold text-accent-700 hover:bg-accent/10 active:bg-accent/18"
        data-test="quick-add-toggle"
        @click="showDetails = true"
      >
        <Icon name="plus" :size="18" />
        {{ t("item.more") }}
      </button>

      <div v-else class="grid gap-4" data-test="quick-add-details">
        <Input
          v-model="form.price_eur"
          name="price_eur"
          data-test="item-price"
          type="number"
          inputmode="decimal"
          step="0.01"
          min="0"
          :max="1000000"
          :label="t('item.price')"
        />
        <div>
          <label class="mb-1 block text-label text-ink/70" for="item-notes">
            {{ t("item.notes") }}
          </label>
          <textarea
            id="item-notes"
            v-model="form.notes"
            name="notes"
            data-test="item-notes"
            rows="2"
            :placeholder="t('item.notesPlaceholder')"
            class="w-full rounded-md border border-neutral-400 bg-surface px-4 py-3 text-body text-ink caret-accent transition-colors placeholder:text-neutral-600 focus:border-accent focus:ring-0"
          ></textarea>
        </div>
        <Input
          v-model="form.url"
          name="url"
          data-test="item-url"
          type="url"
          :label="t('item.url')"
        />
        <ImageField v-model:image-url="form.image_url" v-model:file="photo" />
      </div>

      <div class="sticky bottom-0 -mx-5 bg-surface px-5 py-2">
        <Button
          v-if="editing"
          variant="primary"
          type="submit"
          block
          class="min-h-14 text-body"
          data-test="wishlist-edit-save"
          :loading="submitting"
        >
          {{ t("item.save") }}
        </Button>
        <Button
          v-else
          variant="primary"
          type="submit"
          block
          class="min-h-14 text-body"
          data-test="wishlist-add-submit"
          :loading="submitting"
        >
          {{ t(copy.submitAdd) }}
        </Button>
      </div>
    </form>

    <template v-if="item">
      <a
        v-if="item.url"
        :href="item.url"
        target="_blank"
        rel="noreferrer"
        class="flex min-h-11 items-center justify-center gap-2 font-semibold"
      >
        <Icon name="externalLink" :size="18" />
        {{ t("item.open") }}
      </a>
      <InlineConfirm
        v-if="confirmingRemoval"
        :question="t(copy.removeConfirm, { title: item.title })"
        :confirm-label="t('item.removeYes')"
        :cancel-label="t('item.removeNo')"
        :loading="removing"
        @confirm="remove"
        @cancel="confirmingRemoval = false"
      />
      <Button
        v-else
        variant="ghost-danger"
        block
        class="min-h-12 text-danger"
        data-test="wishlist-delete"
        @click="confirmingRemoval = true"
      >
        {{ t(copy.remove) }}
      </Button>
    </template>
  </Sheet>
</template>
