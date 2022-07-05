const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
require("dotenv").config({ path: "../.env" });

const BUILD_OUT_ROOT = path.resolve(__dirname, "build");
const SERVER_PORT = process.env.SERVER_PORT || 5370;

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  entry: "./src/index.tsx",
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
          "postcss-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.tsx?$/i,
        use: "ts-loader",
        exclude: /node_modules/,
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
    alias: {
      "@components": path.resolve(__dirname, "src/components"),
      "@constants": path.resolve(__dirname, "src/constants.ts"),
      "@hooks": path.resolve(__dirname, "src/hooks.ts"),
      "@sass": path.resolve(__dirname, "src/sass"),
      "@types": path.resolve(__dirname, "src/types"),
      "@utils": path.resolve(__dirname, "src/utils.ts"),
    },
    extensions: [".tsx", ".ts", ".js", ".json"],
  },
};
