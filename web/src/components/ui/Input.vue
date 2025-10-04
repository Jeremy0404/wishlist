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
    emit("update:modelValue", (Number.isNaN(n as number) ? "" : n) as any);
  } else {
    emit("update:modelValue", el.value);
  }
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm mb-1" :for="inputId">{{
      label
    }}</label>
    <input
      :id="inputId"
      v-bind="$attrs"
      :value="modelValue"
      @input="onInput"
      class="w-full rounded-lg border-zinc-300 bg-white text-sm focus:ring-brand-500 focus:border-brand-500"
    />
    <p v-if="help" class="text-xs text-zinc-500 mt-1">{{ help }}</p>
  </div>
</template>
