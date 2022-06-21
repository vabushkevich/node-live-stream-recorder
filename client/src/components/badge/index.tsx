import React from "react";
import "./index.scss";

export function Badge({
  color,
  children,
}) {
  return <span className={`badge badge--${color}`}>{children}</span>;
}
