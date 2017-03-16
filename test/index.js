/**
 * Assert Library
 */
var assert     = require('assert');
var Vue        = require("../node_modules/vue/dist/vue.common");
var VuePouchDB = require("../dist/index").default;

/**
 * Plugins
 */
Vue.use(VuePouchDB);

console.log(VuePouchDB);

// Bucket Config / Startup Object
const bucket = new VuePouchDB.Bucket({
  config: {
    // Remote Server
    remote: "COUCHDB SERVER",

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

  // Projects
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

// Vue Application Startup
const app = new Vue({
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

/**
 * Tests
 */
describe('Vue Pouch DB', function() {

  describe('#Vue.use(VuePouchDB)', function() {

    it("should be defined", function () {
      assert(Vue);
      assert(VuePouchDB);
      assert(app);
    });

  });
});
