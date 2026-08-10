import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const stripeKey = env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(stripeKey),
    },
    build: {
      // Reduce chunk size warning threshold (optional)
      chunkSizeWarningLimit: 1000, // 1000 kB
      
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
            'vendor-query': ['@tanstack/react-query', 'zustand'],
            'vendor-payments': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
            'vendor-charts': ['recharts', 'd3-array', 'd3-scale', 'd3-shape'],
            'vendor-markdown': ['react-markdown', 'remark-parse', 'remark-rehype'],
            'vendor-socket': ['socket.io-client', '@socket.io/component-emitter'],
          },
          // Ensure all node_modules are chunked properly
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      // Enable source maps for debugging (optional)
      sourcemap: mode === 'development',
      // Minify for production
      minify: mode === 'production' ? 'esbuild' : false,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        '@tanstack/react-query',
        'zustand',
        'socket.io-client',
      ],
    },
  };
});
