import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

// Import views
import LiveView from './views/LiveView.vue';
import HistoryView from './views/HistoryView.vue';
import SettingsView from './views/SettingsView.vue';

// Define routes
const routes = [
  { path: '/', redirect: '/live' },
  { path: '/live', component: LiveView },
  { path: '/history', component: HistoryView },
  { path: '/settings', component: SettingsView },
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Create and mount the app
const app = createApp(App);
app.use(router);
app.mount('#app');