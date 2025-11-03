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

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log('local server listening on', PORT))
