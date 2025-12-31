import { createClient } from '@supabase/supabase-js';

// Mapping of widget IDs to GA4 API Request configurations
const WIDGET_CONFIGS = {
    // --- Metrics Cards ---
    'active_users_realtime': {
        // Realtime requires a different API method runRealtimeReport, 
        // but for simplicity in batchRunReports we might use 'activeUsers' with recent time, 
        // OR we handle it separately. For now, let's map to standard activeUsers.
        metrics: [{ name: 'activeUsers' }],
        dimensions: []
    },
    'total_users': { metrics: [{ name: 'totalUsers' }] },
    'new_users': { metrics: [{ name: 'newUsers' }] },
    'sessions': { metrics: [{ name: 'sessions' }] },
    'engagement_rate': { metrics: [{ name: 'engagementRate' }] },
    'avg_session_duration': { metrics: [{ name: 'averageSessionDuration' }] },
    'screen_page_views': { metrics: [{ name: 'screenPageViews' }] },
    'event_count': { metrics: [{ name: 'eventCount' }] },
    'conversions': { metrics: [{ name: 'conversions' }] }, // purchases
    'conversion_rate': { metrics: [{ name: 'sessionConversionRate' }] },
    'total_revenue': { metrics: [{ name: 'totalRevenue' }] },
    'avg_order_value': { metrics: [{ name: 'averagePurchaseRevenue' }] }, // Approximation

    // --- Line/Area Charts (Over Time) ---
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

    // --- Pie/Donut Charts ---
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

    // --- Tables/Lists ---
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
    // 'top_exit_pages': Not directly available in standard dimensions easily without exploration
    'top_products': { // Requires ecommerce
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

export default async function handler(req, res) {
    const { userId, propertyId, startDate, endDate, widgets } = req.body;

    if (!userId || !propertyId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get tokens
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('google_access_token, google_refresh_token, google_token_expires_at')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!profile.google_refresh_token) {
            return res.status(401).json({ error: 'Google not connected' });
        }

        let accessToken = profile.google_access_token;

        // Check expiration (buffer 60s)
        if (Date.now() > (profile.google_token_expires_at || 0) - 60000) {
            // Refresh token
            const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    refresh_token: profile.google_refresh_token,
                    grant_type: 'refresh_token'
                })
            });

            const tokens = await refreshRes.json();

            if (tokens.error) {
                return res.status(401).json({ error: 'Failed to refresh token', details: tokens });
            }

            accessToken = tokens.access_token;

            // Update DB
            await supabase.from('profiles').update({
                google_access_token: accessToken,
                google_token_expires_at: Date.now() + (tokens.expires_in * 1000)
            }).eq('id', userId);
        }

        // Determine which reports to run
        const requestedWidgets = widgets ? widgets.split(',') : ['total_users', 'sessions', 'users_over_time', 'traffic_sources', 'top_pages'];
        const requests = [];
        const widgetIdMap = []; // To map response index back to widget ID

        requestedWidgets.forEach(widgetId => {
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
            return res.status(200).json({});
        }

        // Batch Run Reports (Chunked)
        const CHUNK_SIZE = 5;
        const result = {};

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
                const err = await response.json();
                // If one batch fails, we return error for now. 
                // Alternatively we could continue and return partial results.
                return res.status(response.status).json({ error: err.error?.message || 'Failed to fetch analytics data' });
            }

            const data = await response.json();

            if (data.reports) {
                data.reports.forEach((report, index) => {
                    const widgetId = chunkWidgetIds[index];
                    result[widgetId] = report;
                });
            }
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('Analytics Data API Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
