<template>
  <div class="flex items-center justify-between gap-3 mb-4">
    <h1 class="text-xl font-semibold">{{ t("my.title") }}</h1>
    <WishlistExportButton :items="items" />
  </div>

  <Card class="mb-4">
    <template #header
      ><h2 class="font-semibold">{{ t("my.addTitle") }}</h2></template
    >
    <form @submit.prevent="add" class="grid gap-3 sm:grid-cols-2">
      <Input
        v-model="form.title"
        name="title"
        data-test="item-title"
        :label="t('my.form.title')"
        required
      />
      <Input
        v-model="form.url"
        name="url"
        data-test="item-url"
        :label="t('my.form.url')"
      />
      <Input
        v-model.number="form.price_eur"
        name="price_eur"
        data-test="item-price"
        type="number"
        step="5"
        min="0"
        :max="1000000"
        :label="t('my.form.price')"
      />

      <Input
        v-model.number="form.priority"
        name="priority"
        data-test="item-priority"
        type="number"
        :label="t('my.form.priority')"
      />
      <div class="sm:col-span-2">
        <label class="block text-sm mb-1" for="notes">{{
          t("my.form.notes")
        }}</label>
        <textarea
          v-model="form.notes"
          name="notes"
          data-test="item-notes"
          rows="3"
          class="w-full rounded-lg border-zinc-300 bg-white text-sm focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notes"
        ></textarea>
      </div>
      <div class="sm:col-span-2">
        <Button
          variant="primary"
          type="submit"
          data-test="wishlist-add-submit"
          :loading="submitting"
          >{{ t("my.addBtn") }}</Button
        >
      </div>
    </form>
  </Card>

  <div v-if="items.length === 0" class="text-zinc-600">
    {{ t("my.empty") }}
  </div>

  <ul class="grid gap-3">
    <li
      v-for="it in items"
      :key="it.id"
      data-test="wishlist-item"
      :data-title="it.original_title || it.title"
      :data-id="it.id"
    >
      <WishlistItemEditor
        v-if="editingId === it.id"
        :initial-item="it"
        :loading="editSubmitting"
        @save="(payload) => saveEdit(it.id, payload)"
        @cancel="cancelEdit"
      />
      <WishlistItemCard
        v-else
        :item="it"
        @edit="beginEdit(it)"
        @delete="removeItem(it.id)"
      />
    </li>
  </ul>

  <Card class="mt-6 overflow-hidden bg-gradient-to-br from-amber-50/80 to-white">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold mb-1">
            {{ t("my.publish.badge") }}
          </p>
          <h2 class="font-semibold">{{ t("my.publish.title") }}</h2>
        </div>
        <span
          v-if="isPublished"
          class="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          {{ t("my.publish.online") }}
        </span>
      </div>
    </template>
    <div class="grid gap-4 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
      <div class="space-y-2 text-sm text-zinc-600">
        <p>{{ t("my.publish.description") }}</p>
        <p class="text-amber-700" v-if="!hasItems">{{ t("my.publish.empty") }}</p>
        <p class="text-xs text-zinc-500">
          {{ t("my.publish.hint") }}
        </p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Input
          class="sm:w-64"
          :model-value="publishLink"
          :placeholder="t('my.publish.placeholder')"
          readonly
        />
        <div class="flex flex-wrap gap-2 justify-end">
          <Button
            v-if="!isPublished"
            variant="primary"
            :disabled="!hasItems"
            :loading="publishSubmitting"
            @click="publish"
          >
            🎁 {{ t("my.publish.action") }}
          </Button>
          <template v-else>
            <Button variant="ghost" @click="copyLink">{{ t("my.publish.copy") }}</Button>
            <Button variant="secondary" @click="openPreview">{{ t("my.publish.preview") }}</Button>
            <Button
              variant="danger"
              :loading="unpublishSubmitting"
              @click="unpublish"
            >
              {{ t("my.publish.unpublish") }}
            </Button>
          </template>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "../services/api";
