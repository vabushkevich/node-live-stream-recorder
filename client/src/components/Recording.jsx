import React from "react";
import { capitalize } from "lodash";
import { formatDuration } from "../utils";

export default class Recording extends React.Component {
  constructor(props) {
    super(props);
    this.input = React.createRef();
  }

  render() {
    const badgeType = this.props.state == "recording" ? "primary" : "secondary";

    const handleProlong = () => {
      const duration = this.input.current.value * 60 * 1000;
      this.props.onProlong(duration);
    }

    return (
      <li className="card recorder-items__item">
        <div className="card-body position-relative">
          <div className="row no-gutters">
            <div className="col-md col-md-4 col-lg-3 pr-md-3 pb-2 pb-md-0 col-6 mx-auto min-w-0">
              <img src={`${this.props.screenshotPath}?${Date.now()}`} className="rounded w-100" alt="Screenshot" />
            </div>
            <div className="col-md min-w-0">
              <div className="d-flex flex-md-nowrap flex-wrap align-items-center mb-2">
                <h5 className="mr-2 mb-md-0 mb-1 text-truncate">{this.props.url}</h5>
                <div className="d-flex">
                  {this.props.quality && <span className="mr-2 badge badge-dark">{this.props.quality.resolution}p</span>}
                  <span className={`badge badge-${badgeType}`}>{capitalize(this.props.state)}</span>
                </div>
              </div>
              {this.props.timeLeft > 0 && <p className={`${this.props.state != "stopped" ? "mb-2" : "mb-0"}`}><b>Left:</b> {formatDuration(this.props.timeLeft)}</p>}
              {this.props.state != "stopped" && (
                <div className="d-flex flex-row">
                  <button type="button" className="btn mr-1 btn-primary btn-sm" onClick={this.props.onStop}>Stop</button>
                  <div className="input-group w-auto">
                    <input type="number" min="1" max="999" defaultValue="120" className="form-control form-control-sm" ref={this.input} />
                    <div className="input-group-append">
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleProlong}>Prolong</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {this.props.state == "stopped" && (
            <button type="button" className="close recording__close-btn" onClick={this.props.onClose}>
              <span>&times;</span>
            </button>
          )}
        </div>
      </li>
    );
  }
}
