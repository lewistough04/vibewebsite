// Exchange authorization code for tokens (server-side)
// Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in env
const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { code, redirect_uri } = req.body
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET
    })
    const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', body: params })
    const data = await r.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
}
