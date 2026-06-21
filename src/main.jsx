import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New application updates available! Reload to apply?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log(
      "App resources successfully cached. App ready for offline use.",
    );
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />,
  </StrictMode>,
);
