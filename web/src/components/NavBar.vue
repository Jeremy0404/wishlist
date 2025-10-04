<template>
  <div class="min-h-screen bg-white text-zinc-900">
    <nav class="border-b border-zinc-200">
      <div
        class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3 flex-wrap"
      >
        <RouterLink to="/" class="font-semibold">🎄 Wishlist</RouterLink>

        <FamilyBadge class="ml-2" v-if="route.path !== '/'" />

        <div class="ml-auto flex items-center gap-2">
          <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" to="/">{{
            t("nav.home") ?? "Accueil"
          }}</RouterLink>
          <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" to="/me">{{
            t("nav.myList")
          }}</RouterLink>
          <RouterLink
            v-if="auth.inFamily"
            class="px-3 py-1.5 rounded hover:bg-zinc-100"
            to="/wishlists"
            >{{ t("nav.others") }}</RouterLink
          >
          <RouterLink
            v-if="auth.inFamily"
            class="px-3 py-1.5 rounded hover:bg-zinc-100"
            to="/family/invite"
            >{{ t("nav.invite") }}</RouterLink
          >
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <ToastContainer />
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import FamilyBadge from "./FamilyBadge.vue";
import { useAuth } from "../stores/auth.ts";
import ToastContainer from "./ui/ToastContainer.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const auth = useAuth();
const route = useRoute();
</script>
