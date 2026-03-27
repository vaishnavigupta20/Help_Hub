// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // remove index.css import
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: performance monitoring
reportWebVitals();