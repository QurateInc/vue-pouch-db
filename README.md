# vue-pouch-db

[Vue.js](http://vuejs.com/) plugin that adds [PouchDB](http://pouchdb.com/)
to your Vue.js apps.

This plugin will cache the instance of the database, and use that connection
every time you call it inside a component in VueJS.

The connection will also create a "sync" between the remote and local database.

You can close the databases, which will in turn close the connection and
remove the database from the cache.

Note: The only dependency of the plugin is 'pouchdb-browser'

#### Install

Install from NPM:

```
npm install vue-pouch-db --save
```

## Usage

```
import VuePouch from 'vue-pouch-db';

Vue.use(VuePouch, {
  remote: "http://localhost:5984",
  sync: {
    live:  true,
    retry: true
  }
});
```

## API

##### Vue.prototype.$db

The Vue.$db will create an instance of the database, given the parameter *_name_*

###### Example
```
// The instance of the DB
const db = Vue.prototype.$db("dbname");

// Fetch all docs of the DB.
db.allDocs({});
```
-----

##### Vue.prototype.$dbs
The property provies the list of Databases in the object cache,
if you need to access them from some other component where the DB is not initialized.

###### Example
```
const dbList = Vue.prototype.$dbs;

console.log(dbList) // { "dbname": [Instance of the DB] }
```
-----

##### Vue.prototype.$closedb
This function will close a connection with the database, and remove
the database reference from the cache object.

Note: In case there's an error when closing the db the function will
throw an error.

###### Example
```
Vue.prototype.$closedb("dbname");
```

## Notes

Keep in mind that you can access the instances both from inside components
through the context,

```
export default {
    created() {
      this.$db("dbname");
    }
};
```


and from the instance of your app
```
const app = new Vue({});

app.$db("dbname");
```
