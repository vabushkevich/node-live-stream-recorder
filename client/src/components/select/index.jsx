import React from "react";
import classNames from "classnames";

export function Select({
  label,
  size,
  id,
  ...other
}) {
  const selectElem = (
    <select
      className={classNames(
        "form-control",
        size && `form-control--${size}`,
      )}
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
