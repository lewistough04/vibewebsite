# Vibe — Spotify-synced portfolio

This project is a minimal Vite + React portfolio that shows what _one_ Spotify account is currently listening to and adapts the site colour to match the album artwork.

Overview

- The frontend is a static React app that fetches data from a serverless API endpoint `/api/now-playing`.
- The serverless endpoint holds the Spotify credentials (client id + secret) and a refresh token for a single Spotify account. It refreshes access tokens server-side and queries the Spotify API. This way the client never contains a client secret or needs to perform OAuth, and you can keep the client id/secret private.

Important: keep `SPOTIFY_CLIENT_SECRET` and `SPOTIFY_REFRESH_TOKEN` in Vercel (or your server) environment variables. Do NOT commit them.

## Setup (local)

1. Clone the repo and install dependencies:

```powershell
npm install
```

2. Create a Spotify app at https://developer.spotify.com/dashboard and note your Client ID and Client Secret. Keep the secret private.

3. Create a `.env` file at the repo root for local development. Example:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token   # see instructions below to obtain
PORT=3000
```

4. Start the local server and Vite in separate terminals:

```powershell
# terminal 1 - frontend
npm run dev

# terminal 2 - local server (token exchange + now-playing)
npm start
```

The React app will be served at `http://localhost:5173/`. The frontend calls `/now-playing` on the local server which in turn refreshes access tokens using the stored refresh token and returns the currently playing track plus a base64-encoded album image.

## Obtaining a refresh token (one-time)

You need a refresh token for the specific Spotify account whose listening you want to show. The easiest one-time way to obtain it locally is:

1. Start the local server (`npm start`).
2. Visit `http://localhost:3000/auth` in your browser - this will show you a link to authorize with Spotify

   OR build this authorization URL manually (replace CLIENT_ID):

```
https://accounts.spotify.com/authorize?response_type=code&client_id=CLIENT_ID&scope=user-read-currently-playing%20user-read-playback-state%20user-read-recently-played&redirect_uri=http://localhost:3000/callback
```

3. Visit that URL in your browser, sign in with the Spotify account you want to show. Spotify will redirect to `http://localhost:3000/callback?code=...`.
4. Copy the `code` from the redirect URL.
5. Exchange it for tokens by POSTing to the local `/spotify-token` endpoint. Example PowerShell using the built-in server endpoint:

```powershell
# Replace CODE with the code you received
Invoke-RestMethod -Method Post -Uri http://localhost:3000/spotify-token -ContentType 'application/json' -Body (@{ code = 'CODE'; redirect_uri = 'http://localhost:3000/callback' } | ConvertTo-Json)
```

The JSON response will include `refresh_token`. Copy that value and put it in your production environment as `SPOTIFY_REFRESH_TOKEN`.

## Deploy to Vercel (server-side-only flow)

1. Push this repository to GitHub.
2. Create a new project in Vercel from the repo.
3. In Vercel → Settings → Environment Variables, add these keys for Production:

- `SPOTIFY_CLIENT_ID` = your client id
- `SPOTIFY_CLIENT_SECRET` = your client secret
- `SPOTIFY_REFRESH_TOKEN` = the refresh token you retrieved during the one-time exchange

4. Set the Redirect URI on the Spotify Dashboard to your production URL (e.g. `https://lewistough.co.uk/`) for completeness.

With this configuration the frontend never performs OAuth and no client-side secret or client id is required in the bundle. The serverless `/api/now-playing` uses the refresh token to get access tokens on-demand and returns the owner's currently playing track.

## Notes & next steps

- This approach is ideal for a single-user public page (only your listening). For multiple users you'd need to implement per-user auth and storage.
- For extra safety, rotate your refresh token if you ever think it's been leaked, and store tokens in a secure secret store when possible.
- If you want me to implement a tiny admin-only page to do the one-time auth and persist the refresh token directly into a secret store or file, I can add that.

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
