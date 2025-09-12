import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// Nucleo Icons
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";

import materialKit from "./material-kit";
import "./assets/css/orange-theme.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(materialKit);
app.mount("#app");
