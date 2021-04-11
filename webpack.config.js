const path = require("path");

const basePath = path.resolve(__dirname);

const PATHS = {
  src: basePath + "/src",
  demo: basePath + "/demo",
};

module.exports = {
  mode: "development",
  entry: PATHS.demo + "/demo.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
      },
      {
        test: /\.glsl$/,
        loader: "raw-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".glsl"],
  },
  output: {
    filename: "demo.js",
    path: PATHS.demo,
  },
  devServer: {
    contentBase: PATHS.demo,
    port: 9001,
  },
};
