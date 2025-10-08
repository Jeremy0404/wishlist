<template>
  <div>
    <section class="pt-10 pb-6">
      <div
        class="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center"
      >
        <div>
          <h1 class="text-3xl md:text-4xl font-bold leading-tight">
            <span v-if="!auth.user">{{ t("landing.helloAnon") }}</span>
            <span
              v-else
              v-html="t('landing.helloUser', { name: auth.user.name })"
            ></span>
          </h1>
          <p class="mt-3 text-zinc-600">
            {{ !auth.user ? t("landing.subAnon") : t("landing.subUser") }}
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <template v-if="!auth.user">
              <RouterLink
                to="/auth/register"
                class="px-5 py-2.5 rounded-lg bg-brand text-white hover:bg-brand-700"
              >
                {{ t("landing.start") }}
              </RouterLink>
              <RouterLink
                to="/auth/login"
                class="px-5 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-100"
              >
                {{ t("landing.login") }}
              </RouterLink>
            </template>

            <template v-else-if="auth.user && !auth.inFamily">
              <RouterLink
                to="/family/create"
                class="px-5 py-2.5 rounded-lg bg-brand text-white hover:bg-brand-700"
              >
                {{ t("landing.createFamily") }}
              </RouterLink>
              <RouterLink
                to="/family/join"
                class="px-5 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-100"
              >
                {{ t("landing.joinFamily") }}
              </RouterLink>
              <RouterLink
                to="/me"
                class="px-5 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-100"
              >
                {{ t("landing.goMyList") }}
              </RouterLink>
            </template>

            <template v-else>
              <RouterLink
                to="/me"
                class="px-5 py-2.5 rounded-lg bg-brand text-white hover:bg-brand-700"
              >
                {{ t("landing.goMyList") }}
              </RouterLink>
              <RouterLink
                to="/wishlists"
                class="px-5 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-100"
              >
                Les autres
              </RouterLink>
            </template>
          </div>
        </div>

        <div class="relative">
          <div
            class="aspect-[4/3] rounded-2xl border border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,.06)] bg-white overflow-hidden"
          >
            <div class="h-full w-full grid grid-rows-3">
              <div class="p-4 border-b border-zinc-100 flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-zinc-200"></div>
                <div class="w-3 h-3 rounded-full bg-zinc-200"></div>
                <div class="w-3 h-3 rounded-full bg-zinc-200"></div>
                <div class="ml-auto h-6 w-24 bg-zinc-100 rounded"></div>
              </div>
              <div class="p-4 grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="h-4 w-40 bg-zinc-100 rounded"></div>
                  <div class="h-3 w-28 bg-zinc-100 rounded"></div>
                  <div
                    class="h-24 w-full bg-zinc-50 border border-zinc-100 rounded"
                  ></div>
                </div>
                <div class="space-y-2">
                  <div class="h-4 w-36 bg-zinc-100 rounded"></div>
                  <div class="h-3 w-24 bg-zinc-100 rounded"></div>
                  <div
                    class="h-24 w-full bg-zinc-50 border border-zinc-100 rounded"
                  ></div>
                </div>
              </div>
              <div
                class="p-4 border-t border-zinc-100 flex items-center justify-end gap-2"
              >
                <div
                  class="h-9 px-4 rounded-lg bg-brand/10 text-brand flex items-center"
                >
                  Réserver
                </div>
                <div class="h-9 px-4 rounded-lg bg-zinc-100 flex items-center">
                  Partager…
                </div>
              </div>
            </div>
          </div>
          <div class="absolute -bottom-6 -left-6 rotate-[-6deg]">
            <span
              class="inline-block px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs shadow"
              >Famille 🎁</span
            >
          </div>
        </div>
      </div>
    </section>

    <section v-if="auth.user" class="pb-4">
      <div class="max-w-5xl mx-auto px-4">
        <div
          v-if="auth.inFamily"
          class="rounded-xl border border-zinc-200 p-4 bg-white shadow-soft"
        >
          <p class="mb-1">
            {{ t("landing.youAreIn", { fam: auth.myFamily?.name }) }}
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <span class="text-sm">{{ t("landing.yourInviteCode") }} :</span>
            <code class="bg-zinc-100 px-2 py-0.5 rounded">{{
              auth.inviteCode
            }}</code>
            <Button variant="ghost" @click="copy">{{
              t("common.copy")
            }}</Button>
            <InviteShareButton
              v-if="canShare && auth.myFamily"
              :name="auth.myFamily.name"
              :code="auth.myFamily.invite_code"
            />
            <span v-if="copied" class="text-green-700 text-sm"
              >✔ {{ t("landing.copied") }}</span
            >
          </div>
        </div>

        <div
          v-else
          class="rounded-xl border border-zinc-200 p-4 bg-white shadow-soft"
        >
          <p class="text-zinc-700">
            {{ t("others.hint") }}
          </p>
          <div class="mt-3 flex gap-3">
            <RouterLink
              to="/family/create"
              class="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-700"
            >
              {{ t("landing.createFamily") }}
            </RouterLink>
            <RouterLink
              to="/family/join"
              class="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-100"
            >
              {{ t("landing.joinFamily") }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section class="py-8 bg-zinc-50 border-t border-b border-zinc-200">
      <div class="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
        <div class="p-5 bg-white rounded-xl border border-zinc-200 shadow-soft">
          <div class="text-2xl">🎁</div>
          <h3 class="mt-2 font-semibold">{{ t("landing.fPrivacyT") }}</h3>
          <p class="text-sm text-zinc-600 mt-1">
            {{ t("landing.fPrivacyD") }}
          </p>
        </div>
        <div class="p-5 bg-white rounded-xl border border-zinc-200 shadow-soft">
          <div class="text-2xl">✨</div>
          <h3 class="mt-2 font-semibold">{{ t("landing.fSimpleT") }}</h3>
          <p class="text-sm text-zinc-600 mt-1">{{ t("landing.fSimpleD") }}</p>
        </div>
      </div>
    </section>

    <footer class="py-8 text-center text-sm text-zinc-500">
      {{ t("landing.footer", { github: "GitHub" }) }}
      •
      <a
        href="https://github.com/Jeremy0404/wishlist"
        target="_blank"
        class="underline hover:text-zinc-700"
        >GitHub</a
      >
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import Button from "../components/ui/Button.vue";
import { useAuth } from "../stores/auth";
import { useToasts } from "../components/ui/useToasts";
import InviteShareButton from "../components/InviteShareButton.vue";

const { t } = useI18n();
const auth = useAuth();
const { push } = useToasts();

const copied = ref(false);
const canShare = computed(
  () => typeof navigator !== "undefined" && !!(navigator as any).share,
);

async function copy() {
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  copied.value = true;
  push(t("landing.copied"), "success");
  setTimeout(() => (copied.value = false), 1500);
}
</script>
