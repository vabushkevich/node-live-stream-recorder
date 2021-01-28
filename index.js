const express = require('express');
const cors = require('cors');
const StreamRecorder = require('lib/StreamRecorder');

const app = express();
const recorders = [];

function getRecorder(id) {
  return recorders.find(v => v.id === id);
}

app.use(cors());
app.use(express.json());
app.use(express.static("./site"));

app.get("/api/v1/recorders", (req, res) => {
  res.send(recorders);
});

app.post("/api/v1/recorders", (req, res) => {
  const recorder = new StreamRecorder(req.body.url, +req.body.duration);
  recorder.start()
    .catch(() => console.log(`Error while starting recorder ${recorder.name}`));
  recorders.push(recorder);
  res.send(recorder.id);
});

app.put("/api/v1/recorders/:recorderId/stop", (req, res) => {
  getRecorder(req.params.recorderId).stop();
  res.end();
});

app.put("/api/v1/recorders/:recorderId/prolong", (req, res) => {
  getRecorder(req.params.recorderId).prolong(+req.query.duration);
  res.end();
});

app.delete("/api/v1/recorders/:recorderId", (req, res) => {
  const { recorderId } = req.params;
  recorders.splice(recorders.findIndex(rec => rec.id == recorderId), 1);
  res.end();
});

app.listen(80, () => console.log("Live stream recorder web server has been started"));
