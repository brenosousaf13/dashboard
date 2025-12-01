import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WooCommerceCredentials {
    url: string;
    consumerKey: string;
    consumerSecret: string;
}

interface FacebookCredentials {
    appId: string;
    accessToken: string;
}

interface DashboardData {
    sales: any[];
    products: any[]; // Top sellers from analytics
    productsList: any[]; // Full product list from WC API
    customersList: any[]; // Full customer list from WC API
    orders: any[];
    customers: { total: any };
}

interface DataContextType {
    credentials: WooCommerceCredentials | null;
    facebookCredentials: FacebookCredentials | null;
    isConnected: boolean;
    isFacebookConnected: boolean;
    isLoading: boolean;
    isFbLoading: boolean;
    data: DashboardData | null;
    connect: (creds: WooCommerceCredentials) => Promise<void>;
    disconnect: () => Promise<void>;
    connectFacebook: (creds: FacebookCredentials) => Promise<void>;
    disconnectFacebook: () => Promise<void>;
    syncData: (credsToUse?: WooCommerceCredentials | null, startDate?: Date, endDate?: Date, force?: boolean) => Promise<void>;
    getProductVariations: (productId: number) => Promise<any[]>;
    lastSyncRange: { start?: Date; end?: Date } | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [credentials, setCredentials] = useState<WooCommerceCredentials | null>(null);
    const [facebookCredentials, setFacebookCredentials] = useState<FacebookCredentials | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isFacebookConnected, setIsFacebookConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFbLoading, setIsFbLoading] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [lastSyncRange, setLastSyncRange] = useState<{ start?: Date; end?: Date } | null>(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else {
            setCredentials(null);
            setFacebookCredentials(null);
            setIsConnected(false);
            setIsFacebookConnected(false);
            setData(null);
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) {
            console.log('fetchProfile: No user found');
            return;
        }
        console.log('fetchProfile: Fetching for user', user.id);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, facebook_app_id, facebook_access_token')
                .eq('id', user.id)
                .single();

            if (error) {
                // Ignore 406 error (Not Acceptable) which happens when the row doesn't exist yet
                if (error.code === 'PGRST116' || error.code === '406' || (error as any).status === 406) {
                    console.log('fetchProfile: No profile found (new user)');
                    return;
                }
                console.error('fetchProfile: Supabase error:', error);
                return;
            }

            console.log('fetchProfile: Data received:', data);

            if (data && data.woocommerce_url && data.woocommerce_consumer_key && data.woocommerce_consumer_secret) {
                console.log('fetchProfile: Found WooCommerce credentials');
                const creds = {
                    url: data.woocommerce_url,
                    consumerKey: data.woocommerce_consumer_key,
                    consumerSecret: data.woocommerce_consumer_secret
                };
                setCredentials(creds);
                setIsConnected(true);
                // Auto-sync data when credentials are loaded
                console.log('fetchProfile: Triggering syncData');
                syncData(creds);
            } else {
                console.log('fetchProfile: No WooCommerce credentials found');
            }

            if (data && data.facebook_app_id && data.facebook_access_token) {
                console.log('fetchProfile: Found Facebook credentials');
                setFacebookCredentials({
                    appId: data.facebook_app_id,
                    accessToken: data.facebook_access_token
                });
                setIsFacebookConnected(true);
            } else {
                console.log('fetchProfile: No Facebook credentials found');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const connect = async (creds: WooCommerceCredentials) => {
        setIsLoading(true);
        try {
            // Validate credentials by making a test call
            const { url, consumerKey, consumerSecret } = creds;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            // Handle CORS proxy for development
            // Use Vercel Serverless Proxy for all requests to avoid CORS
            // The proxy expects the target URL as a query param 'url'
            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            const baseUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

            const headers = {
                Authorization: `Basic ${auth}`,
            };

            // Try to fetch system status or just products to verify connection
            // Note: For the proxy, we append the specific endpoint to the encoded target URL
            const testUrl = `/api/proxy?url=${encodeURIComponent(`${targetUrl}/products?per_page=1`)}`;
            const response = await fetch(testUrl, { headers });
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Resposta inválida da API (não é JSON). Verifique a URL ou o Proxy.");
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Credenciais inválidas. Verifique sua Consumer Key e Secret.");
                } else if (response.status === 404) {
                    throw new Error("URL da loja inválida ou API não encontrada.");
                } else {
                    throw new Error(`Erro na conexão: ${response.status} ${response.statusText}`);
                }
            }

            // If successful, save credentials to Supabase
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        woocommerce_url: url,
                        woocommerce_consumer_key: consumerKey,
                        woocommerce_consumer_secret: consumerSecret
                    });

                if (error) throw error;
            }

            setCredentials(creds);
            setIsConnected(true);
            await syncData(creds);
        } catch (error: any) {
            console.error("Failed to connect:", error);
            // Re-throw to be handled by the UI
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const disconnect = async () => {
        if (user) {
            await supabase
                .from('profiles')
                .update({
                    woocommerce_url: null,
                    woocommerce_consumer_key: null,
                    woocommerce_consumer_secret: null
                })
                .eq('id', user.id);
        }
        setCredentials(null);
        setIsConnected(false);
        setData(null);
    };

    const connectFacebook = async (creds: FacebookCredentials) => {
        setIsFbLoading(true);
        try {
            // Validate credentials with Facebook Graph API
            const response = await fetch(`https://graph.facebook.com/me?access_token=${creds.accessToken}`);
            if (!response.ok) {
                throw new Error("Token de acesso inválido ou expirado.");
            }
            const fbData = await response.json();
            if (!fbData.id) {
                throw new Error("Não foi possível validar a conta do Facebook.");
            }

            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        facebook_app_id: creds.appId,
                        facebook_access_token: creds.accessToken
                    });

                if (error) throw error;
            }
            setFacebookCredentials(creds);
            setIsFacebookConnected(true);
        } catch (error: any) {
            console.error("Failed to connect Facebook:", error);
            throw error;
        } finally {
            setIsFbLoading(false);
        }
    };

    const disconnectFacebook = async () => {
        if (user) {
            await supabase
                .from('profiles')
                .update({
                    facebook_app_id: null,
                    facebook_access_token: null
                })
                .eq('id', user.id);
        }
        setFacebookCredentials(null);
        setIsFacebookConnected(false);
    };

    const syncData = async (credsToUse = credentials, startDate?: Date, endDate?: Date, force = false) => {
        if (!credsToUse) return;

        // Check if we already have data for this range (In-Memory)
        if (!force && data && lastSyncRange?.start && lastSyncRange?.end && startDate && endDate) {
            const isSameStart = startDate.toISOString().split('T')[0] === lastSyncRange.start.toISOString().split('T')[0];
            const isSameEnd = endDate.toISOString().split('T')[0] === lastSyncRange.end.toISOString().split('T')[0];

            if (isSameStart && isSameEnd) {
                console.log('Skipping sync: Data already loaded for this range (Memory)');
                return;
            }
        }

        // Check Local Storage Cache
        if (!force && user) {
            const cacheKey = `dashboard_data_${user.id}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const { timestamp, data: cachedData, range } = JSON.parse(cached);
                    // Cache validity: 1 hour (can be adjusted)
                    const now = new Date().getTime();
                    if (now - timestamp < 60 * 60 * 1000) {
                        console.log('Loading data from Local Storage Cache');
                        setData(cachedData);
                        if (range?.start && range?.end) {
                            setLastSyncRange({ start: new Date(range.start), end: new Date(range.end) });
                        }
                        return;
                    } else {
                        console.log('Cache expired');
                    }
                } catch (e) {
                    console.error('Error parsing cache', e);
                }
            }
        }

        setIsLoading(true);
        try {
            const { url, consumerKey, consumerSecret } = credsToUse;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            // Handle CORS proxy for development
            // Use Vercel Serverless Proxy
            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;

            // Helper to construct proxy URL
            const getProxyUrl = (endpoint: string, queryParams: string = '') => {
                const fullUrl = `${targetUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
                return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
            };

            // For Analytics, the base path is different (/wp-json/wc-analytics)
            const analyticsTargetUrl = `${url.replace(/\/$/, '')}/wp-json/wc-analytics`;
            const getAnalyticsProxyUrl = (endpoint: string, queryParams: string = '') => {
                const fullUrl = `${analyticsTargetUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
                return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
            };

            const headers = {
                Authorization: `Basic ${auth}`,
            };

            // Format dates for Analytics API (ISO 8601)
            const params = new URLSearchParams();
            params.append('interval', 'day');
            params.append('per_page', '100');
            if (startDate) params.append('after', startDate.toISOString());
            if (endDate) params.append('before', endDate.toISOString());

            // Fetch Sales (Analytics)
            // Note: Analytics API is at /wp-json/wc-analytics, not /wp-json/wc/v3/wc-analytics
            // We need to strip /wc/v3 from baseUrl or construct a new one
            const salesUrl = getAnalyticsProxyUrl('/reports/revenue/stats', params.toString());
            console.log('Fetching Analytics URL via Proxy:', salesUrl);
            const salesRes = await fetch(salesUrl, { headers });
            if (!salesRes.ok) throw new Error('Failed to fetch sales stats');
            const analyticsData = await salesRes.json();
            console.log('Analytics Data Response:', analyticsData);

            // Map Analytics Data to DashboardData structure
            // Analytics API returns { intervals: [...], totals: {...} }
            // We map intervals to the 'sales' array expected by the dashboard
            const salesData = analyticsData.intervals.map((interval: any) => ({
                date: interval.interval,
                total_sales: String(interval.subtotals.gross_sales || 0),
                net_sales: String(interval.subtotals.net_revenue || 0),
                total_orders: interval.subtotals.orders_count || 0,
                total_items: interval.subtotals.items_sold || 0,
                total_tax: String(interval.subtotals.taxes || 0),
                total_shipping: String(interval.subtotals.shipping || 0),
                total_discount: String(interval.subtotals.coupons || 0),
                total_refunds: interval.subtotals.refunds || 0,
                totals_grouped_by: 'day',
            }));

            // Fetch Products (Top sellers)
            let productsData = [];
            try {
                console.log('Fetching Products Analytics...');
                const productsParams = new URLSearchParams();
                productsParams.append('per_page', '20'); // Fetch more for full list
                productsParams.append('orderby', 'items_sold');
                productsParams.append('order', 'desc');
                productsParams.append('extended_info', 'true');
                if (startDate) productsParams.append('after', startDate.toISOString());
                if (endDate) productsParams.append('before', endDate.toISOString());

                // Use Analytics API for products to get date-filtered performance
                // Use Analytics API for products to get date-filtered performance
                const productsUrl = getAnalyticsProxyUrl('/reports/products', productsParams.toString());
                const productsRes = await fetch(productsUrl, { headers });

                if (productsRes.ok) {
                    productsData = await productsRes.json();
                } else {
                    console.error('Failed to fetch products analytics:', productsRes.statusText);
                }
            } catch (e) {
                console.error('Error fetching products analytics:', e);
            }

            // Fetch Full Product List (for Products Page)
            let productsList: any[] = [];
            try {
                console.log('Fetching Full Product List...');
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                    const productsListParams = new URLSearchParams();
                    productsListParams.append('per_page', '100');
                    productsListParams.append('page', page.toString());
                    productsListParams.append('status', 'any');

                    const productsListRes = await fetch(getProxyUrl('/products', productsListParams.toString()), { headers });

                    if (productsListRes.ok) {
                        const pageProducts = await productsListRes.json();
                        if (pageProducts.length > 0) {
                            productsList = [...productsList, ...pageProducts];
                            page++;
                        } else {
                            hasMore = false;
                        }
                    } else {
                        console.error(`Failed to fetch products list page ${page}:`, productsListRes.statusText);
                        hasMore = false;
                    }
                }
                console.log(`Total products fetched: ${productsList.length}`);
            } catch (e) {
                console.error('Error fetching products list:', e);
            }

            // Fetch Orders (For Heatmap & Recent Sales & Orders Page)
            let ordersData: any[] = [];
            try {
                console.log('Fetching Orders...');
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                    const ordersParams = new URLSearchParams();
                    ordersParams.append('per_page', '100');
                    ordersParams.append('page', page.toString());
                    if (startDate) ordersParams.append('after', startDate.toISOString());
                    if (endDate) ordersParams.append('before', endDate.toISOString());

                    const ordersRes = await fetch(getProxyUrl('/orders', ordersParams.toString()), { headers });

                    if (ordersRes.ok) {
                        const pageOrders = await ordersRes.json();
                        if (pageOrders.length > 0) {
                            ordersData = [...ordersData, ...pageOrders];
                            page++;
                        } else {
                            hasMore = false;
                        }
                    } else {
                        console.error(`Failed to fetch orders page ${page}:`, ordersRes.statusText);
                        hasMore = false;
                    }
                }
                console.log(`Total orders fetched: ${ordersData.length}`);
            } catch (e) {
                console.error('Error fetching orders:', e);
            }

            // Fetch Customers (Full List)
            let customersList: any[] = [];
            let totalCustomers = 0;
            try {
                console.log('Fetching Customers...');
                let page = 1;
                let hasMore = true;

                // First fetch to get total and first page
                const firstRes = await fetch(getProxyUrl('/customers', 'per_page=100&page=1'), { headers });
                if (firstRes.ok) {
                    const totalHeader = firstRes.headers.get('X-WP-Total');
                    totalCustomers = totalHeader ? parseInt(totalHeader) : 0;
                    const pageCustomers = await firstRes.json();
                    customersList = [...pageCustomers];

                    if (pageCustomers.length < 100) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }

                while (hasMore) {
                    const customersRes = await fetch(getProxyUrl('/customers', `per_page=100&page=${page}`), { headers });
                    if (customersRes.ok) {
                        const pageCustomers = await customersRes.json();
                        if (pageCustomers.length > 0) {
                            customersList = [...customersList, ...pageCustomers];
                            page++;
                        } else {
                            hasMore = false;
                        }
                    } else {
                        console.error(`Failed to fetch customers page ${page}:`, customersRes.statusText);
                        hasMore = false;
                    }
                }
                console.log(`Total customers fetched: ${customersList.length}`);
            } catch (e) {
                console.error('Error fetching customers:', e);
            }

            const newData = {
                sales: salesData,
                products: productsData,
                productsList: productsList,
                orders: ordersData,
                customers: { total: totalCustomers },
                customersList: customersList,
            };

            setData(newData);

            // Save to Local Storage Cache
            if (user) {
                const cacheKey = `dashboard_data_${user.id}`;
                const cachePayload = {
                    timestamp: new Date().getTime(),
                    data: newData,
                    range: { start: startDate, end: endDate }
                };
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
                    console.log('Data saved to Local Storage Cache');
                } catch (e) {
                    console.error('Failed to save to cache (quota exceeded?)', e);
                }
            }

            if (startDate && endDate) {
                setLastSyncRange({ start: startDate, end: endDate });
            }

        } catch (err) {
            console.error('Sync Data Error:', err instanceof Error ? err.message : err);
        } finally {
            setIsLoading(false);
        }
    };

    const getProductVariations = async (productId: number) => {
        if (!credentials) return [];
        try {
            const { url, consumerKey, consumerSecret } = credentials;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            const fullUrl = `${targetUrl}/products/${productId}/variations?per_page=100`;
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;

            const headers = { Authorization: `Basic ${auth}` };

            const response = await fetch(proxyUrl, { headers });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error(`Error fetching variations for product ${productId}:`, error);
            return [];
        }
    };
    return (
        <DataContext.Provider value={{
            credentials,
            facebookCredentials,
            isConnected,
            isFacebookConnected,
            isLoading,
            isFbLoading,
            data,
            connect,
            disconnect,
            connectFacebook,
            disconnectFacebook,
            syncData,
            getProductVariations,
            lastSyncRange
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
