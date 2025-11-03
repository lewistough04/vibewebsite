// Lightweight helper functions for OAuth + Spotify API calls.
const API_BASE = '/api'

export function authorizeUrl(origin) {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const redirect = `${origin}/`
  const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state'
  ].join(' ')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirect,
    show_dialog: 'true'
  })
  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function exchangeCodeForToken(code, origin) {
  const res = await fetch(`${API_BASE}/spotify-token`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ code, redirect_uri: `${origin}/` })
  })
  if (!res.ok) throw new Error('Token exchange failed')
  return res.json()
}

export async function refreshToken(refresh_token) {
  const res = await fetch(`${API_BASE}/refresh-token`, {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({ refresh_token })
  })
  if (!res.ok) return null
  return res.json()
}

export async function getCurrentlyPlaying(access_token) {
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${access_token}` }
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error('Failed to fetch currently playing')
  return res.json()
}

// Ask server to fetch image and return base64 string.
export async function proxyImage(url) {
  const res = await fetch(`${API_BASE}/proxy-image`, {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({ url })
  })
  if (!res.ok) throw new Error('Image proxy failed')
  const { base64 } = await res.json()
  return base64
}
