import React from "react";
import "./index.scss";

type BadgeProps = {
  color: "primary" | "secondary" | "dark";
  children?: React.ReactNode;
};

export function Badge({
  color,
  children,
}: BadgeProps) {
  return <span className={`badge badge--${color}`}>{children}</span>;
}
