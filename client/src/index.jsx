import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import Recording from "./components/Recording.jsx";

import { API_BASE_URL } from "../constants";

function getSiteName(url) {
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes("twitch.tv")) return "twitch";
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recordings: [],
      url: "",
      duration: 120,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.syncRecordings();
    this.startPeriodicSync();
  }

  componentWillUnmount() {
    this.stopPeriodicSync();
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    fetch(`${API_BASE_URL}/recordings`, {
      method: "POST",
      body: JSON.stringify({
        url: this.state.url,
        duration: this.state.duration * 60 * 1000,
        nameSuffix: getSiteName(this.state.url),
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

  handleRecordingStop(id) {
    fetch(`${API_BASE_URL}/recordings/${id}/stop`, {
      method: "PUT",
    })
      .then(() => this.syncRecordings());
  }

  handleRecordingProlong(id, duration) {
    fetch(`${API_BASE_URL}/recordings/${id}/prolong?duration=${duration}`, {
      method: "PUT",
    })
      .then(() => this.syncRecordings());
  }

  handleRecordingClose(id) {
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
        <div className="row mb-3">
          <div className="col-lg-7">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Record new stream</h5>
                <form onSubmit={this.handleSubmit}>
                  <div className="form-row">
                    <div className="form-group col">
                      <label htmlFor="inputURL">URL</label>
                      <input type="url" className="form-control" id="inputURL" name="url" value={this.state.url} onChange={this.handleInputChange} />
                    </div>
                    <div className="form-group col-3 col-md-2">
                      <label htmlFor="inputDuration">Minutes</label>
                      <input type="number" min="1" className="form-control" id="inputDuration" name="duration" value={this.state.duration} onChange={this.handleInputChange} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">Record</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Recorders</h5>
            <ol className="recorder-items m-0 p-0">
              {recordings.map((recording) => (
                <Recording
                  {...recording}
                  onStop={this.handleRecordingStop.bind(this, recording.id)}
                  onProlong={this.handleRecordingProlong.bind(this, recording.id)}
                  onClose={this.handleRecordingClose.bind(this, recording.id)}
                  key={recording.id}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.querySelector("#root")
);
