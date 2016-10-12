var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  devtool: debug ? "inline-sourcemap" : null,
  entry: "./js/main.js",
  output: {
    path: __dirname+"/bin/",
    filename: "./scripts.min.js"
  },
  module : {
	  loader: [{
			 test: /\.js$/,
             exclude: /node_modules/,
             loader: 'babel-loader' 
		  }]
  },
  watch: true,
  plugins: debug ? [] : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ],
};