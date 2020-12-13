const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Readable } = require('stream');
const fs = require('fs');

express()
  .use(cors())
  .use(bodyParser.raw({ limit: "100mb" }))
  .post("/", (req, res) => {
    const fileStream = fs.createWriteStream(`C:\\Users\\User\\Desktop\\${req.query.date}.mkv`, { flags: "a" });
    Readable.from(req.body).pipe(fileStream).on("finish", () => res.end());
    console.log(`Got data for ${req.query.date}`);
  })
  .listen(1100);
