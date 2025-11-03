import React, { useEffect, useState } from 'react'
import { getNowPlaying } from './spotify'

function App() {
  const [track, setTrack] = useState(null)
  const [bgColor, setBgColor] = useState('#1a1a1a')
  const [activeSection, setActiveSection] = useState('home')

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
            setBgColor(color)
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
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">🎵</div>
          <span>Lewis Tough</span>
        </div>
        
        <nav>
          <ul className="nav-links">
            <li 
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => setActiveSection('home')}
            >
              🏠 Home
            </li>
            <li 
              className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              👤 About
            </li>
            <li 
              className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveSection('projects')}
            >
              💼 Projects
            </li>
            <li 
              className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveSection('skills')}
            >
              ⚡ Skills
            </li>
            <li 
              className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveSection('contact')}
            >
              📧 Contact
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Now Playing Hero Section */}
        {track ? (
          <div className="now-playing-hero" style={{'--bg-color': bgColor}}>
            <img 
              src={track.item.album.images[0]?.url} 
              alt={track.item.name}
              className="album-art-large"
              crossOrigin="anonymous"
            />
            <div className="track-info">
              <div className="track-label">
                {track.is_playing ? '🎵 Now Playing' : '🕐 Last Played'}
              </div>
              <h1 className="track-title">{track.item.name}</h1>
              <p className="track-artist">
                {track.item.artists.map(a => a.name).join(', ')}
              </p>
              <p className="track-album">{track.item.album.name}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h2>🎧 Nothing playing right now</h2>
            <p>Check back soon to see what I'm listening to!</p>
          </div>
        )}

        {/* Portfolio Content Based on Active Section */}
        {activeSection === 'home' && <HomeSection />}
        {activeSection === 'about' && <AboutSection />}
        {activeSection === 'projects' && <ProjectsSection />}
        {activeSection === 'skills' && <SkillsSection />}
        {activeSection === 'contact' && <ContactSection />}
      </main>
    </div>
  )
}

// Portfolio Section Components
function HomeSection() {
  return (
    <div className="section">
      <h2 className="section-header">Welcome to My Portfolio</h2>
      <div className="section-content">
        <div className="card">
          <h3>👋 Hi, I'm Lewis Tough</h3>
          <p>
            A passionate developer who loves building cool things. 
            This portfolio syncs with my Spotify to show what I'm currently listening to!
          </p>
        </div>
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="section">
      <h2 className="section-header">About Me</h2>
      <div className="section-content">
        <div className="card">
          <h3>🎯 What I Do</h3>
          <p>
            I'm a developer focused on creating modern, user-friendly applications.
            I enjoy working with the latest technologies and building projects that solve real problems.
          </p>
        </div>
        <div className="card">
          <h3>🎨 My Approach</h3>
          <p>
            I believe in clean code, great design, and user experience. 
            Every project is an opportunity to learn something new and push boundaries.
          </p>
        </div>
      </div>
    </div>
  )
}

function ProjectsSection() {
  const projects = [
    {
      title: '🎵 Spotify Portfolio',
      description: 'A dynamic portfolio that syncs with Spotify to display currently playing music and adapts colors to album artwork.',
      tech: 'React, Vite, Spotify API, Vercel'
    },
    {
      title: '🚀 Your Project Here',
      description: 'Add your own projects by editing the App.jsx file. Each project can showcase your skills and achievements.',
      tech: 'Your tech stack'
    }
  ]

  return (
    <div className="section">
      <h2 className="section-header">Projects</h2>
      <div className="section-content">
        {projects.map((project, i) => (
          <div key={i} className="card">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p style={{marginTop: '12px', fontSize: '12px', color: '#1db954'}}>
              {project.tech}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsSection() {
  const skills = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 
    'Python', 'HTML/CSS', 'Git', 'API Development',
    'Vite', 'Vercel', 'Express', 'REST APIs'
  ]

  return (
    <div className="section">
      <h2 className="section-header">Skills & Technologies</h2>
      <div className="skills-grid">
        {skills.map((skill, i) => (
          <div key={i} className="skill-tag">{skill}</div>
        ))}
      </div>
    </div>
  )
}

function ContactSection() {
  return (
    <div className="section">
      <h2 className="section-header">Get In Touch</h2>
      <div className="section-content">
        <div className="card">
          <h3>📧 Email</h3>
          <p>your.email@example.com</p>
        </div>
        <div className="card">
          <h3>💼 LinkedIn</h3>
          <p>linkedin.com/in/yourprofile</p>
        </div>
        <div className="card">
          <h3>🐙 GitHub</h3>
          <p>github.com/lewistough04</p>
        </div>
      </div>
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
      if (count===0) return resolve('#1a1a1a')
      r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count)
      resolve(`rgb(${r}, ${g}, ${b})`)
    }
    img.onerror = () => resolve('#1a1a1a')
    img.src = base64
  })
}

export default App
