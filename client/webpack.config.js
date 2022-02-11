const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin } = require("webpack");

const { CLIENT_PORT } = require("./constants");
const {
  SERVER_HOSTNAME,
  SERVER_PORT,
  STATIC_ROOT,
} = require("server/constants");

module.exports = {
  entry: "./src/index.jsx",
  output: {
    path: STATIC_ROOT,
  },
  devServer: {
    static: {
      directory: path.join(STATIC_ROOT, "screenshots"),
      publicPath: "/screenshots",
      watch: false,
    },
    port: CLIENT_PORT,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
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
    }),
    new DefinePlugin({
      'process.env.SERVER_HOSTNAME': JSON.stringify(SERVER_HOSTNAME),
      'process.env.SERVER_PORT': JSON.stringify(SERVER_PORT),
    }),
  ],
};