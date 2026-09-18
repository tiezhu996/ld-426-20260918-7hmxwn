import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { registerGlobalErrorHandler } from './utils/errorHandler';
import './styles/theme.css';
import './styles/global.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
registerGlobalErrorHandler(app);
app.mount('#app');
