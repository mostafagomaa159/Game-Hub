import React from "react";
import ReactDOM from "react-dom/client";

import Modal from "react-modal";

import App from "./App";
import "./index.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
Modal.setAppElement("#root");
