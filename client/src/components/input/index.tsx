import React from "react";
import classNames from "classnames";

export function Input({
  addonAfter,
  addonBefore,
  id,
  label,
  size,
  ...other
} : any) {
  let out = (
    <input
      className={classNames(
        "form-control",
        size && `form-control--${size}`,
        addonBefore && "form-control--has-addon-before",
        addonAfter && "form-control--has-addon-after",
      )}
      id={id}
      {...other}
    />
  );

  if (addonBefore || addonAfter) out = (
    <div className="input-group">
      {addonBefore}{out}{addonAfter}
    </div>
  );

  if (label) out = (
    <div className="form-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      {out}
    </div>
  );

  return out;
}
