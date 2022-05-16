import React from "react";
import "./index.scss";

export function Card({
  title,
  children,
}) {
  return (
    <div className="card">
      {title && <div className="card-title">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
}
