//this is for the vite config
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  //this is for the react plugin (jsx support) and tailwind (the styles)
  plugins: [react(), tailwindcss()],
  //this is for the dev server (the proxy sends /api calls to express during development)
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
