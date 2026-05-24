// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })



import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // pdfjs-dist v5 is pure ESM and manages its own worker.
    // Excluding it prevents Vite from rewriting its internals
    // which breaks the worker MIME type and module resolution.
    exclude: ["pdfjs-dist"],
  },
});