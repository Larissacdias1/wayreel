import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// WAYREEL.md Section 4 (Stack): Vite + React for the frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    // src/ui/api-client.ts uses relative URLs ("/api/chat", "/api/stream")
    // — without this, they resolve against Vite's own origin (5173), never
    // reaching the Express API (3000), and fail with a 404 that has
    // nothing to do with CORS. Same-origin from the browser's point of
    // view, so no CORS headers needed either.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
