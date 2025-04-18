var webpack = require("webpack"),
  path = require("path"),
  fileSystem = require("fs-extra"),
  env = require("./utils/env"),
  { CleanWebpackPlugin } = require("clean-webpack-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  WriteFilePlugin = require("write-file-webpack-plugin");

// load the secrets
var alias = {
  "react-dom": "@hot-loader/react-dom",
};

var secretsPath = path.join(__dirname, "secrets." + env.NODE_ENV + ".js");

var fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

// Store hot reload entries for the webserver
var notHotReload = ["contentScript"];

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    background: path.join(__dirname, "src", "background.js"),
    contentScript: path.join(__dirname, "src", "pages", "Content", "index.js"),
    inject: path.join(__dirname, "src", "pages", "Content", "inject.js"),
    popup: path.join(__dirname, "src", "pages", "Popup", "index.jsx"),
    pluginManagement: path.join(__dirname, "src", "pages", "PluginManagement", "index.jsx"),
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.(css)$/,
        // in the `src` directory
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
        ],
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        type: "asset/resource",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map(extension => "." + extension)
      .concat([".jsx", ".js", ".css"]),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    // clean the build folder
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: false,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/manifest.json",
          to: path.join(__dirname, "build"),
          force: true,
          transform: function (content) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                ...JSON.parse(content.toString()),
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
              })
            );
          },
        },
        {
          from: "src/pages/Content/content.styles.css",
          to: path.join(__dirname, "build"),
          force: true,
        },
        {
          from: "src/assets/img/icon-34.png",
          to: path.join(__dirname, "build"),
          force: true,
        },
        {
          from: "src/assets/img/icon-128.png",
          to: path.join(__dirname, "build"),
          force: true,
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "pages", "Popup", "index.html"),
      filename: "popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "pages", "PluginManagement", "index.html"),
      filename: "pluginManagement.html",
      chunks: ["pluginManagement"],
    }),
    new WriteFilePlugin(),
  ],
  experiments: {
    topLevelAwait: true,
  },
  devtool: env.NODE_ENV === "development" ? 'source-map' : false,
};

// Export hot reload info for the webserver
exports.notHotReload = notHotReload;

module.exports = options;

