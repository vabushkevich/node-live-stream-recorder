const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const STATIC_ROOT = path.resolve(__dirname, "build");

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
      title: "Stream Recorder",
    }),
  ],
};
