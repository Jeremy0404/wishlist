<script setup lang="ts">
const bars = ["80%", "60%", "70%"];
</script>

<template>
  <div class="flex flex-col gap-3" role="status" data-test="list-skeleton">
    <span
      v-for="width in bars"
      :key="width"
      class="h-skeleton animate-shimmer rounded-pill bg-neutral-200 motion-reduce:animate-none"
      :style="{ width }"
    ></span>
  </div>
</template>
