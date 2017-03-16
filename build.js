// Import
import Vue from 'vue/dist/vue.common';

// Plugin
import VuePouchDB from './src/index';

// VuePouch
Vue.use(VuePouchDB);

// Bucket
const bucket = new VuePouchDB.Bucket({
  config: {
    // Remote Server
    remote: "https://db.qurate.site:6984",

    // Is DB Remote Only?, default: false
    remoteOnly: false,

    // db.allDocs({options})
    allDocs: {
      include_docs: true
    },

    // new Pouch({options})
    options: {
      ajax: {
        cache: true
      }
    },

    // Pouch.sync({option}) for every Instance
    sync: {
      since: 0,
      live:  true,
      retry: true
    },

    // db.changes({option})
    changes: {
      since: 'now',
      live: true,
      include_docs: true
    },

    // db.changes().on(() => {})
    onChanges(change) {
      console.log("Change: ", change);
    },
    onPaused(error) {
      console.log("Paused", error);
    },
    onActive() {
      console.log("Active");
    },
    onDenied(error) {
      console.log("Denied", error);
    },
    onComplete() {
      console.log("Completed");
    },
    onError(error) {
      console.log("Error", error);
    },
    cancel(cancel) {
      // Something bad Happens, cancel this!
    }
  },

  // Plugins
  plugins: [],

  // Databases
  _users: {
    // Is remote only ?
    remoteOnly: true
  },

  projects: {
    // PouchDB.sync Options
    sync: {
      pull: {
        filter: 'projects/by_user',
        query_params: { "name": "sadiqevani" }
      }
    }

  }
});


// On Load
window.onload = function () {
  const app = new Vue({
    el: `#app`,

    bucket,

    methods: {
      remove({ _id, _rev }) {
        this.$bucket.db('projects').put({
          _id, _rev,
          _deleted: true
        });
      }
    },
    computed: {
      projects() {
        return this.$bucket.state.projects;
      }
    }
  });
};

window.Vue = Vue;
