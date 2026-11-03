<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import InlineConfirm from "../ui/InlineConfirm.vue";
import Sheet from "../ui/Sheet.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";
import type { AdminProfile, MoveImpact } from "../../types.ts";
import { errorMessage } from "../../utils/errors";

const NO_FAMILY = "";

const props = defineProps<{
  open: boolean;
  user: AdminProfile;
  familyId: string | null;
}>();
const emit = defineEmits<{ close: []; moved: [] }>();

const { t } = useI18n();
const { push } = useToasts();

const families = ref<{ id: string; name: string }[]>([]);
const destination = ref(NO_FAMILY);
const impact = ref<MoveImpact | null>(null);
const checking = ref(false);
const moving = ref(false);

const options = computed(() => {
  const others = families.value
    .filter((family) => family.id !== props.familyId)
    .map((family) => ({ value: family.id, label: family.name }));
  return props.familyId
    ? [...others, { value: NO_FAMILY, label: t("admin.familyless") }]
    : others;
});

const destinationName = computed(
  () => options.value.find((o) => o.value === destination.value)?.label ?? "",
);

const targetFamilyId = computed(() => destination.value || null);

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    impact.value = null;
    try {
      families.value = (await api.adminOverview()).families;
      destination.value = options.value[0]?.value ?? NO_FAMILY;
    } catch (e) {
      push(errorMessage(e, t("toast.error")), "error");
    }
  },
);

watch(destination, () => {
  impact.value = null;
});

async function check() {
  checking.value = true;
  try {
    impact.value = await api.adminMoveImpact(props.user.id, targetFamilyId.value);
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    checking.value = false;
  }
}

async function move() {
  moving.value = true;
  try {
    await api.adminMoveUser(props.user.id, targetFamilyId.value);
    push(t("admin.move.moved", { name: props.user.name }), "success");
    emit("moved");
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    moving.value = false;
  }
}
</script>

<template>
  <Sheet :open="open" :title="t('admin.move.open')" @close="emit('close')">
    <p v-if="!options.length" class="text-muted" data-test="admin-move-none">
      {{ t("admin.move.none") }}
    </p>

    <div v-else class="grid gap-4">
      <div>
        <label class="mb-1 block text-label text-ink/70" for="admin-move-family">
          {{ t("admin.move.familyLabel") }}
        </label>
        <select
          id="admin-move-family"
          v-model="destination"
          name="familyId"
          class="min-h-12 w-full rounded-md border border-neutral-400 bg-surface px-4 py-2 text-body text-ink"
          data-test="admin-move-family"
        >
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <template v-if="impact">
        <ul class="m-0 pl-5 text-caption text-muted" data-test="admin-move-impact">
          <li>{{ t("admin.move.impactWishes", impact.wishes) }}</li>
          <li v-if="impact.merges">
            {{ t("admin.move.impactMerge", { name: user.name }) }}
          </li>
          <li>{{ t("admin.move.impactMade", impact.reservations_made) }}</li>
          <li>{{ t("admin.impactReceived", impact.reservations_received) }}</li>
        </ul>
        <InlineConfirm
          :question="t('admin.move.confirm', { name: user.name, family: destinationName })"
          :confirm-label="t('admin.move.yes')"
          :loading="moving"
          @confirm="move"
          @cancel="impact = null"
        />
      </template>

      <Button
        v-else
        variant="primary"
        block
        :loading="checking"
        data-test="admin-move-next"
        @click="check"
      >
        {{ t("admin.move.next") }}
      </Button>
    </div>
  </Sheet>
</template>
