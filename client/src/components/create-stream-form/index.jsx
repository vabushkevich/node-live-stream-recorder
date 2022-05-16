import React from "react";
import { Button } from "../button";
import { Input } from "../input";
import { Select } from "../select";
import { Card } from "../card";

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
      <div className="row mb-3">
        <div className="col-lg-7">
          <Card title="Record new stream">
            <form onSubmit={this.handleSubmit}>
              <div className="form-row">
                <div className="form-group col">
                  <Input
                    id="inputURL"
                    label="URL"
                    name="url"
                    type="url"
                    value={url}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-group col-3 col-md-2">
                  <Input
                    id="inputDuration"
                    label="Minutes"
                    min="1"
                    name="duration"
                    type="number"
                    value={duration}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-group col-4 col-md-3">
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
              </div>
              <Button type="submit">Record</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }
}
