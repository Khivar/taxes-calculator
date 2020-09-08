import Vue from 'vue';
import KeenUI from 'keen-ui';
import App from './App.vue';
import 'keen-ui/dist/keen-ui.css';

Vue.use(KeenUI);

Vue.config.productionTip = false;
Vue.filter('formatEuros', (e) => {
  let euros = typeof e === 'string' ? e : e.toString();
  for (let i = euros.length - 3; i > 0; i -= 3) {
    euros = `${euros.substr(0, i)} ${euros.substr(i)}`;
  }
  return `${euros}€`;
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');
