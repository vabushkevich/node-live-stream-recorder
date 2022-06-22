import React from "react";
import classNames from "classnames";
import "./index.scss";

type ButtonProps = {
  size?: "small";
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
};

export function Button({
  size,
  type = "button",
  ...other
}: ButtonProps) {
  return (
    <button
      className={classNames("button", size && `button--${size}`)}
      type={type}
      {...other}
    >
    </button>
  );
}
