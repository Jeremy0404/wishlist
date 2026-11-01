<script setup lang="ts">
import AccountButton from "./AccountButton.vue";
</script>

<template>
  <header class="mb-5 flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h1 class="mb-0 text-balance">
        <slot />
      </h1>
      <p v-if="$slots.lead" class="mb-0 mt-3 text-muted">
        <slot name="lead" />
      </p>
    </div>
    <AccountButton class="md:hidden" />
  </header>
</template>
