import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        // Bibliothèques dans des fichiers à part : elles restent en cache d’une version à l’autre.
        manualChunks(id) {
          if (id.includes("node_modules/@supabase")) return "supabase";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
        },
      },
    },
  },
});
