import React from "react";

export function Select({
  label,
  size,
  id,
  ...other
}) {
  const selectElem = (
    <select
      className={`form-control form-control--${size}`}
      id={id}
      {...other}
    >
    </select>
  );

  if (label) return (
    <div className="form-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      {selectElem}
    </div>
  );

  return selectElem;
}
