import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('onnxruntime-web')) return 'onnxruntime-web';
            if (id.includes('html2canvas')) return 'html2canvas';
            if (id.includes('@imgly') || id.includes('background-removal')) return 'background-removal';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('jspdf') || id.includes('pdf-lib')) return 'pdf';
            return 'vendor';
          }
        }
      }
    }
  }
})
