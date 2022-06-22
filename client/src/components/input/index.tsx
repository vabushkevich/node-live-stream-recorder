import React from "react";
import classNames from "classnames";

type InputProps = {
  addonAfter?: React.ReactNode;
  addonBefore?: React.ReactNode;
  autoComplete?: string;
  id?: string;
  label?: string;
  max?: string | number;
  min?: string | number;
  name?: string;
  required?: boolean;
  size?: "small";
  type?: React.HTMLInputTypeAttribute;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function Input({
  addonAfter,
  addonBefore,
  id,
  label,
  size,
  ...other
}: InputProps) {
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
