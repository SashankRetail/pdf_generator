const path = require("path");
const nodeExternals = require("webpack-node-externals");
const NodemonPlugin = require("nodemon-webpack-plugin");

const { NODE_ENV = "production" } = process.env;

module.exports = {
  context: __dirname,
  mode: NODE_ENV,
  entry: "./src/index.ts",
  devtool: NODE_ENV === "production" ? "" : "inline-source-map",
  resolve: {
    extensions: [".mjs", ".json", ".ts"],
    symlinks: false,
    cacheWithContext: false,
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, "build"),
    filename: "index.js",
  },
  target: "node",
  externals: [nodeExternals()],
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.(tsx?)$/,
        loader: "ts-loader",
        exclude: [
          [
            path.resolve(__dirname, "node_modules"),
            path.resolve(__dirname, ".serverless"),
            path.resolve(__dirname, "build"),
          ],
        ],
        options: {
          transpileOnly: true,
          experimentalWatchApi: true,
        },
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
    ],
  },
  plugins: [new NodemonPlugin()],
};
