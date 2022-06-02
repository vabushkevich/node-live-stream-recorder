import React from "react";

import { CreateStreamForm } from "./components/create-stream-form";
import { RecordingList } from "./components/recording-list";
import { Container } from "./components/container";

import { API_BASE_URL } from "../constants";

function getRecordingName(url) {
  if (url.includes("youtube.com")) {
    const streamId = url.match(/(?<=\/watch\?v=)[\w-]+/)?.[0] || "";
    return `${streamId}@youtube`;
  }
  if (url.includes("twitch.tv")) {
    const userName = url.match(/(?<=twitch\.tv\/)\w+/)?.[0] || "";
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
      .then(() => this.fetchRecordings());
  }

  fetchRecordings() {
    fetch(`${API_BASE_URL}/recordings`)
      .then((req) => req.json())
      .then((recordings) => {
        this.setState({ recordings });
      });
  }

  stopRecording(id) {
    fetch(`${API_BASE_URL}/recordings/${id}/stop`, {
      method: "PUT",
    })
      .then(() => this.fetchRecordings());
  }

  prolongRecording(id, duration) {
    fetch(`${API_BASE_URL}/recordings/${id}/prolong?duration=${duration}`, {
      method: "PUT",
    })
      .then(() => this.fetchRecordings());
  }

  closeRecording(id) {
    fetch(`${API_BASE_URL}/recordings/${id}`, {
      method: "DELETE",
    })
      .then(() => this.fetchRecordings());
  }

  startSSEHandling() {
    this.eventSource = new EventSource(`${API_BASE_URL}/events`);
    this.eventSource.addEventListener("recordingupdate", (e) => {
      this.updateRecording(JSON.parse(e.data));
    });
  }

  stopSSEHandling() {
    this.eventSource.close();
  }

  updateRecording(update) {
    this.setState((state) => ({
      recordings: state.recordings.map((item) =>
        item.id == update.id ? { ...item, ...update } : item
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
