const express = require('express');
const cors = require('cors');
const StreamRecorder = require('server/StreamRecorder');
const { mkdirSync } = require('fs');

const {
  SCREENSHOTS_ROOT,
  SERVER_PORT,
  STATIC_ROOT,
} = require('server/constants');

const app = express();
const recorder = new StreamRecorder();

mkdirSync(SCREENSHOTS_ROOT, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(STATIC_ROOT));

app.get("/api/v1/recordings", (req, res) => {
  res.send(recorder.getRecordings());
});

app.post("/api/v1/recordings", (req, res) => {
  const { url, duration, resolution, name } = req.body;
  const recording = recorder.createRecording(
    url,
    {
      duration: +duration,
      quality: { height: +resolution },
      name,
    }
  );
  recording.start();
  res.send(recording.id);
});

app.put("/api/v1/recordings/:recordingId/stop", (req, res) => {
  const { recordingId } = req.params;
  recorder.getRecording(recordingId).stop();
  res.end();
});

app.put("/api/v1/recordings/:recordingId/prolong", (req, res) => {
  const { recordingId } = req.params;
  const { duration } = req.query;
  recorder.getRecording(recordingId).prolong(+duration);
  res.end();
});

app.delete("/api/v1/recordings/:recordingId", (req, res) => {
  const { recordingId } = req.params;
  recorder.removeRecording(recordingId);
  res.end();
});

app.listen(SERVER_PORT, () => console.log(`Live stream recorder web server has been started on port ${SERVER_PORT}`));
