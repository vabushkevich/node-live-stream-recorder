import React from "react";
import ReactDOM from "react-dom";

import { App } from "./App";

import "normalize.css";
import "./sass/_global.scss";
import "./sass/_forms.scss";
import "./sass/_typography.scss";

ReactDOM.render(
  <App />,
  document.querySelector("#root")
);
