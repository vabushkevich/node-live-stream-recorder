import React from "react";
import ReactDOM from "react-dom";

import { App } from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "./sass/_global.scss";
import "./sass/_forms.scss";

ReactDOM.render(
  <App />,
  document.querySelector("#root")
);
