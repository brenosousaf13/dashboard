import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
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
                // If refresh fails (e.g. revoked), we might want to clear tokens?
                // For now just return error
                return res.status(401).json({ error: 'Failed to refresh token', details: tokens });
            }

            accessToken = tokens.access_token;

            // Update DB
            await supabase.from('profiles').update({
                google_access_token: accessToken,
                google_token_expires_at: Date.now() + (tokens.expires_in * 1000)
            }).eq('id', userId);
        }

        // Fetch Properties
        const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json({ error: err.error?.message || 'Failed to fetch properties' });
        }

        const data = await response.json();

        const properties = [];
        if (data.accountSummaries) {
            for (const account of data.accountSummaries) {
                if (account.propertySummaries) {
                    for (const prop of account.propertySummaries) {
                        properties.push({
                            id: prop.property, // e.g. "properties/123456"
                            name: prop.displayName,
                            accountId: account.account
                        });
                    }
                }
            }
        }

        res.status(200).json({ properties });

    } catch (error) {
        console.error('Properties API Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
