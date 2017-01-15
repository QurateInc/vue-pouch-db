/**
 * Importing
 */
var PouchDB =  require('pouchdb-browser');

/**
 * Exporting
 **/
module.exports = {
  // Database Cache
  databases: {},

  // Install Plugin
  install: function install(Vue, config) {
    var this$1 = this;
    if ( config === void 0 ) config = {};

    /**
     * Initializing $dbs
     */
    Vue.prototype.$dbs = this.databases;

    /**
     * Remove DBs
     */
    Vue.prototype.$closedb = function (name) {
      return this$1.databases[name].close(function (error) {
        if (error) {
          throw new Error(error);
        }
        return delete this$1.databases[name];
      });
    };

    /**
     * Initializing $db
     */
    Vue.prototype.$db = function (dbname, opts) {
      if ( opts === void 0 ) opts = {};

      if (this$1.databases[dbname]) {
        return this$1.databases[dbname];
      }

      var options = Object.assign({
        ajax: { cache: false }
      }, opts);

      if (opts.remoteOnly) {
        this$1.databases[dbname] = new PouchDB(
          ((config.remote) + "/" + dbname),
          options
        );
        return this$1.databases[dbname];
      }

      this$1.databases[dbname] = new PouchDB(dbname, options);

      PouchDB.sync(
        dbname,
        ((config.remote) + "/" + dbname),
        config.sync
      );

      return this$1.databases[dbname];
    };

    if (process.env.NODE_ENV !== 'production') {
      if (config.debug === true) {
        PouchDB.debug.enable('*');
        window.PouchDB = PouchDB;
      }
    }
  }
};


