(async () => {
  const express = require('express');
  const cors = require('cors');
  const StreamRecorder = require('lib/StreamRecorder');
  const { mkdirSync } = require('fs');

  const {
    SCREENSHOTS_ROOT,
  } = require('lib/constants');

  const app = express();
  const recorder = new StreamRecorder();
  const port = 8080;

  mkdirSync(SCREENSHOTS_ROOT, { recursive: true });

  app.use(cors());
  app.use(express.json());
  app.use(express.static("./site"));

  app.get("/api/v1/recordings", (req, res) => {
    res.send(recorder.getRecordings());
  });

  app.post("/api/v1/recordings", (req, res) => {
    const { url, duration, nameSuffix } = req.body;
    const recording = recorder.createRecording(url, { targetDuration: +duration, nameSuffix });
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

  app.listen(port, () => console.log(`Live stream recorder web server has been started on port ${port}`));
})();
