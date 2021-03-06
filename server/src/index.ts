import express from "express";
import cors from "cors";
import { StreamRecorder } from "@services/stream-recorder";
import { mkdirSync } from "fs";
import { RecordingSerialized } from "@types";

import {
  SCREENSHOTS_ROOT,
  SERVER_PORT,
  STATIC_ROOT,
} from "@constants";

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
      resolution: +resolution,
      name,
    }
  );
  recording.start();
  res.send(recording.toJSON());
});

app.put("/api/v1/recordings/:recordingId/stop", (req, res) => {
  const { recordingId } = req.params;
  const recording = recorder.getRecording(recordingId);
  if (recording) recording.stop();
  res.end();
});

app.put("/api/v1/recordings/:recordingId/prolong", (req, res) => {
  const { recordingId } = req.params;
  const { duration } = req.query;
  const recording = recorder.getRecording(recordingId);
  if (recording) recording.prolong(+duration);
  res.end();
});

app.delete("/api/v1/recordings/:recordingId", (req, res) => {
  const { recordingId } = req.params;
  recorder.removeRecording(recordingId);
  res.end();
});

app.get("/api/v1/events", (req, res) => {
  res.set("Content-Type", "text/event-stream");
  let handleRecordingUpdate = (update: RecordingSerialized) => {
    res.write(`event: recordingupdate\n`);
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  };
  recorder.on("recordingupdate", handleRecordingUpdate);
  res.on("close", () => {
    recorder.off("recordingupdate", handleRecordingUpdate);
  });
});

app.listen(SERVER_PORT, () => console.log(`Live stream recorder web server has been started on port ${SERVER_PORT}`));
