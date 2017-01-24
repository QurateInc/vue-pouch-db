/**
 * Importing
 */
import PouchDB from 'pouchdb-browser';

/**
 * Global Vue reference
 */
let Vue;

/**
 * Utilities
 */
import {
  noop,
  binarySearch
} from './utils';

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
    this._dbs   = {};
    this._state = {};

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

  // Delete Object from _state
  _deleted(dbname, docID) {
    const index = binarySearch(this._state[dbname], docID);
    const doc   = this._state[dbname][index];

    if (doc && doc._id === docID) {
      // Delete
      this._state[dbname].splice(index, 1);
    }
  }

  // Update or insert state in object
  _upsert(dbname, newDoc) {
    const index = binarySearch(this._state[dbname], newDoc._id);
    const doc   = this._state[dbname][index];

    if (doc && doc._id === newDoc._id) {
      // Update
      Vue.set(this._state[dbname], index, newDoc);
    } else {
      // Insert an Empty object to reserve the index
      this._state[dbname].splice(index, 0, {});
      // Set the reactive data
      Vue.set(this._state[dbname], index, newDoc);
    }
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

    // Populate state with data
    this._dbs[dbname].allDocs(config.allDocs).then((data) => {
      return Vue.set(this._state, dbname, data.rows.map((row) => row.doc));
    });

    // Sync DB
    PouchDB.sync(
      dbname,
      `${config.remote}/${dbname}`,
      config.sync
    );

    // Start detecting changes
    this._initChanges(dbname, config);

    // Return instance
    return this._dbs[dbname];
  }

  _initChanges(dbname, config) {
    // Detect Changes and update the _state tree
    const dbChanges = this._dbs[dbname].changes(config.changes).on("change", (change) => {
      if (change.deleted) {
        this._deleted(dbname, change.id);
      } else {
        this._upsert(dbname, change.doc);
      }
      return config.onChanges && config.onChanges(change);
    })
    .on('error', config.onError || noop)
    .on('paused', config.onPaused || noop)
    .on('active', config.onActive || noop)
    .on('denied', config.onDenied || noop)
    .on('complete', config.onComplete || noop);

    return config.cancel && config.cancel(dbChanges.cancel);
  }

  /**
   * Public Functions
   * @param dbname
   * @param config
   * @returns {*}
   */
  get state() {
    return this._state;
  }

  set state(value) {
    throw new Error("[Vue Pouch]: Do not replace the entire state!");
  }

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

    // Get Util Functions
    const { defineReactive } = $Vue.util;

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
        // Define Reactive state
        defineReactive(this.$bucket, '_state', options.bucket._state);
      } else if (options.parent && options.parent.$bucket) {
        // Getting parent bucket
        this.$bucket = options.parent.$bucket;
      }
    }
  }
};

// Making PouchDB Available for Debugging
if (process.env.NODE_ENV !== "production") {
  window.PouchDB = PouchDB;
}
