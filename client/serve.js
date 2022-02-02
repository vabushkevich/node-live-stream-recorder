const express = require('express');
const cors = require('cors');

const { CLIENT_PORT } = require('./constants');
const { STATIC_ROOT } = require('server/constants');

const app = express();

app.use(cors());
app.use(express.static(STATIC_ROOT));

app.listen(
  CLIENT_PORT,
  () => console.log(`Static files are serving from http://localhost:${CLIENT_PORT}/`)
);
