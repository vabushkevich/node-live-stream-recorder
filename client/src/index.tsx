import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { store } from "./store";

import { App } from "./App";

import "normalize.css";
import "@sass/_global.scss";
import "@sass/_forms.scss";
import "@sass/_typography.scss";

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector("#root")
);
