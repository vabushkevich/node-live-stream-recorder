import React from "react";

export default class CreateStreamForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      url: "",
      duration: 120,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleInputChange({ target: { name, value } }) {
    this.setState({ [name]: value });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.onRecordingCreate(
      this.state.url,
      this.state.duration * 60 * 1000,
    );
  }

  render() {
    const {
      url,
      duration,
    } = this.state;

    return (
      <div className="row mb-3">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Record new stream</h5>
              <form onSubmit={this.handleSubmit}>
                <div className="form-row">
                  <div className="form-group col">
                    <label htmlFor="inputURL">URL</label>
                    <input
                      type="url"
                      className="form-control"
                      id="inputURL"
                      name="url"
                      value={url}
                      onChange={this.handleInputChange}
                    />
                  </div>
                  <div className="form-group col-3 col-md-2">
                    <label htmlFor="inputDuration">Minutes</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      id="inputDuration"
                      name="duration"
                      value={duration}
                      onChange={this.handleInputChange}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Record</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
