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

// Google Analytics middleware helper function to get access token
async function getGoogleAccessToken(supabase: any, userId: string, env: any) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('User not found');
  }

  if (!profile.google_refresh_token) {
    throw new Error('Google not connected');
  }

  let accessToken = profile.google_access_token;

  // Check expiration (buffer 60s)
  if (Date.now() > (profile.google_token_expires_at || 0) - 60000) {
    // Refresh token
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID || '',
        client_secret: env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: profile.google_refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const tokens = await refreshRes.json() as { error?: string; access_token?: string; expires_in?: number };

    if (tokens.error) {
      throw new Error('Failed to refresh token');
    }

    accessToken = tokens.access_token;

    // Update DB
    await supabase.from('profiles').update({
      google_access_token: accessToken,
      google_token_expires_at: Date.now() + ((tokens.expires_in || 3600) * 1000)
    }).eq('id', userId);
  }

  return accessToken;
}

// Custom middleware to handle /api/analytics/properties requests
const gaPropertiesMiddleware = (): Plugin => {
  return {
    name: 'ga-properties-middleware',
    configureServer(server) {
      server.middlewares.use('/api/analytics/properties', async (req: any, res: any, next: any) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const userId = urlObj.searchParams.get('userId');

          if (!userId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing userId' }));
            return;
          }

          const { createClient } = await import('@supabase/supabase-js');
          const { loadEnv } = await import('vite');

          const env = loadEnv('development', process.cwd(), '');
          const supabaseUrl = env.VITE_SUPABASE_URL;
          const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing Supabase env vars' }));
            return;
          }

          const supabase = createClient(supabaseUrl, supabaseKey);
          const accessToken = await getGoogleAccessToken(supabase, userId, env);

          // Fetch Properties
          const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (!response.ok) {
            const err = await response.json() as { error?: { message?: string } };
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.error?.message || 'Failed to fetch properties' }));
            return;
          }

          const data = await response.json() as { accountSummaries?: Array<{ account: string; propertySummaries?: Array<{ property: string; displayName: string }> }> };

          const properties: any[] = [];
          if (data.accountSummaries) {
            for (const account of data.accountSummaries) {
              if (account.propertySummaries) {
                for (const prop of account.propertySummaries) {
                  properties.push({
                    id: prop.property,
                    name: prop.displayName,
                    accountId: account.account
                  });
                }
              }
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ properties }));

        } catch (error: any) {
          console.error('GA Properties API Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
        }
      });
    }
  }
}

// Widget configurations for GA4 API
const WIDGET_CONFIGS: Record<string, any> = {
  'active_users_realtime': { metrics: [{ name: 'activeUsers' }], dimensions: [] },
  'total_users': { metrics: [{ name: 'totalUsers' }] },
  'new_users': { metrics: [{ name: 'newUsers' }] },
  'sessions': { metrics: [{ name: 'sessions' }] },
  'engagement_rate': { metrics: [{ name: 'engagementRate' }] },
  'avg_session_duration': { metrics: [{ name: 'averageSessionDuration' }] },
  'screen_page_views': { metrics: [{ name: 'screenPageViews' }] },
  'event_count': { metrics: [{ name: 'eventCount' }] },
  'conversions': { metrics: [{ name: 'conversions' }] },
  'conversion_rate': { metrics: [{ name: 'sessionConversionRate' }] },
  'total_revenue': { metrics: [{ name: 'totalRevenue' }] },
  'avg_order_value': { metrics: [{ name: 'averagePurchaseRevenue' }] },
  'users_over_time': {
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  },
  'sessions_over_time': {
    metrics: [{ name: 'sessions' }],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  },
  'revenue_over_time': {
    metrics: [{ name: 'totalRevenue' }],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  },
  'conversions_over_time': {
    metrics: [{ name: 'conversions' }],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  },
  'traffic_sources': {
    metrics: [{ name: 'sessions' }],
    dimensions: [{ name: 'sessionSource' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10
  },
  'devices': {
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'deviceCategory' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
  },
  'browsers': {
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'browser' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10
  },
  'countries': {
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'country' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10
  },
  'top_pages': {
    metrics: [{ name: 'screenPageViews' }],
    dimensions: [{ name: 'pagePath' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10
  },
  'top_landing_pages': {
    metrics: [{ name: 'sessions' }],
    dimensions: [{ name: 'landingPage' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10
  },
  'top_products': {
    metrics: [{ name: 'itemRevenue' }, { name: 'itemsPurchased' }],
    dimensions: [{ name: 'itemName' }],
    orderBys: [{ metric: { metricName: 'itemRevenue' }, desc: true }],
    limit: 10
  },
  'top_campaigns': {
    metrics: [{ name: 'sessions' }],
    dimensions: [{ name: 'sessionCampaignName' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10
  },
  'top_cities': {
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'city' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10
  }
};

// Custom middleware to handle /api/analytics/data requests
const gaDataMiddleware = (): Plugin => {
  return {
    name: 'ga-data-middleware',
    configureServer(server) {
      server.middlewares.use('/api/analytics/data', async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
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
          const { userId, propertyId, startDate, endDate, widgets } = body;

          if (!userId || !propertyId || !startDate || !endDate) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing required parameters' }));
            return;
          }

          const { createClient } = await import('@supabase/supabase-js');
          const { loadEnv } = await import('vite');

          const env = loadEnv('development', process.cwd(), '');
          const supabaseUrl = env.VITE_SUPABASE_URL;
          const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing Supabase env vars' }));
            return;
          }

          const supabase = createClient(supabaseUrl, supabaseKey);
          const accessToken = await getGoogleAccessToken(supabase, userId, env);

          // Determine which reports to run
          const requestedWidgets = widgets ? widgets.split(',') : ['total_users', 'sessions', 'users_over_time', 'traffic_sources', 'top_pages'];
          const requests: any[] = [];
          const widgetIdMap: string[] = [];

          requestedWidgets.forEach((widgetId: string) => {
            const config = WIDGET_CONFIGS[widgetId];
            if (config) {
              requests.push({
                dateRanges: [{ startDate, endDate }],
                ...config
              });
              widgetIdMap.push(widgetId);
            }
          });

          if (requests.length === 0) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({}));
            return;
          }

          // Batch Run Reports (Chunked)
          const CHUNK_SIZE = 5;
          const result: Record<string, any> = {};

          for (let i = 0; i < requests.length; i += CHUNK_SIZE) {
            const chunkRequests = requests.slice(i, i + CHUNK_SIZE);
            const chunkWidgetIds = widgetIdMap.slice(i, i + CHUNK_SIZE);

            const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:batchRunReports`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ requests: chunkRequests })
            });

            if (!response.ok) {
              const err = await response.json() as { error?: { message?: string } };
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.error?.message || 'Failed to fetch analytics data' }));
              return;
            }

            const data = await response.json() as { reports?: any[] };

            if (data.reports) {
              data.reports.forEach((report: any, index: number) => {
                const widgetId = chunkWidgetIds[index];
                result[widgetId] = report;
              });
            }
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));

        } catch (error: any) {
          console.error('GA Data API Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
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
  plugins: [react(), proxyMiddleware(), gaPropertiesMiddleware(), gaDataMiddleware(), syncMiddleware()],
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
