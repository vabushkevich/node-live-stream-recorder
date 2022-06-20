import React, { useState } from "react";
import { Button } from "@components/button";
import { Input } from "@components/input";
import { Select } from "@components/select";
import { Card } from "@components/card";
import "./index.scss";

export function CreateStreamForm(props) {
  const { onRecordingCreate } = props;
  const [formData, setFormData] = useState({
    url: "",
    duration: 120,
    resolution: 10000,
  });

  function handleInputChange({ target: { name, value } }) {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  function handleSubmit(e) {
    e.preventDefault();
    onRecordingCreate(
      formData.url,
      formData.duration * 60 * 1000,
      formData.resolution,
    );
  }

  return (
    <div className="create-stream-form">
      <Card title="Record new stream">
        <form onSubmit={handleSubmit}>
          <div className="create-stream-form__row">
            <div className="create-stream-form__url">
              <Input
                autoComplete="off"
                id="inputURL"
                label="URL"
                name="url"
                required
                type="url"
                value={formData.url}
                onChange={handleInputChange}
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
                value={formData.duration}
                onChange={handleInputChange}
              />
            </div>
            <div className="create-stream-form__resolution">
              <Select
                id="selectResolution"
                name="resolution"
                value={formData.resolution}
                label="Resolution"
                onChange={handleInputChange}
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
