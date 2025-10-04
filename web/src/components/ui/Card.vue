<template>
  <div class="rounded-xl border border-zinc-200 bg-white shadow-soft">
    <div v-if="$slots.header" class="p-4 border-b border-zinc-200">
      <slot name="header" />
    </div>
    <div class="p-4">
      <slot />
    </div>
  </div>
</template>
