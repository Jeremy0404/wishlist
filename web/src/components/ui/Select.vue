<script setup lang="ts" generic="T extends string | number">
import { computed } from "vue";

let uid = 0;
const props = defineProps<{
  modelValue?: T;
  options: { value: T; label: string }[];
  placeholder?: string;
  label?: string;
  id?: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [T | undefined];
}>();

defineOptions({ inheritAttrs: false });

const selectId = computed(() => props.id ?? `sel-${++uid}`);

function onChange(e: Event) {
  const el = e.target as HTMLSelectElement;
  emit(
    "update:modelValue",
    props.options.find((opt) => String(opt.value) === el.value)?.value,
  );
}
</script>

<template>
  <div>
    <label
      v-if="label"
      class="mb-1 block text-label text-ink/70"
      :for="selectId"
    >
      {{ label }}
    </label>
    <select
      :id="selectId"
      v-bind="$attrs"
      :value="modelValue == null ? '' : String(modelValue)"
      class="min-h-9 w-full rounded-pill border border-divider bg-surface px-4 py-1 text-control text-ink transition-colors hover:border-ink/45 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:outline-offset-0"
      @change="onChange"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
