let path = require("path");
let glob = require("glob");

const shaders = glob.sync(
  path.join(__dirname, "src", "WebGraph", "Shader", "*.glsl")
);

const entry = {};

shaders.forEach(function (p) {
  entry[path.basename(p, ".glsl")] = p;
});

module.exports = {
  mode: "production",
  entry,
  output: {
    path: path.join(__dirname, "lib", "WebGraph", "Shader"),
    filename: "[name].glsl.js",
  },
  module: {
    rules: [
      {
        test: /\.glsl$/,
        loader: "ts-shader-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
