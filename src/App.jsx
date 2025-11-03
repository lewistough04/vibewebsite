import React, { useEffect, useState } from 'react'
import { authorizeUrl, exchangeCodeForToken, refreshToken, getCurrentlyPlaying, proxyImage } from './spotify'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('spotify_access_token'))
  const [refresh, setRefresh] = useState(() => localStorage.getItem('spotify_refresh_token'))
  const [track, setTrack] = useState(null)
  const [bg, setBg] = useState('#111')

  useEffect(() => {
    // handle OAuth redirect with ?code=
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && !token) {
      // exchange on backend
      exchangeCodeForToken(code, window.location.origin).then(saved => {
        setToken(saved.access_token)
        setRefresh(saved.refresh_token)
        localStorage.setItem('spotify_access_token', saved.access_token)
        if (saved.refresh_token) localStorage.setItem('spotify_refresh_token', saved.refresh_token)
        window.history.replaceState({}, document.title, window.location.pathname)
      }).catch(err => console.error(err))
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let mounted = true
    const load = async () => {
      try {
        const playing = await getCurrentlyPlaying(token)
        if (!mounted) return
        if (playing && playing.item) {
          setTrack(playing)
          const img = playing.item.album.images[0]?.url
          if (img) {
            const base64 = await proxyImage(img)
            const color = await getAverageColorFromBase64(base64)
            setBg(color)
          }
        }
      } catch (e) {
        console.error(e)
        // try refresh
        if (refresh) {
          const refreshed = await refreshToken(refresh)
          if (refreshed?.access_token) {
            setToken(refreshed.access_token)
            localStorage.setItem('spotify_access_token', refreshed.access_token)
          }
        }
      }
    }
    load()
    const iv = setInterval(load, 15000)
    return () => { mounted = false; clearInterval(iv) }
  }, [token, refresh])

  function connect() {
    const url = authorizeUrl(window.location.origin)
    window.location.href = url
  }

  return (
    <div className="app" style={{background: `linear-gradient(120deg, ${bg} 0%, #000 85%)`}}>
      <header className="top">
        <h1>Vibe</h1>
        <p>Color-synced portfolio — shows what you're listening to</p>
      </header>

      <main>
        {!token ? (
          <div className="center">
            <button className="btn" onClick={connect}>Connect with Spotify</button>
          </div>
        ) : track ? (
          <div className="track">
            <img src={track.item.album.images[0]?.url} alt="cover" crossOrigin="anonymous" />
            <div className="meta">
              <h2>{track.item.name}</h2>
              <h3>{track.item.artists.map(a=>a.name).join(', ')}</h3>
              <p>Album: {track.item.album.name}</p>
            </div>
          </div>
        ) : (
          <div className="center"><p>Nothing playing right now</p></div>
        )}
      </main>

      <footer className="foot">Deploy this to Vercel and set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET as env vars</footer>
    </div>
  )
}

async function getAverageColorFromBase64(base64) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const w = 40, h = 40
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const data = ctx.getImageData(0,0,w,h).data
      let r=0,g=0,b=0,count=0
      for (let i=0;i<data.length;i+=4){
        const alpha = data[i+3]
        if (alpha>0) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++
        }
      }
      if (count===0) return resolve('#111')
      r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count)
      resolve(`rgb(${r}, ${g}, ${b})`)
    }
    img.onerror = () => resolve('#111')
    img.src = base64
  })
}

export default App
