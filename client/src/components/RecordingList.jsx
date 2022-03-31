import React from "react";
import Recording from "./Recording.jsx";

export default function RecordingList({
  recordings,
  onRecordingStop,
  onRecordingProlong,
  onRecordingClose,
}) {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Recorders</h5>
        <ol className="recorder-items m-0 p-0">
          {recordings.map((recording) => (
            <Recording
              {...recording}
              onStop={onRecordingStop}
              onProlong={onRecordingProlong}
              onClose={onRecordingClose}
              key={recording.id}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