import Card from "../components/ui/Card.vue";
import Button from "../components/ui/Button.vue";
import Input from "../components/ui/Input.vue";
import { useToasts } from "../components/ui/useToasts";
import { useI18n } from "vue-i18n";
import WishlistItemCard from "../components/wishlist/WishlistItemCard.vue";
import WishlistItemEditor from "../components/wishlist/WishlistItemEditor.vue";
import WishlistExportButton from "../components/wishlist/WishlistExportButton.vue";
import type { Wishlist, WishlistItem, WishlistItemForm } from "../types.ts";

const { push } = useToasts();
const { t } = useI18n();

const items = ref<WishlistItem[]>([]);
const wishlist = ref<Wishlist | null>(null);
const submitting = ref(false);
const editSubmitting = ref(false);
const publishSubmitting = ref(false);
const unpublishSubmitting = ref(false);
const form = reactive<WishlistItemForm>({
  title: "",
  url: "",
  price_eur: undefined as number | undefined,
  notes: "",
  priority: 3,
});
const editingId = ref<string | null>(null);
const hasItems = computed(() => items.value.length > 0);
const isPublished = computed(
  () => Boolean(wishlist.value?.public_slug && wishlist.value?.published_at),
);
const publishLink = computed(() =>
  wishlist.value?.public_slug ? `${window.location.origin}/share/${wishlist.value.public_slug}` : "",
);

function normalizeItem(item: WishlistItem): WishlistItem {
  return { ...item, original_title: item.original_title ?? item.title };
}

async function load() {
  const data = await api.getMyWishlist();
  items.value = (data.items ?? []).map(normalizeItem);
  wishlist.value = data.wishlist ?? null;
}

async function add() {
  submitting.value = true;
  try {
    const created = await api.addMyItem({
      title: form.title || "",
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });

    items.value.unshift(normalizeItem(created));
    form.title = "";
    form.url = "";
    form.price_eur = undefined;
    form.notes = "";
    form.priority = 3;
    push(t("toast.added"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}

async function publish() {
  if (!hasItems.value) {
    push(t("my.publish.empty"), "error");
    return;
  }

  publishSubmitting.value = true;
  try {
    const { wishlist: updated } = await api.publishMyWishlist();
    wishlist.value = updated;
    push(t("my.publish.published"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    publishSubmitting.value = false;
  }
}

async function unpublish() {
  if (!isPublished.value) return;
  if (!window.confirm(t("my.publish.unpublishConfirm"))) return;

  unpublishSubmitting.value = true;
  try {
    const { wishlist: updated } = await api.unpublishMyWishlist();
    wishlist.value = updated;
    push(t("my.publish.unpublished"), "info");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    unpublishSubmitting.value = false;
  }
}

async function copyLink() {
  if (!publishLink.value) return;
  try {
    await navigator.clipboard.writeText(publishLink.value);
    push(t("my.publish.copied"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  }
}

function openPreview() {
  if (publishLink.value) window.open(publishLink.value, "_blank");
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter((i) => i.id !== id);
  push(t("toast.removed"), "info");
}

function beginEdit(item: WishlistItem) {
  editingId.value = item.id;
}

function cancelEdit() {
  editingId.value = null;
  editSubmitting.value = false;
}

async function saveEdit(id: string, form: WishlistItemForm) {
  if (!form.title?.trim()) {
    push(t("my.validation.titleRequired"), "error");
    return;
  }

  editingId.value = id;
  editSubmitting.value = true;
  try {
    const updated = await api.updateMyItem(id, {
      title: form.title.trim(),
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });
    items.value = items.value.map((it) =>
      it.id === id
        ? normalizeItem({ ...it, ...updated, original_title: it.original_title })
        : it,
    );
    push(t("toast.updated"), "success");
    cancelEdit();
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    editSubmitting.value = false;
  }
}

onMounted(load);
</script>
