/**
 * Assert Library
 */
var assert = require('assert');

/**
 * Libraries
 */
var Vue      = require("vue");
var VuePouch = require("../index");

Vue.use(VuePouch, {
  remote: "http://localhost:5984",
  sync: {
    live: true,
    retry: true
  }
});

/**
 * Tests
 */
describe('vue-pouch-db', function() {
  describe('#Vue.use(VuePouch, {})', function() {
    it("should be defined", function () {
      assert(Vue);
      assert(VuePouch);
    });

    it("should define bindings for vue", function () {
      assert(Vue.prototype.$db);
      assert(Vue.prototype.$dbs);
      assert(Vue.prototype.$removedb);
    });
  });
});
