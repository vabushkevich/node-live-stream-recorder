const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const { CLIENT_PORT } = require("./constants");

module.exports = {
  output: {
    path: path.resolve(__dirname, "build"),
  },
  devServer: {
    static: "./build/",
    port: CLIENT_PORT,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      favicon: "src/assets/favicon.ico",
    }),
  ],
};
