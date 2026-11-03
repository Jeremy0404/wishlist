<template>
  <form class="grid gap-3" autocomplete="on" @submit.prevent="submit">
    <Input
      v-if="creating"
      v-model="name"
      type="text"
      name="name"
      autocomplete="name"
      :label="t('auth.name')"
      required
    />
    <Input
      v-if="creating"
      v-model="email"
      type="email"
      name="email"
      autocomplete="email"
      :label="t('auth.email')"
      required
    />
    <Input
      v-else
      v-model="identifier"
      type="text"
      name="identifier"
      autocomplete="username"
      :label="t('auth.identifier')"
      required
    />
    <Input
      v-model="password"
      type="password"
      :name="creating ? 'new-password' : 'password'"
      :autocomplete="creating ? 'new-password' : 'current-password'"
      :label="t('auth.password')"
      required
    />

    <Button variant="primary" block type="submit" :loading="submitting">
      {{ creating ? t("auth.create") : t("auth.login") }}
    </Button>

    <Button
      variant="ghost"
      block
      :data-test="creating ? 'want-login' : 'want-register'"
      @click="creating = !creating"
    >
      {{ creating ? t("auth.haveAccount") : t("auth.noAccount") }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import { useToasts } from "../ui/useToasts";
import { useAuth } from "../../stores/auth";
import { errorMessage } from "../../utils/errors";

const props = defineProps<{ redirect: string }>();

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();
const emit = defineEmits<{ done: [redirect: string] }>();

const creating = ref(false);
const name = ref("");
const email = ref("");
const identifier = ref("");
const password = ref("");
const submitting = ref(false);

async function submit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    if (creating.value) {
      await auth.register(name.value.trim(), email.value.trim(), password.value);
      push(t("auth.registerSuccess"), "success");
    } else {
      await auth.login(identifier.value.trim(), password.value);
      push(t("auth.loginSuccess"), "success");
    }
    emit("done", props.redirect);
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    submitting.value = false;
  }
}
</script>
