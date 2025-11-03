# Vibe — Spotify-synced portfolio

This project is a minimal Vite + React portfolio that connects to Spotify, reads your currently playing track, fetches the album cover, extracts an average colour and updates the site's colour to match.

Features
- Client-side React app that starts Spotify OAuth
- Serverless API endpoints (for Vercel) to securely exchange tokens and proxy images
- Local Express server for development

Important: you must register a Spotify app and set environment variables. See setup below.

## Setup (local)

1. Clone the repo and install dependencies:

```powershell
npm install
```

2. Create a Spotify app at https://developer.spotify.com/dashboard and add a Redirect URI that matches your local dev origin, e.g. `http://localhost:5173/` (Vite default) and the production URL you'll use (e.g. `https://lewistough.co.uk/`).

3. Create a `.env` file at the repo root for local development:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
PORT=3000
```

4. Start Vite and the local server in separate terminals:

```powershell
# terminal 1
npm run dev

# terminal 2
npm start
```

The app will open at `http://localhost:5173`. Click "Connect with Spotify" and sign in. The local server will exchange the code for tokens and proxy images.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, create a new project from your repo.
3. In your Vercel project settings -> Environment Variables, add:

- `SPOTIFY_CLIENT_ID` = your Spotify Client ID
- `SPOTIFY_CLIENT_SECRET` = your Spotify Client Secret
- `VITE_SPOTIFY_CLIENT_ID` = your Spotify Client ID (so the frontend can build the authorize URL)

Also set the Redirect URI on the Spotify Dashboard to your Vercel deployment URL (e.g. `https://lewistough.co.uk/`).

When Vercel builds, the frontend uses `VITE_SPOTIFY_CLIENT_ID` and the serverless functions use `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` so secrets are not exposed to the browser.

## How it works (summary)

- Frontend constructs a Spotify authorize URL and redirects the user to Spotify login.
- Spotify redirects back with a `code` query param.
- The frontend POSTs the `code` to `/api/spotify-token` (serverless function) which exchanges it for an access token using the client secret (kept server-side).
- The frontend uses the access token to fetch currently playing track. Album image fetches are proxied through `/api/proxy-image` to avoid CORS restrictions; the API returns a base64 image which the frontend paints to canvas and extracts an average colour.

## Notes & next steps

- This is a minimal example. For production hardening: store refresh tokens server-side or in a secure database, handle token rotation gracefully, and rate-limit the proxy endpoints.
- If you prefer to avoid a server entirely, you can implement PKCE and exchange tokens client-side — but note that some Spotify endpoints or browsers might restrict direct token exchange due to CORS.# vibewebsite
