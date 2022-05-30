import React from "react";
import classNames from "classnames";
import "./index.scss";

export function Button({
  size,
  type = "button",
  ...other
}) {
  return (
    <button
      className={classNames("button", size && `button--${size}`)}
      type={type}
      {...other}
    >
    </button>
  );
}
