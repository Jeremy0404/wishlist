<template>
  <div class="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
    <div class="grid gap-6">
      <Tag variant="accent">{{ t("signIn.kicker") }}</Tag>
      <div class="grid gap-3">
        <h1 class="font-heading text-h1 text-ink">{{ t("signIn.title") }}</h1>
        <p class="text-body text-muted">{{ t("signIn.subtitle") }}</p>
      </div>

      <Card>
        <p class="mb-2 font-heading text-kicker uppercase text-muted">
          {{ t("signIn.getStarted") }}
        </p>
        <h2 class="mb-4 font-heading text-h4 text-ink">
          {{ withPassword ? t("auth.login") : t("auth.magic.title") }}
        </h2>

        <PasswordForm
          v-if="withPassword"
          :redirect="redirect"
          @done="go"
        />
        <MagicLinkForm v-else />

        <template v-if="!withPassword">
          <hr class="my-4 border-divider" />
          <Button
            variant="ghost"
            block
            data-test="use-password"
            @click="withPassword = true"
          >
            {{ t("auth.magic.passwordInstead") }}
          </Button>
        </template>
      </Card>
    </div>

    <SampleWishlist class="lg:sticky lg:top-24" />
  </div>

  <ul class="mt-14 grid gap-6 sm:grid-cols-3">
    <li v-for="prop in valueProps" :key="prop.title" class="grid gap-1">
      <h3 class="font-heading text-h5 text-ink">{{ prop.title }}</h3>
      <p class="text-meta text-muted">{{ prop.body }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import MagicLinkForm from "../components/auth/MagicLinkForm.vue";
import PasswordForm from "../components/auth/PasswordForm.vue";
import SampleWishlist from "../components/SampleWishlist.vue";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import Tag from "../components/ui/Tag.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const withPassword = ref(false);

const redirect = computed(() => {
  const r = route.query.redirect;
  return typeof r === "string" && r ? r : "/me";
});

const valueProps = computed(() =>
  (["quick", "familyOptional", "noDuplicates"] as const).map((key) => ({
    title: t(`signIn.props.${key}.title`),
    body: t(`signIn.props.${key}.body`),
  })),
);

function go(to: string) {
  router.replace(to);
}
</script>
