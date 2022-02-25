import React from "react";

export default class Recording extends React.Component {
  constructor(props) {
    super(props);
    this.input = React.createRef();
  }

  render() {
    const stateFormatted = this.props.state[0].toUpperCase() + this.props.state.slice(1);
    const badgeType = this.props.state == "recording" ? "primary" : "secondary";
    const timeLeft = moment.duration(this.props.timeLeft, "ms").format("hh:mm:ss", { trim: false });

    const handleProlong = () => {
      const duration = this.input.current.value * 60 * 1000;
      this.props.onProlong(duration);
    }

    return (
      <li className="card recorder-items__item">
        <div className="card-body position-relative">
          <div className="row no-gutters">
            <div className="col-md col-md-4 col-lg-3 pr-md-3 pb-2 pb-md-0 col-6 mx-auto min-w-0">
              <img src={this.props.screenshotPath} className="rounded w-100" alt="Screenshot" />
            </div>
            <div className="col-md min-w-0">
              <div className="d-flex flex-md-nowrap flex-wrap align-items-center mb-2">
                <h5 className="mr-2 mb-md-0 mb-1 text-truncate">{this.props.url}</h5>
                <div className="d-flex">
                  {this.props.quality && <span className="mr-2 badge badge-dark">{this.props.quality.resolution}p</span>}
                  <span className={`badge badge-${badgeType}`}>{stateFormatted}</span>
                </div>
              </div>
              {timeLeft && <p className={`${this.props.state != "stopped" ? "mb-2" : "mb-0"}`}><b>Left:</b> {timeLeft}</p>}
              {this.props.state != "stopped" && (
                <div className="d-flex flex-row">
                  <button type="button" className="btn mr-1 btn-primary btn-sm js-rec-stop-btn" onClick={this.props.onStop}>Stop</button>
                  <div className="input-group w-auto">
                    <input type="number" min="1" max="999" defaultValue="120" className="form-control form-control-sm js-rec-duration-input" id="inputDuration" ref={this.input} />
                    <div className="input-group-append">
                      <button type="button" className="btn btn-primary btn-sm js-rec-prolong-btn" onClick={handleProlong}>Prolong</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {this.props.state == "stopped" && (
            <button type="button" className="close recording__close-btn js-rec-close-btn" onClick={this.props.onClose}>
              <span>&times;</span>
            </button>
          )}
        </div>
      </li>
    );
  }
}
