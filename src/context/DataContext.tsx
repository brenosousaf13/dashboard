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
        if (!user) return;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, facebook_app_id, facebook_access_token')
                .eq('id', user.id)
                .single();

            if (data && data.woocommerce_url && data.woocommerce_consumer_key && data.woocommerce_consumer_secret) {
                const creds = {
                    url: data.woocommerce_url,
                    consumerKey: data.woocommerce_consumer_key,
                    consumerSecret: data.woocommerce_consumer_secret
                };
                setCredentials(creds);
                setIsConnected(true);
                // Auto-sync data when credentials are loaded
                syncData(creds);
            }

            if (data && data.facebook_app_id && data.facebook_access_token) {
                setFacebookCredentials({
                    appId: data.facebook_app_id,
                    accessToken: data.facebook_access_token
                });
                setIsFacebookConnected(true);
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
            let baseUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            if (url.includes('stillgerjeans.com.br')) {
                baseUrl = `/proxy-wc/wp-json/wc/v3`;
            }

            const headers = {
                Authorization: `Basic ${auth}`,
            };

            // Try to fetch system status or just products to verify connection
            const response = await fetch(`${baseUrl}/products?per_page=1`, { headers });
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
                    .update({
                        woocommerce_url: url,
                        woocommerce_consumer_key: consumerKey,
                        woocommerce_consumer_secret: consumerSecret
                    })
                    .eq('id', user.id);

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
        setIsLoading(true);
        try {
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        facebook_app_id: creds.appId,
                        facebook_access_token: creds.accessToken
                    })
                    .eq('id', user.id);

                if (error) throw error;
            }
            setFacebookCredentials(creds);
            setIsFacebookConnected(true);
        } catch (error) {
            console.error("Failed to connect Facebook:", error);
            throw error;
        } finally {
            setIsLoading(false);
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

        // Check if we already have data for this range
        if (!force && data && lastSyncRange?.start && lastSyncRange?.end && startDate && endDate) {
            const isSameStart = startDate.toISOString().split('T')[0] === lastSyncRange.start.toISOString().split('T')[0];
            const isSameEnd = endDate.toISOString().split('T')[0] === lastSyncRange.end.toISOString().split('T')[0];

            if (isSameStart && isSameEnd) {
                console.log('Skipping sync: Data already loaded for this range');
                return;
            }
        }

        setIsLoading(true);
        try {
            const { url, consumerKey, consumerSecret } = credsToUse;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            // Handle CORS proxy for development
            let baseUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            if (url.includes('stillgerjeans.com.br')) {
                baseUrl = `/proxy-wc/wp-json/wc/v3`;
            }

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
            const analyticsBaseUrl = baseUrl.replace('/wc/v3', '');
            const salesUrl = `${analyticsBaseUrl}/wc-analytics/reports/revenue/stats?${params.toString()}`;
            console.log('Fetching Analytics URL:', salesUrl);
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
                const productsRes = await fetch(`${analyticsBaseUrl}/wc-analytics/reports/products?${productsParams.toString()}`, { headers });

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

                    const productsListRes = await fetch(`${baseUrl}/products?${productsListParams.toString()}`, { headers });

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

                    const ordersRes = await fetch(`${baseUrl}/orders?${ordersParams.toString()}`, { headers });

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
                const firstRes = await fetch(`${baseUrl}/customers?per_page=100&page=1`, { headers });
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
                    const customersRes = await fetch(`${baseUrl}/customers?per_page=100&page=${page}`, { headers });
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

            setData({
                sales: salesData,
                products: productsData,
                productsList: productsList,
                orders: ordersData,
                customers: { total: totalCustomers },
                customersList: customersList,
            });

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

            let baseUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            if (url.includes('stillgerjeans.com.br')) {
                baseUrl = `/proxy-wc/wp-json/wc/v3`;
            }

            const headers = { Authorization: `Basic ${auth}` };

            const response = await fetch(`${baseUrl}/products/${productId}/variations?per_page=100`, { headers });
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
