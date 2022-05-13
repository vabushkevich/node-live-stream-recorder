import React from "react";
import { capitalize } from "lodash";
import { formatDuration } from "../../utils";
import { Button } from "../button";
import { CloseButton } from "../close-button";
import { Input } from "../input";

export function Recording({
  resolution,
  screenshotURL,
  state,
  timeLeft,
  url,
  onClose,
  onProlong,
  onStop,
}) {
  const inputRef = React.createRef();
  const badgeType = state == "recording" ? "primary" : "secondary";

  const handleProlong = () => {
    const duration = inputRef.current.value * 60 * 1000;
    onProlong(duration);
  }

  return (
    <li className="card recorder-items__item">
      <div className="card-body position-relative">
        <div className="row no-gutters">
          <div className="col-md col-md-4 col-lg-3 pr-md-3 pb-2 pb-md-0 col-6 mx-auto min-w-0">
            <img
              src={`${screenshotURL}?${Date.now()}`}
              className="rounded w-100"
              alt="Screenshot"
            />
          </div>
          <div className="col-md min-w-0">
            <div className="d-flex flex-md-nowrap flex-wrap align-items-center mb-2">
              <h5 className="mr-2 mb-md-0 mb-1 text-truncate">{url}</h5>
              <div className="d-flex">
                {resolution && <span className="mr-2 badge badge-dark">{resolution}p</span>}
                <span className={`badge badge-${badgeType}`}>{capitalize(state)}</span>
              </div>
            </div>
            {timeLeft > 0 && (
              <p className={`${state != "stopped" ? "mb-2" : "mb-0"}`}>
                <b>Left:</b> {formatDuration(timeLeft)}
              </p>
            )}
            {state != "stopped" && (
              <div className="d-flex flex-row">
                <Button size="small" onClick={onStop}>Stop</Button>
                <div className="input-group w-auto">
                  <Input
                    type="number"
                    min="1"
                    defaultValue="120"
                    size="small"
                  />
                  <div className="input-group-append">
                    <Button size="small" onClick={handleProlong}>Prolong</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {state == "stopped" && (
          <div className="recording__close-btn">
            <CloseButton onClick={onClose} />
          </div>
        )}
      </div>
    </li>
  );
}
