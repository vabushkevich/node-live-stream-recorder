import React from "react";
import "./index.scss";

export function Button({
  size,
  type = "button",
  ...other
}) {
  return (
    <button
      className={`button button--${size}`}
      type={type}
      {...other}
    >
    </button>
  );
}
