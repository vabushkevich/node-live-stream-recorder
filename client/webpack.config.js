const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
require("dotenv").config({ path: "../.env" });

const BUILD_OUT_ROOT = path.resolve(__dirname, "build");
const SERVER_PORT = process.env.SERVER_PORT || 5370;

module.exports = {
  entry: "./src/index.jsx",
  output: {
    path: BUILD_OUT_ROOT,
  },
  devServer: {
    static: {
      directory: path.join(BUILD_OUT_ROOT, "screenshots"),
      publicPath: "/screenshots",
      watch: false,
    },
    proxy: {
      "/api": `http://localhost:${SERVER_PORT}`,
    },
  },
  module: {
    rules: [
      {
        test: /\.(css|s[ac]ss)$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.jsx$/i,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-react"],
            }
          }
        ]
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      favicon: "src/assets/favicon.ico",
      title: "Stream Recorder",
    }),
  ],
  resolve: {
    extensions: [".js", ".json", ".jsx"],
  },
};
