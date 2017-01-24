// Import
import Vue      from 'vue/dist/vue.common';
import VuePouch from './src/index';

Vue.use(VuePouch);

const bucket = new VuePouch.Bucket({
  config: {
    // Remote Server
    remote: "https://db.qurate.site:6984",

    // db.allDocs({options})
    allDocs: {
      include_docs: true
    },

    // Pouch.sync config for every Instance
    sync: {
      live:  true,
      retry: true
    },

    // Options for every new PouchDB instance
    options: {
      ajax: {
        cache: true
      }
    },

    // db.changes().on($events)
    onChanges(change) {
      console.log(change);
    },
    onPaused() {},
    onActive() {},
    onDenied() {},
    onComplete() {},
    onError() {},
    cancel(cancel) {}
  },

  plugins: [],

  _users: {
    // Is remote only ?
    remoteOnly: true,

    // new PouchDB: Options
    options: {

    }
  },
  projects: {
    // Remote Server
    remote: "https://db.qurate.site:6984",

    // new PouchDB: Options
    options: {
      ajax: {
        cache: true
      }
    },

    // db.allDocs({options})
    allDocs: {
      include_docs: true
    },

    // PouchDB.sync Options
    sync: {
      live:  true,
      retry: true,

      pull: {
        since: 0,
        filter: 'projects/by_user',
        query_params: { "name": "stefan" }
      }
    },

    // db.changes({ options })
    changes: {
      since: 'now',
      live: true,
      include_docs: true
    },

    // db.changes().on($events)
    onChanges() {},
    onPaused() {},
    onActive() {},
    onDenied() {},
    onComplete() {},
    onError() {},
    cancel(cancel) {}
  }
});


// On Load
window.onload = function () {

  const app = new Vue({

    el: `#app`,

    bucket,

    computed: {
      projects() {
        return this.$bucket.state.projects;
      }
    },

    methods: {

    }

  });

  console.log("APP: ", app);
};

window.Vue = Vue;
