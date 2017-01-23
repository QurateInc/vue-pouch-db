// Import
import Vue      from 'vue/dist/vue.common';
import VuePouch from './src/index';

Vue.use(VuePouch);

const bucket = new VuePouch.Bucket({
  config: {
    // Remote Server
    remote: "https://db.qurate.site:6984",

    // Pouch.sync config
    sync: {
      live:  true,
      retry: true
    },

    // DB Global Options
    options: {
      ajax: {
        cache: true
      }
    }
  },

  plugins: [],

  _users: {
    remoteOnly: true

  },
  projects: {
    // Remote Server
    remote: "https://db.qurate.site:6984",

    options: {

    },

    sync: {
      live:  true,
      retry: true,

      pull: {
        since: 0,
        filter: 'projects/by_user',
        query_params: { "name": "stefan" }
      }
    },

    changes: {
      since: 'now',
      live: true,
      include_docs: true
    },

    onChange(data) {
      console.log(data);
    },

    onPaused() {},

    onActive() {},

    onDenied() {},

    onComplete() {},

    onError() {},

    cancel(syncRef) {}
  }
});


// On Load
window.onload = function () {

  const app = new Vue({

    el: `#app`,

    bucket,

    methods: {

    }

  });

  console.log("APP: ", app);
};

window.Vue = Vue;
