import React from "react";
import classNames from "classnames";

export function Select({
  id,
  label,
  size,
  ...other
}) {
  let out = (
    <select
      className={classNames(
        "form-select",
        size && `form-select--${size}`,
      )}
      id={id}
      {...other}
    >
    </select>
  );

  if (label) out = (
    <div className="form-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      {out}
    </div>
  );

  return out;
}
