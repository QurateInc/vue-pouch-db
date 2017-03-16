/**
 * Importing
 */
let path    = require('path');
let webpack = require('webpack');

/**
 * Build
 */
module.exports = {
  entry: {
    index: './src/index.js'
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    library: "vue-pouch-db",
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [{
      loader: 'babel-loader',
      test: /\.js$/,
      exclude: /node_modules/
    }]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) }
    })
  ],
  devtool: 'eval-source-map'
};

if (process.env.NODE_ENV === 'production') {
  // Source Maps
  module.exports.devtool = 'source-map';
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
