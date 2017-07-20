# Vue Pouch DB

![Vue Pouch DB](http://i.imgur.com/rFwZVhr.png)

---

Vue Pouch DB is a VueJS Plugin that binds PouchDB with Vue and keeps
a synchronised state with the database. Has support for Mango queries
which are processed locally within the VuePouchDB state.

#### Install

Install from NPM:

```
npm install vue-pouch-db --save
```

## Usage

Import the Library and Install it into the Vue Instance

```javascript
// Import the Library
import VuePouchDB from 'vue-pouch-db';

// VuePouchDB Instance
Vue.use(VuePouchDB);
```

## Vue Pouch DB Bucket

The bucket is a global config object (schema), that you can set
configurations globally or per database.

Currently the following keys are plugin specific, these keys have
specific functionality in the Bucket Config Object:

* config
* plugins
* actions

---

```javascript
// Bucket - Vue Pouch DB Config Object
// This is a general and fast overview
// How to define bucket initially in the instance
const bucket = new VuePouchDB.Bucket({
  // Main config Object. This is the top level
  // config object. Where global config
  // are shared with each database.
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

    // Global onChange events
    // for each database.
    // The functions here are passed to each DB
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
      // 'cancel' var is a function to be called
      // when something bad happens. It will
      // Cancel the watch event on CouchDB
    }
  },

  // List of PouchDB plugins
  plugins: [
    require('pouchdb-plugin')
  ],

  // Actions are shared across the
  // bucket instance.
  // Think of them as helper methods to bundle
  // several sets of commands into a single method.
  // Can be accessed through this.$bucket.[method name]
  actions: {
    addDoc(arg) {
      // this is $bucket instance
      this.db('projects').({
        _id: 'document_id'
        data: {}
      }, function () {});
    }
  }

  // Databases
  // You can define / instanciate
  // a per database config file.
  // this will put the database into the internal
  // state and also, you can define custom "options"
  // for the database Instance (on: new PouchDB(options))
  _users: {
    // Is remote only ?
    // The _users database lives only
    // in the server, so its only remote
    remoteOnly: true
  },

  // 'projects' key -> Database Name, ex: couchdb.com/projects
  projects: {
    // PouchDB.sync Options
    sync: {
      push: {
        // config for push
      },
      pull: {
        filter: 'projects/by_user',
        query_params: { "name": "sadi" }
      }
    }

  }
});

// Vue Application Startup
const app = new Vue({
  // Include the Bucket Instance
  // into the root Vue application
  bucket,
  methods: {
    // Simple example how to delete a
    // document in CouchDB through VuePouchDB
    // Keep in mind, that the state is synced
    // and when the request is sent to couchdb
    // the state will update the object and
    // add the property _deleted: true
    remove({ _id, _rev }) {
      this.$bucket.db('projects').put({
        _id, _rev,
        _deleted: true
      });
    }
  }
});
```

**For more information regarding the configuration objects, please check
[PouchDB API](https://pouchdb.com/api.html)**

## API

#### this.$bucket

###### Example
```javascript
Vue.component({
  created: {
    // Access the internal VuePouchDB state
    // the internal state is reactive, and any mingling
    // with the state may break the plugin. As it wont
    // be able to track changes.
    this.$bucket.state;

    // Programmatic way to instantiate a database
    // This is the same as setting up dbsetup object
    // into the vue component.
    this.$bucket.db(dbname, options);

    // Close a database, and remove all its watchers
    // and events related to it.
    // Internally it will close the DB, delete the internal
    // state (not the indexDB database locally)
    // remove all the change watchers.
    this.$bucket.closedb(dbname);
  }
});
```
-----

#### this.dbsetup

`Vue({ dbsetup: {} })` is a shorthand method to instantiate a database within
a component, or to have it referenced internally, without the need to
call a method or predefine it in the Bucket config object.

###### Example
```javascript
Vue.component({
  dbsetup: {
    // the database name
    // both keys can take a function
    // that is bound to the component
    // instance
    name: "dbname",
    // the config object
    // When a database is created the "options"
    // key is taken from the context and applied
    // to the database.
    // Note: does not work for already instantiated
    // databases.
    options: {}
  }
});
```
-----

#### mapQueries({})

mapQueries is a functionality built on top of VuePouchDB, which
takes the database state and filters it.

**It mainly works with Mango queries, and uses _*[sift](https://github.com/crcn/sift.js)*_ library
to do the querying of the documents.**

###### Example
```javascript

// Import mapQueries method
import { mapQueries } from 'vue-pouch-db';

// Inside a Vue component
Vue.component({
  template: `<div>{{ this.docs }}, {{ this.files }}</div>`,
  data: function {
    return {
        dbname: 'projects'
    };
  },
  dbsetup: {
    name: function () {
      // 'this' is bound to the component
      // internal state
      return {
        this.dbname;
      };
    },
    options: function () {
      return {};
    }
  },
  computed: {
    ...mapQueries({
      docs: {
        type: 'anode'
      },
      files: function () {
        return {
          file: {
            $in: ['file']
          }
        };
      }
    })
  },
  methods: {
    addDocs: function (_id, data) {
      // You can modify the state
      // internally by assigning data
      // to the internal computed properties
      // and it will update the database automatically
      // Can be an object or an Array of items you
      // would like to update.
      this.docs = {
        _id: _id,
        type: 'anode',
        data: data
      };
    }
  }
});
```

-----

MIT License

Copyright (c) 2017 Sadi Qevani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
