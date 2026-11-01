<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import AccountButton from "./AccountButton.vue";
import BrandLockup from "./ui/BrandLockup.vue";
import Icon from "./ui/Icon.vue";
import type { IconName } from "./ui/icons";

const { t } = useI18n();
const route = useRoute();

type Tab = { to: string; label: string; icon: IconName; test: string };

const FAMILY_PATHS = ["/wishlists", "/family"];

const tabs = computed<Tab[]>(() => [
  { to: "/me", label: t("nav.myList"), icon: "gift", test: "tab-my-list" },
  { to: "/wishlists", label: t("nav.family"), icon: "users", test: "tab-family" },
]);

function isActive(tab: Tab) {
  if (tab.to === "/me") return route.path === "/me";
  return FAMILY_PATHS.some((path) => route.path.startsWith(path));
}
</script>

<template>
  <header
    class="sticky top-0 z-40 hidden border-b border-divider bg-bg/90 backdrop-blur-sm md:block"
  >
    <nav
      :aria-label="t('nav.main')"
      class="mx-auto flex max-w-3xl items-center gap-8 px-6 py-3"
    >
      <RouterLink to="/me" class="text-ink">
        <BrandLockup />
      </RouterLink>
      <div class="flex flex-1 items-center gap-6">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          :data-test="tab.test"
          :aria-current="isActive(tab) ? 'page' : undefined"
          class="flex items-center gap-2 py-2 font-semibold no-underline transition-colors"
          :class="isActive(tab) ? 'text-accent' : 'text-muted hover:text-ink'"
        >
          <Icon :name="tab.icon" :size="20" />
          {{ tab.label }}
        </RouterLink>
      </div>
      <AccountButton />
    </nav>
  </header>

  <nav
    :aria-label="t('nav.main')"
    class="fixed inset-x-0 bottom-0 z-40 grid h-[76px] grid-cols-2 border-t border-divider bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      :data-test="tab.test"
      :aria-current="isActive(tab) ? 'page' : undefined"
      class="flex flex-col items-center justify-center gap-1 text-meta font-semibold no-underline"
      :class="isActive(tab) ? 'text-accent' : 'text-muted'"
    >
      <Icon :name="tab.icon" :size="26" />
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
