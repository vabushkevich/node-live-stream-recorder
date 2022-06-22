import React from "react";
import { Recording } from "@components/recording";
import { Card } from "@components/card";
import { Recording as RecordingType  } from "@types";
import "./index.scss";

type RecordingListProps = {
  recordings: RecordingType[];
  onRecordingClose: (id: string) => void;
  onRecordingProlong: (id: string, duration: number) => void;
  onRecordingStop: (id: string) => void;
};

export function RecordingList({
  recordings,
  onRecordingStop,
  onRecordingProlong,
  onRecordingClose,
}: RecordingListProps) {
  return (
    <div className="recording-list">
      <Card title="Recordings">
        {recordings.length > 0 ? (
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
        ) : (
          <div className="recording-list__placeholder">
            There are no recordings yet... Start one using the form above.
          </div>
        )}
      </Card>
    </div>
  );
}
