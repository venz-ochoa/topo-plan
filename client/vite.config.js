//this is for the vite config
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  //this is for the supabase address, so the security policy below only lets the app talk to it
  const env = loadEnv(mode, process.cwd(), "VITE_");
  let host = "";
  try {
    host = new URL(env.VITE_SUPABASE_URL || "").host;
  } catch (e) {
    //this is for a missing or wrong address: the app can then only talk to itself
  }

  //this is for the content security policy: where scripts, styles, fonts, pictures and requests may come from
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'" + (host ? " https://" + host + " wss://" + host : ""),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    //this is for the react plugin (jsx support) and tailwind (the styles)
    //the csp plugin only runs in the production build (the dev server needs inline scripts for hot reload)
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "add-csp",
        apply: "build",
        transformIndexHtml(html) {
          return html.replace(
            "</head>",
            '    <meta http-equiv="Content-Security-Policy" content="' +
              csp +
              '" />\n  </head>',
          );
        },
      },
    ],
    //this is for the dev server (there is no backend of our own, the app talks to supabase directly)
    server: {
      port: 3000,
    },
  };
});
