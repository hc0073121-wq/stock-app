import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  integrations: [
    react(),
  ],

  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Stock App",
          short_name: "Stocks",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#2563eb",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "192x192",
              type: "image/svg+xml",
            },
          ],
        },
      }),
    ],
  },
});