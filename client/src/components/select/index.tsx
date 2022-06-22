import React from "react";
import classNames from "classnames";

type SelectProps = {
  id?: string;
  label?: string;
  name?: string;
  size?: "small";
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children?: React.ReactNode;
};

export function Select({
  id,
  label,
  size,
  ...other
}: SelectProps) {
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
