<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { itemImageSrc } from "../../utils/image";

const props = defineProps<{ imageUrl?: string | null; size: number }>();

const failed = ref(false);
const src = computed(() => itemImageSrc(props.imageUrl));

watch(src, () => (failed.value = false));
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    alt=""
    data-test="item-thumbnail"
    class="flex-none rounded-sm object-cover"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @error="failed = true"
  />
</template>
