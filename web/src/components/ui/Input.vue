<script setup lang="ts">
import { computed } from "vue";

let uid = 0;
const props = defineProps<{
  modelValue?: string | number;
  label?: string;
  help?: string;
  id?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string | number] }>();

defineOptions({ inheritAttrs: false });

const inputId = computed(() => props.id ?? `in-${++uid}`);

function onInput(e: Event) {
  const el = e.target as HTMLInputElement;
  if (el.type === "number") {
    const n = el.value === "" ? "" : Number(el.value);
    emit("update:modelValue", (Number.isNaN(n as number) ? "" : n) as string | number);
  } else {
    emit("update:modelValue", el.value);
  }
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1 block text-label text-ink/70" :for="inputId">
      {{ label }}
    </label>
    <input
      :id="inputId"
      v-bind="$attrs"
      :value="modelValue"
      class="min-h-9 w-full rounded-pill border border-divider bg-surface px-4 py-1 text-control text-ink caret-accent transition-colors hover:border-ink/45 focus:border-accent focus:ring-0 focus-visible:border-accent focus-visible:outline-offset-0"
      @input="onInput"
    />
    <p v-if="help" class="mt-1 text-meta text-muted">{{ help }}</p>
  </div>
</template>
