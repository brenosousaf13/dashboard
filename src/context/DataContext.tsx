import { createContext, useContext, useState, useEffect } from 'react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, parseISO } from 'date-fns';
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
    storeName: string;
    logoUrl: string | null;
    connect: (creds: WooCommerceCredentials) => Promise<void>;
    disconnect: () => Promise<void>;
    connectFacebook: (creds: FacebookCredentials) => Promise<void>;
    disconnectFacebook: () => Promise<void>;
    syncData: (credsToUse?: WooCommerceCredentials | null, startDate?: Date, endDate?: Date, force?: boolean) => Promise<void>;
    syncAnalytics: (credsToUse?: WooCommerceCredentials | null, startDate?: Date, endDate?: Date, force?: boolean) => Promise<void>;
    syncCatalog: (credsToUse?: WooCommerceCredentials | null, force?: boolean) => Promise<void>;
    getProductVariations: (productId: number) => Promise<any[]>;
    updateProduct: (productId: number, data: any) => Promise<any>;
    updateProductVariation: (productId: number, variationId: number, data: any) => Promise<any>;
    updateStoreSettings: (name: string, logo: string | null) => Promise<void>;
    setGlobalDateFilter: (filter: string, start: string, end: string) => void;
    dateFilter: string;
    customStartDate: string;
    customEndDate: string;
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
    const [storeName, setStoreName] = useState("Loja Exemplo");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Global Date Filter State
    // Global Date Filter State - Initialize from localStorage if available
    const [dateFilter, setDateFilter] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dateFilter') || 'last_30_days';
        }
        return 'last_30_days';
    });
    const [customStartDate, setCustomStartDate] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('customStartDate') || '';
        }
        return '';
    });
    const [customEndDate, setCustomEndDate] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('customEndDate') || '';
        }
        return '';
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else {
            setCredentials(null);
            setFacebookCredentials(null);
            setIsConnected(false);
            setIsFacebookConnected(false);
            setData(null);
            setStoreName("Loja Exemplo");
            setLogoUrl(null);
            // Reset date filter on logout
            // Reset date filter on logout and clear localStorage
            setDateFilter('last_30_days');
            setCustomStartDate('');
            setCustomEndDate('');
            localStorage.removeItem('dateFilter');
            localStorage.removeItem('customStartDate');
            localStorage.removeItem('customEndDate');
        }
    }, [user]);

    const setGlobalDateFilter = (filter: string, start: string, end: string) => {
        setDateFilter(filter);
        setCustomStartDate(start);
        setCustomEndDate(end);

        // Persist to localStorage
        localStorage.setItem('dateFilter', filter);
        localStorage.setItem('customStartDate', start);
        localStorage.setItem('customEndDate', end);
    };

    const fetchProfile = async () => {
        if (!user) {
            console.log('fetchProfile: No user found');
            return;
        }
        console.log('fetchProfile: Fetching for user', user.id);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, facebook_app_id, facebook_access_token, store_name, logo_url')
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

            if (data) {
                if (data.store_name) setStoreName(data.store_name);
                if (data.logo_url) setLogoUrl(data.logo_url);

                if (data.woocommerce_url && data.woocommerce_consumer_key && data.woocommerce_consumer_secret) {
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

                if (data.facebook_app_id && data.facebook_access_token) {
                    console.log('fetchProfile: Found Facebook credentials');
                    setFacebookCredentials({
                        appId: data.facebook_app_id,
                        accessToken: data.facebook_access_token
                    });
                    setIsFacebookConnected(true);
                } else {
                    console.log('fetchProfile: No Facebook credentials found');
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const updateStoreSettings = async (name: string, logo: string | null) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    store_name: name,
                    logo_url: logo
                })
                .eq('id', user.id);

            if (error) throw error;

            setStoreName(name);
            setLogoUrl(logo);
        } catch (error) {
            console.error('Error updating store settings:', error);
            throw error;
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

    const syncAnalytics = async (credsToUse = credentials, startDate?: Date, endDate?: Date, force = false) => {
        if (!credsToUse) return;

        // Determine dates based on arguments or global state
        let start = startDate;
        let end = endDate;

        if (!start || !end) {
            const now = new Date();
            if (dateFilter === 'all') {
                start = new Date(2020, 0, 1);
                end = now;
            } else if (dateFilter === 'today') {
                start = startOfDay(now);
                end = endOfDay(now);
            } else if (dateFilter === 'this_month') {
                start = startOfMonth(now);
                end = endOfMonth(now);
            } else if (dateFilter === 'last_30_days') {
                start = subDays(now, 30);
                end = now;
            } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
                start = parseISO(customStartDate);
                end = endOfDay(parseISO(customEndDate));
            } else {
                // Fallback
                start = subDays(now, 30);
                end = now;
            }
        }

        // Check if we already have data for this range (In-Memory)
        if (!force && data && lastSyncRange?.start && lastSyncRange?.end) {
            const isSameStart = start.toISOString().split('T')[0] === lastSyncRange.start.toISOString().split('T')[0];
            const isSameEnd = end.toISOString().split('T')[0] === lastSyncRange.end.toISOString().split('T')[0];

            if (isSameStart && isSameEnd && data.sales && data.sales.length > 0) {
                console.log('Skipping analytics sync: Data already loaded for this range (Memory)');
                return;
            }
        }

        setIsLoading(true);
        try {
            const { url, consumerKey, consumerSecret } = credsToUse;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            const analyticsTargetUrl = `${url.replace(/\/$/, '')}/wp-json/wc-analytics`;

            const getAnalyticsProxyUrl = (endpoint: string, queryParams: string = '') => {
                const fullUrl = `${analyticsTargetUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
                return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
            };

            const getProxyUrl = (endpoint: string, queryParams: string = '') => {
                const fullUrl = `${targetUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
                return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
            };

            const headers = { Authorization: `Basic ${auth}` };

            const params = new URLSearchParams();
            params.append('interval', 'day');
            params.append('per_page', '100');
            params.append('after', start.toISOString());
            params.append('before', end.toISOString());

            // Fetch Sales with Pagination
            let allSalesData: any[] = [];
            let salesPage = 1;
            let hasMoreSales = true;

            while (hasMoreSales) {
                const salesParams = new URLSearchParams();
                salesParams.append('interval', 'day');
                salesParams.append('per_page', '100');
                salesParams.append('page', salesPage.toString());
                salesParams.append('after', start.toISOString());
                salesParams.append('before', end.toISOString());

                const salesUrl = getAnalyticsProxyUrl('/reports/revenue/stats', salesParams.toString());
                const salesRes = await fetch(salesUrl, { headers });

                if (!salesRes.ok) {
                    console.error('Failed to fetch sales stats page', salesPage);
                    hasMoreSales = false;
                    continue;
                }

                const analyticsData = await salesRes.json();
                // WC Analytics API returns { intervals: [...] }
                // If intervals is empty, we are done
                if (analyticsData.intervals && analyticsData.intervals.length > 0) {
                    allSalesData = [...allSalesData, ...analyticsData.intervals];
                    // If we got less than 100 items, we are probably done, but let's check next page to be safe or rely on length
                    if (analyticsData.intervals.length < 100) {
                        hasMoreSales = false;
                    } else {
                        salesPage++;
                    }
                } else {
                    hasMoreSales = false;
                }
            }

            const salesData = allSalesData.map((interval: any) => ({
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
                const productsParams = new URLSearchParams();
                productsParams.append('per_page', '20');
                productsParams.append('orderby', 'items_sold');
                productsParams.append('order', 'desc');
                productsParams.append('extended_info', 'true');
                productsParams.append('after', start.toISOString());
                productsParams.append('before', end.toISOString());

                const productsUrl = getAnalyticsProxyUrl('/reports/products', productsParams.toString());
                const productsRes = await fetch(productsUrl, { headers });
                if (productsRes.ok) productsData = await productsRes.json();
            } catch (e) {
                console.error('Error fetching products analytics:', e);
            }

            // Fetch Orders with Pagination
            let ordersData: any[] = [];
            try {
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const ordersParams = new URLSearchParams();
                    ordersParams.append('per_page', '100');
                    ordersParams.append('page', page.toString());
                    ordersParams.append('after', start.toISOString());
                    ordersParams.append('before', end.toISOString());

                    const ordersRes = await fetch(getProxyUrl('/orders', ordersParams.toString()), { headers });
                    if (ordersRes.ok) {
                        const pageData = await ordersRes.json();
                        if (pageData.length > 0) {
                            ordersData = [...ordersData, ...pageData];
                            if (pageData.length < 100) {
                                hasMore = false;
                            } else {
                                page++;
                            }
                        } else {
                            hasMore = false;
                        }
                    } else {
                        console.error('Failed to fetch orders page', page);
                        hasMore = false;
                    }
                }
            } catch (e) {
                console.error('Error fetching orders:', e);
            }

            setData(prev => ({
                sales: salesData,
                products: productsData,
                orders: ordersData,
                productsList: prev?.productsList || [],
                customersList: prev?.customersList || [],
                customers: prev?.customers || { total: 0 }
            }));

            setLastSyncRange({ start, end });

        } catch (err) {
            console.error('Sync Analytics Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const syncCatalog = async (credsToUse = credentials, force = false) => {
        if (!credsToUse) return;

        if (!force && data && data.productsList && data.productsList.length > 0) {
            console.log('Skipping catalog sync: Data already loaded (Memory)');
            return;
        }

        setIsLoading(true);
        try {
            const { url, consumerKey, consumerSecret } = credsToUse;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            const getProxyUrl = (endpoint: string, queryParams: string = '') => {
                const fullUrl = `${targetUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
                return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
            };

            const headers = { Authorization: `Basic ${auth}` };

            // Fetch Full Product List
            let productsList: any[] = [];
            try {
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                    const productsListParams = new URLSearchParams();
                    productsListParams.append('per_page', '100');
                    productsListParams.append('page', page.toString());

                    const res = await fetch(getProxyUrl('/products', productsListParams.toString()), { headers });
                    if (res.ok) {
                        const pageData = await res.json();
                        if (pageData.length > 0) {
                            productsList = [...productsList, ...pageData];
                            page++;
                        } else hasMore = false;
                    } else hasMore = false;
                }
            } catch (e) { console.error('Error fetching products list:', e); }

            // Fetch Customers
            let customersList: any[] = [];
            let totalCustomers = 0;
            try {
                let page = 1;
                let hasMore = true;

                const firstRes = await fetch(getProxyUrl('/customers', 'per_page=100&page=1'), { headers });
                if (firstRes.ok) {
                    totalCustomers = parseInt(firstRes.headers.get('X-WP-Total') || '0');
                    const pageData = await firstRes.json();
                    customersList = [...pageData];
                    if (pageData.length < 100) hasMore = false;
                    else page++;
                } else hasMore = false;

                while (hasMore) {
                    const res = await fetch(getProxyUrl('/customers', `per_page=100&page=${page}`), { headers });
                    if (res.ok) {
                        const pageData = await res.json();
                        if (pageData.length > 0) {
                            customersList = [...customersList, ...pageData];
                            page++;
                        } else hasMore = false;
                    } else hasMore = false;
                }
            } catch (e) { console.error('Error fetching customers:', e); }

            setData(prev => {
                const newData = {
                    sales: prev?.sales || [],
                    products: prev?.products || [],
                    orders: prev?.orders || [],
                    productsList: productsList,
                    customersList: customersList,
                    customers: { total: totalCustomers }
                };

                if (user) {
                    const cacheKey = `dashboard_data_${user.id}`;
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            timestamp: new Date().getTime(),
                            data: newData,
                            range: lastSyncRange
                        }));
                    } catch (e) { console.error('Failed to save to cache', e); }
                }
                return newData;
            });

        } catch (err) {
            console.error('Sync Catalog Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const syncData = async (credsToUse = credentials, startDate?: Date, endDate?: Date, force = false) => {
        await Promise.all([
            syncAnalytics(credsToUse, startDate, endDate, force),
            syncCatalog(credsToUse, force)
        ]);
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

    const updateProduct = async (productId: number, updateData: any) => {
        if (!credentials) return null;
        try {
            const { url, consumerKey, consumerSecret } = credentials;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            const fullUrl = `${targetUrl}/products/${productId}`;
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;

            const headers = {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(proxyUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedProduct = await response.json();

                // Update local state
                setData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        productsList: prev.productsList.map(p => p.id === productId ? updatedProduct : p)
                    };
                });

                return updatedProduct;
            } else {
                throw new Error('Failed to update product');
            }
        } catch (error) {
            console.error(`Error updating product ${productId}:`, error);
            throw error;
        }
    };

    const updateProductVariation = async (productId: number, variationId: number, updateData: any) => {
        if (!credentials) return null;
        try {
            const { url, consumerKey, consumerSecret } = credentials;
            const auth = btoa(`${consumerKey}:${consumerSecret}`);

            const targetUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
            const fullUrl = `${targetUrl}/products/${productId}/variations/${variationId}`;
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;

            const headers = {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(proxyUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedVariation = await response.json();
                return updatedVariation;
            } else {
                throw new Error('Failed to update variation');
            }
        } catch (error) {
            console.error(`Error updating variation ${variationId} of product ${productId}:`, error);
            throw error;
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
            storeName,
            logoUrl,
            connect,
            disconnect,
            connectFacebook,
            disconnectFacebook,
            syncData,
            syncAnalytics,
            syncCatalog,
            getProductVariations,
            updateProduct,
            updateProductVariation,
            updateStoreSettings,
            setGlobalDateFilter,
            dateFilter,
            customStartDate,
            customEndDate,
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
