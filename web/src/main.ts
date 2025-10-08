import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./index.css";
import router from "./router.ts";
import { useAuth } from "./stores/auth.ts";
import { i18n } from "./i18n.ts";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(i18n);

useAuth().installApiGuards();

app.mount("#app");
