import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Recording from "./components/Recording.jsx";

import { API_URL } from "../constants";

function getSiteName(url) {
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes("twitch.tv")) return "twitch";
}

class App extends React.Component {
  componentDidMount() {
    document.querySelector(".js-record-btn").addEventListener("click", () => {
      const formData = {
        url: document.querySelector(".js-url-input").value,
        duration: document.querySelector(".js-duration-input").value,
      };

      const url = formData.url.trim();
      const siteName = getSiteName(url);
      const duration = formData.duration * 60 * 1000;

      fetch(`${API_URL}/recordings`, {
        method: "POST",
        body: JSON.stringify({
          url,
          duration,
          nameSuffix: siteName,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(() => window.open(document.location.href, "_self"));
    });

    fetch(`${API_URL}/recordings`, {
      method: "GET",
    })
      .then((req) => req.json())
      .then((recordings) => {
        ReactDOM.render(
          <App recordings={recordings} />,
          document.querySelector("#root")
        );
      });
  }

  render() {
    const { recordings = [] } = this.props;

    return (
      <div className="container my-4">
        <div className="row mb-3">
          <div className="col-lg-7">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Record new stream</h5>
                <div className="form-row">
                  <div className="form-group col">
                    <label htmlFor="inputURL">URL</label>
                    <input type="url" className="form-control js-url-input" id="inputURL" />
                  </div>
                  <div className="form-group col-3 col-md-2">
                    <label htmlFor="inputDuration">Minutes</label>
                    <input type="number" min="1" defaultValue="120" className="form-control js-duration-input" id="inputDuration" />
                  </div>
                </div>
                <button type="button" className="btn btn-primary js-record-btn">Record</button>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Recorders</h5>
            <ol className="recorder-items m-0 p-0">
              {recordings.map((recording) => <Recording key={recording.id} {...recording} />)}
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
