import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import App from "./ui/App";
import "./ui/tokens.css";
import "./ui/buttons.css";

// MapLibre GL JS v6+ docs (v5-to-v6-migration-guide.md, "setWorkerUrl() is
// bundler-only"): with a bundler, the worker URL can't be auto-detected via
// import.meta.url — it must be set once, before any Map is constructed.
// Runs synchronously here, before React even mounts, so it's guaranteed to
// execute before FlythroughController's dynamic `import("maplibre-gl")`
// (src/cinematic/motion/playback-controller.ts), which only happens later,
// inside a useEffect after a component mounts.
setWorkerUrl(workerUrl);

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
