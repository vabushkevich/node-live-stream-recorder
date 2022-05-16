import React from "react";
import { Recording } from "../recording";
import { Card } from "../card";

export function RecordingList({
  recordings,
  onRecordingStop,
  onRecordingProlong,
  onRecordingClose,
}) {
  return (
    <Card title="Recorders">
      <ol className="recorder-items m-0 p-0">
        {recordings.map((recording) => {
          const { id } = recording;
          return <Recording
            {...recording}
            onStop={onRecordingStop.bind(null, id)}
            onProlong={onRecordingProlong.bind(null, id)}
            onClose={onRecordingClose.bind(null, id)}
            key={id}
          />
        })}
      </ol>
    </Card>
  );
}
