//this is for the vite config
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  //this is for the react plugin (jsx support)
  plugins: [react()],
  //this is for the dev server (the proxy sends /api calls to express during development)
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
