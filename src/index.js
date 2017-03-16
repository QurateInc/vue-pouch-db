/**
 * Importing
 */
import PouchDB from 'pouchdb-browser';

/**
 * Utilities
 */
import merge from 'lodash.merge';
import {
  noop,
  binarySearch,
  expand,
  mapQueries
} from './utils';

/**
 * Internal Global Vue reference
 */
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

    // Ignore Schema Keys
    const ignoredKeys = [
      'config',
      'plugins',
      'actions'
    ];

    // Internal Config reference
    this._config = schema.config;

    // Internal State
    this._dbs   = {};
    this._watch = {};
    this._state = {};

    // Throw Error if Global Config not defined
    if (!schema.config) throw new Error('[VuePouchDB]: Global Config is not declared in the upper level!');

    // Referencing Actions to the $bucket
    if (schema.actions) merge(this, schema.actions);

    // Init PouchDB plugins
    if (Array.isArray(schema.plugins) && (schema.plugins.length > 0)) {
      for (let i = 0; i < schema.plugins.length; i += 1) {
        PouchDB.plugin(schema.plugins[i]);
      }
    }

    // Initializing DBs that are declared in the schema{}
    Object.keys(schema).forEach((dbname) => {
      // If is ignored Key, skip!
      if (ignoredKeys.indexOf(dbname) !== -1)  return null;
      // Initialize the DB
      return this._initDB(dbname, merge(
        {},
        schema.config,
        schema[dbname]
      ));
    });
  }

  // Delete Object from _state
  _deleted(dbname, docID) {
    const index = binarySearch(this._state[dbname], docID);
    const doc   = this._state[dbname][index];

    // Delete
    if (doc && doc._id === docID) {
      this._state[dbname].splice(index, 1);
    }
  }

  // Update or insert state in object
  _upsert(dbname, newDoc) {
    const index = binarySearch(this._state[dbname], newDoc._id);
    const doc   = this._state[dbname][index];

    // Update
    if (doc && doc._id === newDoc._id) {
      // Make Reactive
      Vue.set(this._state[dbname], index, newDoc);
    } else {
      // Insert an Empty object to reserve the index
      this._state[dbname].splice(index, 0, {});
      // Set the reactive data
      Vue.set(this._state[dbname], index, newDoc);
    }
  }

  /**
   * Relax, and send the request to CouchDB
   * @param options
   * @private
   */
  _relax(options) {
    return fetch(`${this._config.remote}/${options.url}`,
      merge({
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }, options, { body: JSON.stringify(options.body) }
    )).then(response => response.json());
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
    const dbChanges = this._dbs[dbname].changes(config.changes).on('change', (change) => {
      if (change.deleted) {
        this._deleted(dbname, change.id);
      } else {
        this._upsert(dbname, change.doc);
      }
      return config.onChanges && config.onChanges(change);
    }).on('complete', (complete) => {
      if (complete.results) {
        complete.results.forEach((change) => {
          if (change.deleted) {
            this._deleted(dbname, change.id);
          } else {
            this._upsert(dbname, change.doc);
          }
        });
      }
      return config.onComplete || config.onComplete(complete);
    }).on('error', config.onError || noop)
    .on('paused', config.onPaused || noop)
    .on('active', config.onActive || noop)
    .on('denied', config.onDenied || noop);

    // Calling the Cancel function
    config.cancel && config.cancel(dbChanges.cancel);

    // Set Max Listeners
    dbChanges.setMaxListeners(1000);

    // Reference all Subscriptions
    this._watch[dbname] = dbChanges;

    // Returning the Watch
    return this._watch[dbname];
  }

  /**
   * Reference internal state
   */
  get state() {
    return this._state;
  }

  /**
   * Don't let the state be overwritten from outside
   */
  set state(value) {
    console.error(
      `[VuePouchDB]: Do not replace the entire state! 
       VuePouchDB takes care of the updates internally, 
       change the DB instead!`
    );
    return undefined;
  }

  /**
   * DB Accessor
   * @param dbname
   * @param config
   * @returns {*}
   */
  db(dbname, config = {}) {
    return this._initDB(dbname, merge({}, this._config, config));
  }

  /**
   * Closing the DB and removing all the change watchers and state.
   * @param dbname
   * @returns {Promise}
   */
  closedb(dbname) {
    // If db does not exist, skip.
    if (!this._dbs[dbname]) return null;
    // If the DB is already closed, simply skip.
    if (this._dbs[dbname]._closed) return null;
    // Close the DB and return Promise
    return new Promise((resolve, reject) => {
      // Closing the DB
      this._dbs[dbname].close().then((response) => {
        // Canceling the Change Event
        this._watch[dbname].cancel();
        // Deleting internal db reference
        delete this._dbs[dbname];
        // Removing the State of the DB
        Vue.delete(this._state, dbname);
        // Deleting internal watch reference
        delete this._watch[dbname];
        // Resolving Promise
        return resolve(response);
      }).catch(reject);
    });
  }
}

