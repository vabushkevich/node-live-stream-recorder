import React from "react";
import "./index.scss";

type CloseButtonProps = {
  onClick: (e: React.MouseEvent<Element>) => void;
};

export function CloseButton(props: CloseButtonProps) {
  return (
    <button className="close-btn" {...props}></button>
  );
}
