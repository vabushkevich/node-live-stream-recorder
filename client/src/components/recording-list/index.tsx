import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "../../hooks";
import {
  fetchRecordings,
  updateRecording,
  stopRecording,
  prolongRecording,
  removeRecording,
} from "../../store/recorder/actions";

import { Recording } from "@components/recording";
import { Card } from "@components/card";
import "./index.scss";

import { API_BASE_URL } from "@constants";

export function RecordingList() {
  const recordings = useTypedSelector((state) => state.recordings);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchRecordings());

    const eventSource = new EventSource(`${API_BASE_URL}/events`);
    eventSource.addEventListener("recordingupdate", (e) => {
      const { id, ...other } = JSON.parse(e.data);
      dispatch(updateRecording(id, other));
    });

    return () => eventSource.close();
  }, []);

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
                    onStop={() => dispatch(stopRecording(id))}
                    onProlong={(duration) => dispatch(prolongRecording(id, duration))}
                    onClose={() => dispatch(removeRecording(id))}
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
