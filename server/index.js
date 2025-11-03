// Local dev Express server to proxy token exchange when running locally
require('dotenv').config()
const express = require('express')
const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.post('/spotify-token', async (req, res) => {
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
    res.json(data)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'server_error' })
  }
})

app.post('/refresh-token', async (req, res) => {
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
    res.json(data)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'server_error' })
  }
})

app.post('/proxy-image', async (req, res) => {
  try {
    const { url } = req.body
    const r = await fetch(url)
    const buf = await r.arrayBuffer()
    const b = Buffer.from(buf)
    const base64 = `data:${r.headers.get('content-type')};base64,` + b.toString('base64')
    res.json({ base64 })
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }) }
})

// Local now-playing route: uses SPOTIFY_REFRESH_TOKEN from .env to fetch the owner's
// currently playing track. Set SPOTIFY_REFRESH_TOKEN in your local .env after running
// the one-time auth flow to produce a refresh token.
app.get('/now-playing', async (req, res) => {
  try {
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN
    if (!refresh_token) return res.status(500).json({ error: 'no_refresh_token_configured' })

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

    const nowRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${access_token}` } })
    if (nowRes.status === 204) return res.status(204).end()
    if (!nowRes.ok) return res.status(nowRes.status).json({ error: 'spotify_error' })
    const nowData = await nowRes.json()

    let album_base64 = null
    try {
      const imgUrl = nowData.item.album.images[0]?.url
      if (imgUrl) {
        const imgRes = await fetch(imgUrl)
        const buf = await imgRes.arrayBuffer()
        const b = Buffer.from(buf)
        album_base64 = `data:${imgRes.headers.get('content-type')};base64,` + b.toString('base64')
      }
    } catch (e) { console.error('image fetch failed', e) }

    nowData.album_base64 = album_base64
    res.json(nowData)
  } catch (err) { console.error(err); res.status(500).json({ error: 'server_error' }) }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log('local server listening on', PORT))
