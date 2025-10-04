import { createApp } from "vue";
import { createPinia } from "pinia";
import { router } from "./router";
import App from "./App.vue";
import "./index.css";
import { i18n } from "./i18n.ts";

createApp(App).use(createPinia()).use(router).use(i18n).mount("#app");
