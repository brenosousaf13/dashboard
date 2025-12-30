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

// Custom middleware to handle /api/sync requests locally
const syncMiddleware = (): Plugin => {
  return {
    name: 'sync-middleware',
    configureServer(server) {
      server.middlewares.use('/api/sync', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          // Read body
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const body = JSON.parse(Buffer.concat(buffers).toString());
          const { type, full, userId } = body;

          // We need to import createClient dynamically or use fetch to call Supabase REST API
          // Since we are in Node, we can use supabase-js if installed
          // But we need env vars. Vite loads them.
          const { createClient } = await import('@supabase/supabase-js');
          const { loadEnv } = await import('vite');

          const env = loadEnv('development', process.cwd(), '');
          const supabaseUrl = env.VITE_SUPABASE_URL;
          const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase env vars');
          }

          const supabase = createClient(supabaseUrl, supabaseKey);

          // --- SYNC LOGIC COPIED FROM api/sync.ts ---
          // Get User Profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileError || !profile) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Profile not found' }));
            return;
          }

          // Log Start
          const { data: logData } = await supabase
            .from('sync_logs')
            .insert({ user_id: userId, type: type || 'all', status: 'started' })
            .select().single();
          const logId = logData?.id;

          const fetchWoo = async (endpoint: string, params: URLSearchParams) => {
            const url = `${profile.woocommerce_url.replace(/\/$/, '')}/wp-json/wc/v3${endpoint}?${params.toString()}`;
            const auth = Buffer.from(`${profile.woocommerce_consumer_key}:${profile.woocommerce_consumer_secret}`).toString('base64');
            const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}` } });
            if (!response.ok) throw new Error(`WooCommerce API Error: ${response.status}`);
            return await response.json();
          };

          let itemsProcessed = 0;

          // Orders
          if (type === 'orders' || type === 'all') {
            let page = 1;
            let hasMore = true;
            while (hasMore) {
              const params = new URLSearchParams();
              params.append('per_page', '100');
              params.append('page', page.toString());
              if (!full) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                params.append('after', yesterday.toISOString());
              }
              const orders: any[] = await fetchWoo('/orders', params) as any;
              if (orders.length > 0) {
                const upsertData = orders.map((order: any) => ({
                  user_id: userId,
                  wc_id: order.id,
                  status: order.status,
                  total: order.total,
                  date_created: order.date_created,
                  customer_id: order.customer_id,
                  line_items: order.line_items,
                  raw_data: order,
                  updated_at: new Date().toISOString()
                }));
                await supabase.from('wc_orders').upsert(upsertData, { onConflict: 'user_id, wc_id' });
                itemsProcessed += orders.length;
                if (orders.length < 100) hasMore = false; else page++;
              } else hasMore = false;
            }
          }

          // Products
          if (type === 'products' || type === 'all') {
            let page = 1;
            let hasMore = true;
            while (hasMore) {
              const params = new URLSearchParams();
              params.append('per_page', '100');
              params.append('page', page.toString());
              const products: any[] = await fetchWoo('/products', params) as any;
              if (products.length > 0) {
                const upsertData = products.map((product: any) => ({
                  user_id: userId,
                  wc_id: product.id,
                  name: product.name,
                  type: product.type,
                  status: product.status,
                  price: product.price,
                  regular_price: product.regular_price,
                  sale_price: product.sale_price,
                  stock_status: product.stock_status,
                  stock_quantity: product.stock_quantity,
                  images: product.images,
                  raw_data: product,
                  updated_at: new Date().toISOString()
                }));
                await supabase.from('wc_products').upsert(upsertData, { onConflict: 'user_id, wc_id' });
                itemsProcessed += products.length;
                if (products.length < 100) hasMore = false; else page++;
              } else hasMore = false;
            }
          }

          // Customers
          if (type === 'customers' || type === 'all') {
            let page = 1;
            let hasMore = true;
            while (hasMore) {
              const params = new URLSearchParams();
              params.append('per_page', '100');
              params.append('page', page.toString());
              const customers: any[] = await fetchWoo('/customers', params) as any;
              if (customers.length > 0) {
                const upsertData = customers.map((customer: any) => ({
                  user_id: userId,
                  wc_id: customer.id,
                  email: customer.email,
                  first_name: customer.first_name,
                  last_name: customer.last_name,
                  role: customer.role,
                  avatar_url: customer.avatar_url,
                  total_spent: customer.total_spent,
                  orders_count: customer.orders_count,
                  raw_data: customer,
                  updated_at: new Date().toISOString()
                }));
                await supabase.from('wc_customers').upsert(upsertData, { onConflict: 'user_id, wc_id' });
                itemsProcessed += customers.length;
                if (customers.length < 100) hasMore = false; else page++;
              } else hasMore = false;
            }
          }

          if (logId) {
            await supabase.from('sync_logs').update({ status: 'completed', completed_at: new Date().toISOString(), items_processed: itemsProcessed }).eq('id', logId);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, itemsProcessed }));

        } catch (error: any) {
          console.error('Sync error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), proxyMiddleware(), syncMiddleware()],
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
