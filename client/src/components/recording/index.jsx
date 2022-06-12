import React from "react";
import { capitalize } from "lodash";
import { formatDuration } from "@utils";
import { Button } from "@components/button";
import { CloseButton } from "@components/close-button";
import { Input } from "@components/input";
import { Badge } from "@components/badge";
import { Card } from "@components/card";
import placeholderImage from "./images/thumbnail.png";
import "./index.scss";

export class Recording extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      prolongDuration: 120,
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleProlong = this.handleProlong.bind(this);
  }

  handleInputChange(e) {
    this.setState({ prolongDuration: e.target.value });
  }

  handleProlong() {
    const duration = this.state.prolongDuration * 60 * 1000;
    this.props.onProlong(duration);
  }

  render() {
    const { prolongDuration } = this.state;
    const {
      duration = 0,
      resolution,
      state,
      targetDuration,
      thumbnail = placeholderImage,
      url,
      onClose,
      onStop,
    } = this.props;
    const badgeType = state == "recording" ? "primary" : "secondary";

    return (
      <Card>
        <div className="recording">
          <div className="recording__thumbnail">
            <img src={thumbnail} alt="Thumbnail" />
          </div>
          <div className="recording__body">
            {state == "stopped" && (
              <div className="recording__close-btn">
                <CloseButton onClick={onClose} />
              </div>
            )}
            <div className="recording__head recording__row">
              <div className="recording__title">{url}</div>
              <div className="recording__badges">
                {resolution && (
                  <div className="recording__badge">
                    <Badge color="dark">{resolution}p</Badge>
                  </div>
                )}
                <div className="recording__badge">
                  <Badge color={badgeType}>{capitalize(state)}</Badge>
                </div>
              </div>
            </div>
            <div className="recording__row">
              <b>Recorded:</b> {formatDuration(duration)} / {formatDuration(targetDuration)}
            </div>
            {state != "stopped" && (
              <div className="recording__controls recording__row">
                <div className="recording__stop-btn">
                  <Button size="small" onClick={onStop}>Stop</Button>
                </div>
                <Input
                  addonAfter={
                    <Button size="small" onClick={this.handleProlong}>Prolong</Button>
                  }
                  type="number"
                  min="1"
                  value={prolongDuration}
                  size="small"
                  onChange={this.handleInputChange}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }
}
