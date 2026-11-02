<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Icon from "../ui/Icon.vue";
import { itemImageSrc } from "../../utils/image";

const props = defineProps<{ imageUrl?: string | null; tone: string }>();

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
    class="h-[52px] w-[52px] flex-none rounded-md object-cover"
    @error="failed = true"
  />
  <span
    v-else
    aria-hidden="true"
    data-test="item-placeholder"
    class="grid h-[52px] w-[52px] flex-none place-items-center rounded-md"
    :class="tone"
  >
    <Icon name="gift" :size="24" />
  </span>
</template>
