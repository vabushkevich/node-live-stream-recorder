const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const CLIENT_PORT = process.env.CLIENT_PORT || 3000;

module.exports = {
  CLIENT_PORT,
};
