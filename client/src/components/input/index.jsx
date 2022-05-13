import React from "react";

export function Input({
  label,
  size,
  id,
  ...other
}) {
  const inputElem = (
    <input
      className={`form-control form-control--${size}`}
      id={id}
      {...other}
    />
  );

  if (label) return (
    <div className="form-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      {inputElem}
    </div>
  );

  return inputElem;
}
