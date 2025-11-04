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

app.post('/recommend', async (req, res) => {
  try {
    const { name, type, recommendation, message } = req.body
    
    // Input validation
    if (!recommendation || typeof recommendation !== 'string') {
      return res.status(400).json({ error: 'Valid recommendation is required' })
    }

    // Sanitize inputs
    const sanitizedName = name && typeof name === 'string' 
      ? name.trim().slice(0, 100).replace(/[<>]/g, '') 
      : 'Anonymous'
    
    const validTypes = ['music', 'movie']
    const sanitizedType = validTypes.includes(type) ? type : 'music'
    
    const sanitizedRecommendation = recommendation
      .trim()
      .slice(0, 200)
      .replace(/[<>]/g, '')
    
    const sanitizedMessage = message && typeof message === 'string'
      ? message.trim().slice(0, 500).replace(/[<>]/g, '')
      : ''

    if (sanitizedRecommendation.length < 2) {
      return res.status(400).json({ error: 'Recommendation too short' })
    }

    // Log the recommendation for local development
    console.log('\n🎵 NEW RECOMMENDATION RECEIVED:')
    console.log('Type:', sanitizedType === 'music' ? 'Music' : 'Movie')
    console.log('From:', sanitizedName)
    console.log('Recommendation:', sanitizedRecommendation)
    if (sanitizedMessage) console.log('Message:', sanitizedMessage)
    console.log('Timestamp:', new Date().toISOString())
    console.log('---\n')

    // In production, this will use the email/SMS service configured in Vercel
    res.json({ success: true })
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: 'server_error' }) 
  }
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
    let nowData = null

    if (nowRes.status === 204) {
      // nothing currently playing; fallback to recently-played
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
    }

    if (!nowData || !nowData.item) {
      console.log('No track data to return')
      return res.status(204).end()
    }

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

// One-time auth helper: visit this to get your refresh token
app.get('/auth', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=user-read-currently-playing%20user-read-playback-state%20user-read-recently-played&redirect_uri=http://127.0.0.1:${process.env.PORT || 3000}/callback`
  res.send(`<h1>Get Refresh Token</h1><p><a href="${authUrl}">Click here to authorize with Spotify</a></p>`)
})

app.get('/callback', async (req, res) => {
  const code = req.query.code
  if (!code) return res.send('<h1>Error: No code received</h1>')
  
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `http://127.0.0.1:${process.env.PORT || 3000}/callback`,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET
    })
    const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', body: params })
    const data = await r.json()
    
    if (data.refresh_token) {
      res.send(`
        <h1>Success!</h1>
        <p>Copy this refresh token and add it to your Vercel environment variables as <code>SPOTIFY_REFRESH_TOKEN</code>:</p>
        <textarea style="width:100%;height:100px;font-family:monospace">${data.refresh_token}</textarea>
        <p>Also add it to your local .env file.</p>
      `)
    } else {
      res.send(`<h1>Error</h1><pre>${JSON.stringify(data, null, 2)}</pre>`)
    }
  } catch (err) {
    res.send(`<h1>Error</h1><pre>${err.message}</pre>`)
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log('local server listening on', PORT))
