import Vue from 'vue'
import "./vue-toastification";
import App from './App.vue'
import * as rest from './services';
import './registerServiceWorker'
import router from './router'
import store from './store'
import { Auth } from "./services/OAuth";

import 'primevue/resources/themes/nova-vue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css';

Vue.prototype.$rest = rest;
Vue.prototype.$oauth = Auth;
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
