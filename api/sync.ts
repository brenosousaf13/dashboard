import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    // Enable CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { type, full, userId } = await req.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
        }

        // Initialize Supabase Client
        const supabaseUrl = process.env.VITE_SUPABASE_URL!;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get User Profile for Credentials
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
        }

        if (!profile.woocommerce_url || !profile.woocommerce_consumer_key || !profile.woocommerce_consumer_secret) {
            return new Response(JSON.stringify({ error: 'WooCommerce credentials missing' }), { status: 400 });
        }

        // Log Start
        const { data: logData, error: logError } = await supabase
            .from('sync_logs')
            .insert({
                user_id: userId,
                type: type || 'all',
                status: 'started'
            })
            .select()
            .single();

        if (logError) {
            console.error('Failed to create sync log', logError);
        }

        const logId = logData?.id;

        // Helper to fetch from WooCommerce
        const fetchWoo = async (endpoint: string, params: URLSearchParams) => {
            const url = `${profile.woocommerce_url.replace(/\/$/, '')}/wp-json/wc/v3${endpoint}?${params.toString()}`;
            const auth = btoa(`${profile.woocommerce_consumer_key}:${profile.woocommerce_consumer_secret}`);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            if (!response.ok) {
                throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        };

        // Sync Logic
        let itemsProcessed = 0;

        try {
            if (type === 'orders' || type === 'all') {
                // Sync Orders
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const params = new URLSearchParams();
                    params.append('per_page', '100');
                    params.append('page', page.toString());
                    if (!full) {
                        // Incremental sync: fetch orders modified in the last 24h
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        params.append('after', yesterday.toISOString());
                    }

                    const orders = await fetchWoo('/orders', params);

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

                        const { error } = await supabase.from('wc_orders').upsert(upsertData, { onConflict: 'user_id, wc_id' });
                        if (error) throw error;

                        itemsProcessed += orders.length;
                        if (orders.length < 100) hasMore = false;
                        else page++;
                    } else {
                        hasMore = false;
                    }
                }
            }

            if (type === 'products' || type === 'all') {
                // Sync Products
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const params = new URLSearchParams();
                    params.append('per_page', '100');
                    params.append('page', page.toString());

                    const products = await fetchWoo('/products', params);

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

                        const { error } = await supabase.from('wc_products').upsert(upsertData, { onConflict: 'user_id, wc_id' });
                        if (error) throw error;

                        itemsProcessed += products.length;
                        if (products.length < 100) hasMore = false;
                        else page++;
                    } else {
                        hasMore = false;
                    }
                }
            }

            if (type === 'customers' || type === 'all') {
                // Sync Customers
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const params = new URLSearchParams();
                    params.append('per_page', '100');
                    params.append('page', page.toString());

                    const customers = await fetchWoo('/customers', params);

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

                        const { error } = await supabase.from('wc_customers').upsert(upsertData, { onConflict: 'user_id, wc_id' });
                        if (error) throw error;

                        itemsProcessed += customers.length;
                        if (customers.length < 100) hasMore = false;
                        else page++;
                    } else {
                        hasMore = false;
                    }
                }
            }

            // Update Log Success
            if (logId) {
                await supabase
                    .from('sync_logs')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        items_processed: itemsProcessed
                    })
                    .eq('id', logId);
            }

            return new Response(JSON.stringify({ success: true, itemsProcessed }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error: any) {
            console.error('Sync Error:', error);

            // Update Log Failure
            if (logId) {
                await supabase
                    .from('sync_logs')
                    .update({
                        status: 'failed',
                        completed_at: new Date().toISOString(),
                        error_message: error.message
                    })
                    .eq('id', logId);
            }

            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
