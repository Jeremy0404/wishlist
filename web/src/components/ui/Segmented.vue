<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  name: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

// The checked option is owned by the parent: a click that it does not accept
// must leave the control where it was, so the native state is reverted first.
function onChange(event: Event, value: string) {
  (event.target as HTMLInputElement).checked = value === props.modelValue;
  emit("update:modelValue", value);
}
</script>

<template>
  <div
    class="inline-flex overflow-hidden rounded-pill border border-divider"
    :class="disabled && 'cursor-not-allowed opacity-45'"
  >
    <label
      v-for="opt in options"
      :key="opt.value"
      :data-test="`${name}-${opt.value}`"
      class="inline-flex cursor-pointer items-center gap-1 border-l border-divider px-3 py-1 text-caption first:border-l-0 has-[:focus-visible]:outline has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
      :class="
        opt.value === modelValue
          ? 'bg-accent text-bg'
          : 'hover:bg-ink/7'
      "
    >
      <input
        class="sr-only"
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="opt.value === modelValue"
        :disabled="disabled"
        @change="onChange($event, opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
