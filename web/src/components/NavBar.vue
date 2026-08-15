<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuth } from "../stores/auth.ts";
import { useToasts } from "./ui/useToasts.ts";
import Button from "./ui/Button.vue";
import Icon from "./ui/Icon.vue";
import FamilyBadge from "./FamilyBadge.vue";

const { t } = useI18n();
const auth = useAuth();
const router = useRouter();
const { push } = useToasts();

async function onLogout() {
  await auth.logout();
  push(t("toast.bye"), "info");
  await router.push("/");
}

onMounted(() => {
  if (auth.user === undefined) auth.hydrate();
});
</script>

<template>
  <nav class="sticky top-0 z-50 bg-bg/90 backdrop-blur">
    <div class="mx-auto max-w-5xl px-4 py-3">
      <div class="flex flex-wrap items-center gap-4">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 font-heading text-h5 text-ink"
        >
          <Icon name="gift" :size="18" />
          <span>{{ t("nav.wishlist") }}</span>
        </RouterLink>

        <FamilyBadge class="shrink-0" />

        <div class="ms-auto flex items-center gap-2">
          <template v-if="auth.user">
            <Button
              data-test="logout"
              variant="secondary"
              @click="onLogout"
            >
              {{ t("nav.logout") }}
            </Button>
          </template>
          <template v-else>
            <Button variant="secondary" to="/auth/login">
              {{ t("nav.login") }}
            </Button>
            <Button variant="primary" to="/auth/register">
              {{ t("nav.register") }}
            </Button>
          </template>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-3">
        <RouterLink class="nav-link" to="/">{{ t("nav.home") }}</RouterLink>

        <template v-if="auth.user">
          <RouterLink class="nav-link" to="/me">{{ t("nav.myList") }}</RouterLink>
          <RouterLink v-if="auth.inFamily" class="nav-link" to="/wishlists">
            {{ t("nav.others") }}
          </RouterLink>
          <RouterLink v-if="auth.inFamily" class="nav-link" to="/family/invite">
            {{ t("nav.invite") }}
          </RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  @apply inline-flex items-center gap-2 text-control text-ink no-underline;
}

.nav-link:hover,
.nav-link[aria-current="page"] {
  @apply text-accent;
}
</style>
