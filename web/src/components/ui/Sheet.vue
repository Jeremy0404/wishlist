<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Icon from "./Icon.vue";

const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const panel = ref<HTMLElement | null>(null);

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let returnFocusTo: HTMLElement | null = null;

function focusables() {
  const all = panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [];
  return Array.from(all).filter((el) => el.offsetParent !== null);
}

function keepTabInside(e: KeyboardEvent) {
  const items = focusables();
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (!first || !last) {
    e.preventDefault();
  } else if (e.shiftKey && (active === first || active === panel.value)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
  else if (e.key === "Tab") keepTabInside(e);
}

/** The sheet is teleported out of #app, so the whole app behind it goes inert. */
function holdBackground() {
  returnFocusTo = document.activeElement as HTMLElement | null;
  document.getElementById("app")?.setAttribute("inert", "");
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKeydown);
}

function releaseBackground() {
  document.removeEventListener("keydown", onKeydown);
  document.getElementById("app")?.removeAttribute("inert");
  document.body.style.overflow = "";
  returnFocusTo?.focus();
  returnFocusTo = null;
}

watch(
  () => props.open,
  async (open, wasOpen) => {
    if (!open) {
      if (wasOpen) releaseBackground();
      return;
    }
    holdBackground();
    await nextTick();
    const firstField = panel.value?.querySelector<HTMLElement>(
      "input, textarea, select",
    );
    (firstField ?? panel.value)?.focus();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (props.open) releaseBackground();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
      >
        <button
          type="button"
          class="absolute inset-0 cursor-default bg-ink/40"
          :aria-label="t('common.close')"
          tabindex="-1"
          @click="emit('close')"
        ></button>
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
          data-test="sheet"
          class="sheet-panel relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-surface shadow-lg md:max-w-md md:rounded-[20px]"
        >
          <div class="flex flex-none flex-col gap-4 px-5 pb-4 pt-3 md:pt-5">
            <span
              aria-hidden="true"
              class="h-1.5 w-10 self-center rounded-full bg-neutral-400 md:hidden"
            ></span>
            <div class="flex items-center justify-between gap-3">
              <h2 class="mb-0 text-h2">{{ title }}</h2>
              <button
                type="button"
                class="pressable grid h-11 w-11 flex-none place-items-center rounded-full bg-neutral-200 text-ink hover:bg-neutral-300 active:bg-neutral-400"
                data-test="sheet-close"
                :aria-label="t('common.close')"
                @click="emit('close')"
              >
                <Icon name="close" :size="20" />
              </button>
            </div>
          </div>
          <div class="sheet-body flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-8">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-body {
  scrollbar-width: thin;
  scrollbar-color: var(--color-neutral-400) transparent;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 200ms ease-out;
}
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(24px);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .sheet-panel,
  .sheet-leave-active .sheet-panel {
    transition: none;
  }
}
</style>
