/**
 * Importing
 */
import sift  from 'sift';
import merge from 'lodash.merge';

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
      [name]: function computedQueries() {
        // If dbsetup does not exist, throw Error!
        if (!this.$dbsetup) throw new Error('[VuePouch] dbsetup{} does not exist!');
        // Setting up the Queries
        return (this.$bucket.state[expand(this.$dbsetup.name, this)] || []).filter(
          sift(expand(queries[name], this) || {})
        );
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
  // traverse
  while (low < high) {
    mid = (low + high) >>> 1;
    arr[mid]._id < docId ? low = mid + 1 : high = mid;
  }
  return low;
};
