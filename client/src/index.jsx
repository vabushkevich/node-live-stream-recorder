import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import CreateStreamForm from "./components/CreateStreamForm.jsx";
import RecordingList from "./components/RecordingList.jsx";

import { API_BASE_URL } from "../constants";

function getRecordingName(url) {
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes("twitch.tv")) return "twitch";
}

class App extends React.Component {
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

  createRecording(url, duration) {
    fetch(`${API_BASE_URL}/recordings`, {
      method: "POST",
      body: JSON.stringify({
        url,
        duration: duration,
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
      <div className="container my-4">
        <CreateStreamForm onRecordingCreate={this.createRecording} />
        <RecordingList
          recordings={recordings}
          onRecordingStop={this.stopRecording}
          onRecordingProlong={this.prolongRecording}
          onRecordingClose={this.closeRecording}
        />
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.querySelector("#root")
);
