import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
        return res.status(400).json({ error: 'Missing code or userId' });
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Determine redirect URI (must match the one used in auth/google.js)
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    let REDIRECT_URI = 'https://dashboard.noordshop.com.br/api/auth/google/callback';
    if (isLocal) {
        REDIRECT_URI = `http://${host}/api/auth/google/callback`;
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Token exchange error:', tokens);
            return res.status(400).json({ error: tokens.error_description || 'Failed to exchange token' });
        }

        // Initialize Supabase Admin Client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Prepare update data
        const updateData = {
            google_access_token: tokens.access_token,
            google_token_expires_at: Date.now() + (tokens.expires_in * 1000)
        };

        // Only update refresh token if it was returned (it's not returned if user re-auths without prompt=consent, 
        // but we used prompt=consent so it should be there, but good to check)
        if (tokens.refresh_token) {
            updateData.google_refresh_token = tokens.refresh_token;
        }

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('Supabase update error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Redirect back to the dashboard
        res.redirect('/google-analytics');

    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
