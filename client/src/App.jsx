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
    this.syncRecordings();
    this.startPeriodicSync();
  }

  componentWillUnmount() {
    this.stopPeriodicSync();
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
      .then(() => this.syncRecordings());
  }

  syncRecordings() {
    fetch(`${API_BASE_URL}/recordings`, {
      method: "GET",
    })
      .then((req) => req.json())
      .then((recordings) => {
        this.setState({ recordings });
      });
  }

  stopRecording(id) {
    fetch(`${API_BASE_URL}/recordings/${id}/stop`, {
      method: "PUT",
    })
      .then(() => this.syncRecordings());
  }

  prolongRecording(id, duration) {
    fetch(`${API_BASE_URL}/recordings/${id}/prolong?duration=${duration}`, {
      method: "PUT",
    })
      .then(() => this.syncRecordings());
  }

  closeRecording(id) {
    fetch(`${API_BASE_URL}/recordings/${id}`, {
      method: "DELETE",
    })
      .then(() => this.syncRecordings());
  }

  startPeriodicSync() {
    this.syncInterval = setInterval(() => this.syncRecordings(), 5000);
  }

  stopPeriodicSync() {
    clearInterval(this.syncInterval);
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
