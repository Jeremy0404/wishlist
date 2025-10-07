import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./index.css";
import { i18n } from "./i18n.ts";
import router from "./router.ts";

createApp(App).use(createPinia()).use(router).use(i18n).mount("#app");
