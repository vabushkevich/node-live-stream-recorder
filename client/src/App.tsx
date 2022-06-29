import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { getRecordingName } from "@utils";

import { CreateStreamForm } from "@components/create-stream-form";
import { RecordingList } from "@components/recording-list";
import { Container } from "@components/container";
import { Recording } from "@types";

import { API_BASE_URL } from "@constants";

export function App() {
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    fetchRecordings();

    const eventSource = new EventSource(`${API_BASE_URL}/events`);
    eventSource.addEventListener("recordingupdate", (e) => {
      const { id, ...other } = JSON.parse(e.data);
      updateRecording(id, other);
    });

    return () => eventSource.close();
  }, []);

  function fetchRecordings() {
    fetch(`${API_BASE_URL}/recordings`)
      .then((req) => req.json())
      .then((recordings) => {
        setRecordings(recordings);
      });
  }

  function createRecording(url: string, duration: number, resolution: number) {
    const tmpId = nanoid();
    addRecording({
      id: tmpId,
      url,
      state: "idle",
      targetDuration: duration,
      createdDate: Date.now(),
    });

    fetch(`${API_BASE_URL}/recordings`, {
      method: "POST",
      body: JSON.stringify({
        url,
        duration,
        resolution,
        name: getRecordingName(url),
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((recording) => {
        updateRecording(tmpId, recording);
      });
  }

  function addRecording(recording: Recording) {
    setRecordings((recordings) => ([...recordings, recording]));
  }

  function updateRecording(id: string, update: Partial<Recording>) {
    setRecordings((recordings) => recordings.map((item) =>
      item.id == id ? { ...item, ...update } : item
    ));
  }

  function prolongRecording(id: string, duration: number) {
    setRecordings((recordings) => recordings.map((item) =>
      item.id == id ? { ...item, targetDuration: item.targetDuration + duration } : item
    ));

    fetch(`${API_BASE_URL}/recordings/${id}/prolong?duration=${duration}`, {
      method: "PUT",
    });
  }

  function stopRecording(id: string) {
    setRecordings((recordings) => recordings.map((item) =>
      item.id == id ? { ...item, state: "stopped" } : item
    ));

    fetch(`${API_BASE_URL}/recordings/${id}/stop`, {
      method: "PUT",
    });
  }

  function closeRecording(id: string) {
    setRecordings((recordings) => recordings.filter((item) => item.id != id));

    fetch(`${API_BASE_URL}/recordings/${id}`, {
      method: "DELETE",
    });
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
