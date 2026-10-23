import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Page from "../app/page";
import "../app/globals.css";

// Static entry for GitHub Pages: renders the same client page without the Cloudflare server.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
