/**
 * Importing
 */
const PouchDB =  require('pouchdb-browser');

/**
 * Exporting
 **/
module.exports = {
  // Database Cache
  databases: {},

  // Install Plugin
  install(Vue, config = {}) {
    /**
     * Initializing $dbs
     */
    Vue.prototype.$dbs = this.databases;

    /**
     * Remove DBs
     */
    Vue.prototype.$closedb = (name) => {
      return this.databases[name].close((error) => {
        if (error) {
          throw new Error(error);
        }
        return delete this.databases[name];
      });
    };

    /**
     * Initializing $db
     */
    Vue.prototype.$db = (dbname, opts = {}) => {
      if (this.databases[dbname]) {
        return this.databases[dbname];
      }

      const options = Object.assign({
        ajax: { cache: false }
      }, opts);

      if (opts.remoteOnly) {
        this.databases[dbname] = new PouchDB(
          `${config.remote}/${dbname}`,
          options
        );
        return this.databases[dbname];
      }

      this.databases[dbname] = new PouchDB(dbname, options);

      PouchDB.sync(
        dbname,
        `${config.remote}/${dbname}`,
        config.sync
      );

      return this.databases[dbname];
    };

    if (process.env.NODE_ENV !== 'production') {
      if (config.debug === true) {
        PouchDB.debug.enable('*');
        window.PouchDB = PouchDB;
      }
    }
  }
};


