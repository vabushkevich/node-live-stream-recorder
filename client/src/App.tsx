import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTypedSelector } from "./hooks";
import * as actions from "./store/recorder/actions";

import { CreateStreamForm } from "@components/create-stream-form";
import { RecordingList } from "@components/recording-list";
import { Container } from "@components/container";

import { API_BASE_URL } from "@constants";

export function App() {
  const recordings = useTypedSelector((state) => state.recordings);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(actions.fetchRecordings());

    const eventSource = new EventSource(`${API_BASE_URL}/events`);
    eventSource.addEventListener("recordingupdate", (e) => {
      const { id, ...other } = JSON.parse(e.data);
      dispatch(actions.updateRecording(id, other));
    });

    return () => eventSource.close();
  }, []);

  function createRecording(url: string, duration: number, resolution: number) {
    dispatch(actions.createRecording(url, duration, resolution));
  }

  function prolongRecording(id: string, duration: number) {
    dispatch(actions.prolongRecording(id, duration));
  }

  function stopRecording(id: string) {
    dispatch(actions.stopRecording(id));
  }

  function closeRecording(id: string) {
    dispatch(actions.closeRecording(id));
  }

  return (
    <Container>
      <CreateStreamForm onRecordingCreate={createRecording} />
      <RecordingList
        recordings={recordings}
        onRecordingStop={stopRecording}
        onRecordingProlong={prolongRecording}
        onRecordingClose={closeRecording}
      />
    </Container>
  );
}
