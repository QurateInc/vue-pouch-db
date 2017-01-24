/**
 * Binary Search for Arrays
 */
export const binarySearch = (arr, docId) => {
  let low = 0, high = arr.length, mid;
  while (low < high) {
    mid = (low + high) >>> 1;
    arr[mid]._id < docId ? low = mid + 1 : high = mid
  }
  return low;
};

export const noop = () => {};
