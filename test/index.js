/**
 * Assert Library
 */
var assert     = require('assert');
var Vue        = require("../node_modules/vue/dist/vue.common");
var VuePouchDB = require("../dist/index");

/**
 * Plugins
 */
Vue.use(VuePouchDB);

/**
 * Tests
 */
describe('Vue Pouch DB', function() {

  describe('#Vue.use(VuePouchDB)', function() {

    it("should be defined", function () {
      assert(Vue);
      assert(VuePouchDB);
    });

  });
});
