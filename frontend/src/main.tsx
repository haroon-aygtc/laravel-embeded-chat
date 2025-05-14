// Import process polyfill first to ensure it's available for Next.js components
import "./polyfills/process";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ToastContainer from "./components/ui/toast-container";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <ToastContainer position="top-right" />
  </React.StrictMode>
);
