import React from "react";
import { Recording } from "../recording";
import { Card } from "../card";
import "./index.scss";

export function RecordingList({
  recordings,
  onRecordingStop,
  onRecordingProlong,
  onRecordingClose,
}) {
  return (
    <div className="recording-list">
      <Card title="Recorders">
        <ol>
          {recordings.map((recording) => {
            const { id } = recording;
            return (
              <li className="recording-list__item" key={id}>
                <Recording
                  {...recording}
                  onStop={onRecordingStop.bind(null, id)}
                  onProlong={onRecordingProlong.bind(null, id)}
                  onClose={onRecordingClose.bind(null, id)}
                />
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
