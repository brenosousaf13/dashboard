export default async function handler(req, res) {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    // Determine redirect URI based on host to support local dev if configured
    // Otherwise fallback to the provided production URI
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    // Check if we are on localhost
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    // The user specified: https://dashboard.noordshop.com.br/auth/google/callback
    // We will try to match that pattern. 
    // If local, we assume http://localhost:PORT/api/auth/google/callback or similar?
    // Actually, usually the callback goes to the API.
    // If the user configured .../auth/google/callback, they might have a rewrite or it's a frontend route.
    // Given the instructions "Criar endpoint api/auth/google/callback.js", it implies the backend handles it.
    // Let's assume the redirect URI should point to this backend endpoint.
    // However, if the user explicitly said the Redirect URI is .../auth/google/callback, 
    // and we are writing api/auth/google/callback.js, there might be a mismatch unless there's a rewrite.
    // I will use the user provided URI for production, and try to adapt for local.

    let REDIRECT_URI = 'https://dashboard.noordshop.com.br/api/auth/google/callback';

    // NOTE: The user provided "https://dashboard.noordshop.com.br/auth/google/callback" in the description.
    // But asked to create "api/auth/google/callback.js".
    // If I use the /auth/... one, it might hit the frontend (404 or React Router).
    // If I use /api/auth/..., it hits the function.
    // I will use the /api/ version for the code, assuming the user might have meant that or will configure it.
    // BUT, if the Google Console ONLY has the /auth/ version allowed, this will fail.
    // I will use the exact URI provided by the user in the prompt to be safe: 
    // "Redirect URI: https://dashboard.noordshop.com.br/auth/google/callback"
    // AND I will assume there is a rewrite or I should handle it.
    // WAIT, if I redirect to /auth/google/callback, and that is a React Route, the Frontend needs to handle the code.
    // But the user asked for "api/auth/google/callback.js para receber o código".
    // This implies the backend should receive it.
    // This suggests the Redirect URI in Google Console SHOULD be .../api/auth/google/callback OR there is a rewrite.
    // I will use the /api/ path because that's where the code lives.

    if (isLocal) {
        REDIRECT_URI = `http://${host}/api/auth/google/callback`;
    } else {
        // Using the /api/ path to ensure it hits the function
        REDIRECT_URI = 'https://dashboard.noordshop.com.br/api/auth/google/callback';
    }

    const SCOPES = [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${userId}`;

    res.redirect(authUrl);
}
