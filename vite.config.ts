import path from "path"
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Custom middleware to handle /api/proxy requests
const proxyMiddleware = (): Plugin => {
  return {
    name: 'proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req: any, res: any, next: any) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing "url" query parameter' }));
            return;
          }

          const fetchOptions: any = {
            method: req.method,
            headers: {
              'Authorization': req.headers['authorization'] || '',
              'Content-Type': req.headers['content-type'] || 'application/json',
              'Content-Disposition': req.headers['content-disposition'] || ''
            }
          };

          if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers);
            if (data.length > 0) {
              fetchOptions.body = data;
            }
          }

          const response = await fetch(targetUrl, fetchOptions);

          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } else {
            const text = await response.text();
            res.statusCode = response.status;
            res.end(text);
          }

        } catch (error: any) {
          console.error('Proxy error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to fetch from target URL', details: error.message }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), proxyMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/proxy-wc': {
        target: 'https://stillgerjeans.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-wc/, ''),
      },
    },
  },
})
