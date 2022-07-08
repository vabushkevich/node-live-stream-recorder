import React, { useState } from "react";
import { capitalize } from "lodash-es";
import { formatDuration } from "@utils";
import { Button } from "@components/button";
import { CloseButton } from "@components/close-button";
import { Input } from "@components/input";
import { Badge } from "@components/badge";
import { Card } from "@components/card";
import { Recording as RecordingType } from "@types";
import placeholderImage from "./images/thumbnail.png";
import "./index.scss";

type RecordingProps = RecordingType & {
  onClose: () => void;
  onProlong: (duration: number) => void;
  onStop: () => void;
};

export function Recording({
  duration = 0,
  resolution,
  state,
  targetDuration,
  thumbnail = placeholderImage,
  url,
  onClose,
  onProlong,
  onStop,
}: RecordingProps) {
  const badgeType = state == "recording" ? "primary" : "secondary";
  const [prolongDuration, setProlongDuration] = useState(120);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProlongDuration(Number(e.target.value));
  }

  function handleProlong() {
    const duration = prolongDuration * 60 * 1000;
    onProlong(duration);
  }

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
                  <Button size="small" onClick={handleProlong}>Prolong</Button>
                }
                type="number"
                min="1"
                value={prolongDuration}
                size="small"
                onChange={handleInputChange}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
