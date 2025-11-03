import React, { useEffect, useState } from 'react'
import { getNowPlaying } from './spotify'

function App() {
  // This site displays only the owner's listening. Tokens are stored server-side.
  const [track, setTrack] = useState(null)
  const [bg, setBg] = useState('#111')
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const playing = await getNowPlaying()
        if (!mounted) return
        if (playing && playing.item) {
          setTrack(playing)
          const base64 = playing.album_base64
          if (base64) {
            const color = await getAverageColorFromBase64(base64)
            setBg(color)
          }
        } else {
          setTrack(null)
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
    const iv = setInterval(load, 15000)
    return () => { mounted = false; clearInterval(iv) }
  }, [])

  return (
    <div className="app" style={{background: `linear-gradient(120deg, ${bg} 0%, #000 85%)`}}>
      <header className="top">
        <h1>Vibe</h1>
        <p>Color-synced portfolio — shows what you're listening to</p>
      </header>

      <main>
        {track ? (
          <div className="track">
            <img src={track.item.album.images[0]?.url || track.album_local_url} alt="cover" crossOrigin="anonymous" />
            <div className="meta">
              <h2>{track.item.name}</h2>
              <h3>{track.item.artists.map(a=>a.name).join(', ')}</h3>
              <p>Album: {track.item.album.name}</p>
            </div>
          </div>
        ) : (
          <div className="center"><p>Not playing right now</p></div>
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
