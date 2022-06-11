import React from "react";
import { nanoid } from "nanoid";

import { CreateStreamForm } from "./components/create-stream-form";
import { RecordingList } from "./components/recording-list";
import { Container } from "./components/container";

import { API_BASE_URL } from "../constants";

function getRecordingName(url) {
  if (url.includes("youtube.com")) {
    const streamId = url.match(/(?:\/watch\?v=)([\w-]+)/)?.[1] || "";
    return `${streamId}@youtube`;
  }
  if (url.includes("twitch.tv")) {
    const userName = url.match(/(?:twitch\.tv\/)(\w+)/)?.[1] || "";
    return `${userName}@twitch`;
  }
}

export class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recordings: [],
    };

    this.createRecording = this.createRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.prolongRecording = this.prolongRecording.bind(this);
    this.closeRecording = this.closeRecording.bind(this);
  }

  componentDidMount() {
    this.fetchRecordings();
    this.startSSEHandling();
  }

  componentWillUnmount() {
    this.stopSSEHandling();
  }

  createRecording(url, duration, resolution) {
    const tmpId = nanoid();
    this.addRecording({
      id: tmpId,
      url,
      state: "idle",
      targetDuration: duration,
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
        this.updateRecording(tmpId, recording);
      });
  }

  fetchRecordings() {
    fetch(`${API_BASE_URL}/recordings`)
      .then((req) => req.json())
      .then((recordings) => {
        this.setState({ recordings });
      });
  }

  addRecording(recording) {
    this.setState((state) => ({
      recordings: [...state.recordings, recording]
    }));
  }

  stopRecording(id) {
    this.setState((state) => ({
      recordings: state.recordings.map((item) =>
        item.id == id ? { ...item, state: "stopped" } : item
      )
    }));

    fetch(`${API_BASE_URL}/recordings/${id}/stop`, {
      method: "PUT",
    });
  }

  prolongRecording(id, duration) {
    this.setState((state) => ({
      recordings: state.recordings.map((item) =>
        item.id == id ? { ...item, targetDuration: item.targetDuration + duration } : item
      )
    }));

    fetch(`${API_BASE_URL}/recordings/${id}/prolong?duration=${duration}`, {
      method: "PUT",
    });
  }

  closeRecording(id) {
    this.setState((state) => ({
      recordings: state.recordings.filter((item) => item.id != id)
    }));

    fetch(`${API_BASE_URL}/recordings/${id}`, {
      method: "DELETE",
    });
  }

  startSSEHandling() {
    this.eventSource = new EventSource(`${API_BASE_URL}/events`);
    this.eventSource.addEventListener("recordingupdate", (e) => {
      const { id, ...other } = JSON.parse(e.data);
      this.updateRecording(id, other);
    });
  }

  stopSSEHandling() {
    this.eventSource.close();
  }

  updateRecording(id, update) {
    this.setState((state) => ({
      recordings: state.recordings.map((item) =>
        item.id == id ? { ...item, ...update } : item
      )
    }));
  }

  render() {
    const { recordings } = this.state;

    return (
      <Container>
        <CreateStreamForm onRecordingCreate={this.createRecording} />
        <RecordingList
          recordings={recordings}
          onRecordingStop={this.stopRecording}
          onRecordingProlong={this.prolongRecording}
          onRecordingClose={this.closeRecording}
        />
      </Container>
    );
  }
}
