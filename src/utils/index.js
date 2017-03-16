/**
 * Importing
 */
import sift     from 'sift';
import debounce from 'lodash.debounce';
import merge    from 'lodash.merge';

/**
 * Noop Function
 */
export const noop = () => {};

/**
 * Executes a function based on context, and returns the value
 */
export const expand = (fn, context = null) => {
  return typeof fn === 'function' ? fn.call(context) : fn;
};

/**
 * Maps Databases to an Object list
 * @param queries
 * @returns {*}
 */
export const mapQueries = function mapQueries(queries) {
  return Object.keys(queries).reduce((db, name) => {
    return merge(db, {
      [name]: {
        // Return the filtered results of the anodes
        get: function getterComputedQueries() {
          // If dbsetup does not exist, throw Error!
          if (!this.$dbsetup) throw new Error('[VuePouchDB] dbsetup does not exist!');
          // Setting up the Queries
          // TODO: memoize/cache this function
          return (this.$bucket.state[this.$dbsetup.name] || []).filter(
            sift(expand(queries[name], this) || {})
          );
        },
        // When setting wait 500ms before executing the function
        // also multiple calls to the set, wont cause any major issue
        set: debounce(function setterComputedQueries(value) {
          // If dbsetup does not exist, throw Error!
          if (!this.$dbsetup) throw new Error('[VuePouchDB] dbsetup does not exist!');
          // Adding the Data to the Database
          return this.$bucket
          .db(this.$dbsetup.name)
          // TODO: Check if the Value is an Array
          // and then make sure the final value is an array
          // maybe adding some prop checking
          // or some other checking would be good!
          .bulkDocs(((Array.isArray(value)) ? value : [value]))
          .catch((err) => { throw new Error(`[VuePouchDB] ${err}`); });
        }, 500)
      }
    });
  }, {});
};

/**
 * Binary Search for Arrays
 */
export const binarySearch = (arr, docId) => {
  let low = 0;
  let high = arr.length;
  let mid;
  // Traverse
  while (low < high) {
    mid = (low + high) >>> 1;
    arr[mid]._id < docId ? low = mid + 1 : high = mid;
  }
  return low;
};
