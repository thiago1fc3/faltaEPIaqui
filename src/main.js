import Vue from 'vue'
import "./vue-toastification";
import App from './App.vue'
import * as rest from './services';
import './registerServiceWorker'
import router from './router'
import store from './store'

import 'primevue/resources/themes/nova-vue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css';

Vue.prototype.$rest = rest;
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
