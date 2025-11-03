// Server-backed helper for now-playing. The frontend does not perform any OAuth.
const API_BASE = '/api'

// Fetch the owner's currently playing track from the server. The server
// holds the refresh token and client secret so no client-side secret is needed.
export async function getNowPlaying() {
  const res = await fetch(`${API_BASE}/now-playing`)
  if (res.status === 204) return null
  if (!res.ok) throw new Error('Failed to fetch now playing')
  return res.json()
}

