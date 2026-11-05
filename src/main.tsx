import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { agentLink } from "./agent";
import "./index.css";

// Opened with #t=... (from Aether or the Windows app): link Aether before the router rewrites the address.
agentLink();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