/**
 * Exporting public utility functions
 */
export {
  mapQueries
};

/**
 * Exporting
 **/
export default {
  // Bucket Class
  Bucket,

  // Install Plugin
  install($Vue) {

    // Checking if Vue is Installed
    if (Vue) throw new Error('[VuePouchDB] already installed. Vue.use(VuePouchDB) should be called only once.');

    // Making Vue globally available
    Vue = $Vue;

    // Get Util Functions
    const { defineReactive } = Vue.util;

    // Check Version Number
    const version = Number(Vue.version.split('.')[0]);

    /**
     * Setup the internal $dbsetup object
     * @param dbsetup
     */
    function $dbsetup() {
      // If dbsetup does not exist, terminate!
      if (!this.$options.dbsetup) return null;
      // Getting DB Setup
      const { dbsetup } = this.$options;
      // Compile the Object and assign it to the instance
      return merge(this, {
        $dbsetup: Object.keys(dbsetup).reduce((db, prop) => merge(db, {
          [prop]: expand(dbsetup[prop] || {}, this)
        }), {})
      });
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

    /**
     * Based on dbsetup object, configure the Database
     */
    function dbCreated() {
      // Compiling this.$options.dbsetup to have local component variables
      $dbsetup.call(this);
      // If dbsetup does not exist, terminate!
      if (!this.$dbsetup) return null;
      // Setting up the database
      return this.$bucket.db(this.$dbsetup.name, this.$dbsetup.options);
    }

    /**
     * Close DB connections when component gets Destroyed
     */
    function dbDestroy() {
      // If dbsetup does not exist, terminate!
      if (!this.$dbsetup) return null;
      // Closing the DB Connection on component destroy
      return this.$bucket.closedb(this.$dbsetup.name);
    }

    // Check Version
    if (version >= 2) {
      const usesInit = Vue.config._lifecycleHooks.indexOf('init') > -1;
      Vue.mixin(usesInit ? {
        init:          bucketInit,
        created:       dbCreated,
        beforeDestroy: dbDestroy
      } : {
        beforeCreate:  bucketInit,
        created:       dbCreated,
        activated:     dbCreated,
        deactivated:   dbDestroy,
        beforeDestroy: dbDestroy
      });
    } else {
      // override init and inject VuePouchDB init procedure
      // for 1.x backwards compatibility.
      const _init = Vue.prototype._init;
      // Initializing the bucket
      Vue.prototype._init = function VueInit(options = {}) {
        options.init = options.init
          ? [bucketInit].concat(options.init)
          : bucketInit;
        _init.call(this, options);
      };
    }
  }
};

/**
 * Making PouchDB Available for Debugging
 */
if (process.env.NODE_ENV !== 'production') {
  window.PouchDB = PouchDB;
}
