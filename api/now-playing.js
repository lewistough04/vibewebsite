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

    // Query currently playing (per Spotify docs)
    const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${access_token}` } })
    let nowData = null

    if (nowRes.status === 204) {
      // nothing currently playing; fall back to recently-played
      console.log('No current playback, fetching recently-played...')
      const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers: { Authorization: `Bearer ${access_token}` } })
      if (recentRes.ok) {
        const recentData = await recentRes.json()
        console.log('Recently-played response:', JSON.stringify(recentData, null, 2))
        const item = recentData.items && recentData.items[0] && recentData.items[0].track ? recentData.items[0].track : null
        if (item) {
          nowData = { item, is_playing: false, played_at: recentData.items[0].played_at }
          console.log('Set nowData from recently-played:', nowData.item.name)
        } else {
          console.log('No items in recently-played response')
        }
      } else {
        console.log('Recently-played request failed:', recentRes.status)
      }
    } else if (!nowRes.ok) {
      console.log('Currently-playing error:', nowRes.status)
      return res.status(nowRes.status).json({ error: 'spotify_error' })
    } else {
      nowData = await nowRes.json()
      console.log('Currently playing:', nowData.item?.name)
      // Ensure is_playing is set correctly for currently playing tracks
      if (nowData.is_playing === undefined) {
        nowData.is_playing = true
      }
    }

    if (!nowData || !nowData.item) {
      console.log('No track data to return')
      return res.status(204).end()
    }

    console.log('Returning track data with is_playing:', nowData.is_playing, 'played_at:', nowData.played_at)

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
