const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN
    if (!refresh_token) return res.status(500).json({ error: 'no_refresh_token_configured' })

    // Refresh access token
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET
    })
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', body: params })
    const tokenData = await tokenRes.json()
    const access_token = tokenData.access_token
    if (!access_token) return res.status(500).json({ error: 'failed_refresh' })

    // Query currently playing
    const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${access_token}` } })
    if (nowRes.status === 204) return res.status(204).end()
    if (!nowRes.ok) return res.status(nowRes.status).json({ error: 'spotify_error' })
    const nowData = await nowRes.json()

    // fetch album image and return base64 so frontend can access pixels
    let album_base64 = null
    try {
      const imgUrl = nowData.item.album.images[0]?.url
      if (imgUrl) {
        const imgRes = await fetch(imgUrl)
        const buf = await imgRes.arrayBuffer()
        const b = Buffer.from(buf)
        album_base64 = `data:${imgRes.headers.get('content-type')};base64,` + b.toString('base64')
      }
    } catch (e) {
      console.error('image fetch failed', e)
    }

    // attach base64 to response for client use
    nowData.album_base64 = album_base64
    return res.status(200).json(nowData)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
}
