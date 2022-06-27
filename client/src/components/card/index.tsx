import React from "react";
import "./index.scss";

type CardProps = {
  title?: string;
  children?: React.ReactNode;
};

export function Card({
  title,
  children,
}: CardProps) {
  return (
    <div className="card">
      {title && <div className="card__title">{title}</div>}
      <div className="card__body">{children}</div>
    </div>
  );
}
