const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { refresh_token } = req.body
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
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
