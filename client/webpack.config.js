const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
require("dotenv").config({ path: "../.env" });

const BUILD_OUT_ROOT = path.resolve(__dirname, "build");
const SERVER_PORT = process.env.SERVER_PORT || 5370;

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  entry: "./src/index.jsx",
  output: {
    path: BUILD_OUT_ROOT,
  },
  devServer: {
    compress: false,
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
        use: [
          devMode ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
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
      {
        test: /\.png$/i,
        type: "asset/resource",
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/assets/index.html",
      favicon: "src/assets/favicon.ico",
      title: "Stream Recorder",
    }),
  ]
    .concat(devMode ? [] : [new MiniCssExtractPlugin()]),
  resolve: {
    extensions: [".js", ".json", ".jsx"],
  },
};
