import React from "react";
import { Button } from "@components/button";
import { Input } from "@components/input";
import { Select } from "@components/select";
import { Card } from "@components/card";
import "./index.scss";

export class CreateStreamForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      url: "",
      duration: 120,
      resolution: 10000,
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
      this.state.resolution,
    );
  }

  render() {
    const {
      url,
      duration,
      resolution,
    } = this.state;

    return (
      <div className="create-stream-form">
        <Card title="Record new stream">
          <form onSubmit={this.handleSubmit}>
            <div className="create-stream-form__row">
              <div className="create-stream-form__url">
                <Input
                  autoComplete="off"
                  id="inputURL"
                  label="URL"
                  name="url"
                  required
                  type="url"
                  value={url}
                  onChange={this.handleInputChange}
                />
              </div>
              <div className="create-stream-form__duration">
                <Input
                  id="inputDuration"
                  label="Minutes"
                  min="1"
                  name="duration"
                  required
                  type="number"
                  value={duration}
                  onChange={this.handleInputChange}
                />
              </div>
              <div className="create-stream-form__resolution">
                <Select
                  id="selectResolution"
                  name="resolution"
                  value={resolution}
                  label="Resolution"
                  onChange={this.handleInputChange}
                >
                  <option value="10000">Highest</option>
                  <option value="1080">1080p</option>
                  <option value="720">720p</option>
                  <option value="480">480p</option>
                  <option value="360">360p</option>
                  <option value="0">Lowest</option>
                </Select>
              </div>
              <div>
                <Button type="submit">Record</Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    );
  }
}
