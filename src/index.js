/**
 * Local Plugins
 */
import PouchDB from 'pouchdb-browser';

// Global Vue reference
let Vue;

/**
 * Bucket Class
 */
class Bucket {

  /**
   * Creating internal state for Bucket
   * @param schema
   */
  constructor(schema = {}) {

    // Ignored Schema Keys
    const ignoredKeys = [
      'config',
      'plugins'
    ];

    // Internal Variables
    this._dbs = {};
    this._vms = new Vue({data() {
      const dataSchema = {};
      for (const dbname in schema) {
        if (schema.hasOwnProperty(dbname) && ignoredKeys.indexOf(dbname) === -1) {
          dataSchema[dbname] = {};
        }
      }
      return dataSchema;
    }});

    // Local Variables
    if (!schema.config) {
      throw new Error(`[Pouch Bucket]: Config is not declared in the upper level!`);
    }

    // Init PouchDB plugins
    if ((schema.plugins.constructor === Array) && (schema.plugins.length > 0)) {
      for (let i = 0; i < schema.plugins.length; i++) {
        PouchDB.plugin(
          schema.plugins[i]
        );
      }
    }

    // Initializing DBs that are declared in the schema{}
    for (const dbname in schema) {
      if (schema.hasOwnProperty(dbname) && ignoredKeys.indexOf(dbname) === -1) {
        this._initDB(
          dbname,
          Object.assign(
            {},
            schema.config,
            schema[dbname]
          )
        );
      }
    }
  }

  /**
   * Referencing internal state
   * @returns {Object}
   */
  get state() {
    return this._vms.$data;
  }

  /**
   * Init Database
   * @param dbname
   * @param config
   * @returns {*}
   * @private
   */
  _initDB(dbname, config = {}) {
    // If DB Exists return it
    if (this._dbs[dbname]) {
      return this._dbs[dbname];
    }

    // Init only remote
    if (config.remoteOnly) {
      this._dbs[dbname] = new PouchDB(
        `${config.remote}/${dbname}`,
        config.options
      );
      return this._dbs[dbname];
    }

    // Init DB
    this._dbs[dbname] = new PouchDB(dbname, config.options);



    // Sync DB
    PouchDB.sync(
      dbname,
      `${config.remote}/${dbname}`,
      config.sync
    ).on("change", (state) => {
      state.change.docs.forEach(() => {

      });
    });

    // Return instance
    return this._dbs[dbname];
  }

  /**
   * Public Functions
   * @param dbname
   * @param config
   * @returns {*}
   */
  db(dbname, config) {
    return this._initDB(dbname, config);
  }
}

/**
 * Exporting
 **/
export default {
  // Bucket Class
  Bucket,

  // Install Plugin
  install($Vue) {

    // Checking if Vue is Installed
    if (Vue) {
      console.error('[VuePouch] already installed. Vue.use(VuePouch) should be called only once.')
      return null;
    }

    // Making Vue globally available
    Vue = $Vue;

    // Check Version Number
    const version = Number(Vue.version.split('.')[0]);

    // Check Version
    if (version >= 2) {
      const usesInit = Vue.config._lifecycleHooks.indexOf('init') > -1;
      Vue.mixin(usesInit ? { init: bucketInit } : { beforeCreate: bucketInit })
    } else {
      // override init and inject VuePouch init procedure
      // for 1.x backwards compatibility.
      const _init = Vue.prototype._init;
      Vue.prototype._init = function (options = {}) {
        options.init = options.init
          ? [bucketInit].concat(options.init)
          : bucketInit;
        _init.call(this, options);
      }
    }

    /**
     * Vuex init hook, injected into each instances init hooks list.
     */
    function bucketInit () {
      // Getting Options
      const options = this.$options;

      // Bucket injection
      if (options.bucket) {
        // Getting the core $bucket
        this.$bucket = options.bucket;
      } else if (options.parent && options.parent.$bucket) {
        // Getting parent bucket
        this.$bucket = options.parent.$bucket;
      }
    }
  }
};

// Making PouchDB Available for Debugging
if (process.env.NODE_ENV === "development") {
  window.PouchDB = PouchDB;
}
