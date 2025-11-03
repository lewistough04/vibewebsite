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
        console.log('Received track data:', playing)
        if (playing && playing.item) {
          setTrack(playing)
          const base64 = playing.album_base64
          if (base64) {
            const color = await getAverageColorFromBase64(base64)
            setBgColor(color)
          }
        } else {
          console.log('No track data received')
          setTrack(null)
        }
      } catch (e) {
        console.error('Error loading track:', e)
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
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <span>Lewis Tough</span>
        </div>
        
        <nav>
          <ul className="nav-links">
            <li 
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => setActiveSection('home')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              <span>Home</span>
            </li>
            <li 
              className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>About</span>
            </li>
            <li 
              className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveSection('projects')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/>
              </svg>
              <span>Projects</span>
            </li>
            <li 
              className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveSection('skills')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
              </svg>
              <span>Skills</span>
            </li>
            <li 
              className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveSection('contact')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span>Contact</span>
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
                <div className="status-indicator">
                  {track.is_playing && <span className="pulse"></span>}
                  {track.is_playing ? 'NOW PLAYING' : `LAST PLAYED • ${getTimeAgo(track.played_at).toUpperCase()}`}
                </div>
              </div>
              <h1 className="track-title">{track.item.name}</h1>
              <p className="track-artist">
                {track.item.artists.map(a => a.name).join(', ')}
              </p>
              <p className="track-album">{track.item.album.name}</p>
              
              {/* Spotify Embed Player */}
              <div className="player-embed" style={{marginTop: '24px'}}>
                <iframe 
                  style={{borderRadius: '12px'}}
                  src={`https://open.spotify.com/embed/track/${track.item.id}?utm_source=generator&theme=0`}
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allowFullScreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  title="Spotify Player"
                ></iframe>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <h2>Nothing playing right now</h2>
            <p>Check back soon to see what I'm listening to</p>
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
          <h3>Hi, I'm Lewis Tough</h3>
          <p>
            I'm a software developer passionate about building innovative web applications and solving complex problems. 
            With experience in full-stack development, hackathons, and competitive programming, I create solutions that blend 
            technical excellence with user-friendly design.
          </p>
          <p style={{marginTop: '12px'}}>
            This portfolio syncs with my Spotify in real-time to show what I'm currently listening to - 
            and you can listen along too! The background colors adapt to match the album artwork.
          </p>
          <p style={{marginTop: '12px', fontSize: '14px', color: '#b3b3b3'}}>
            I Built this website for fun with music in mind and to try out some vibecoding
          </p>
        </div>
        <div className="card">
          <h3>Quick Highlights</h3>
          <p>
            8+ projects spanning web development, game development, and systems programming<br/>
            Multiple hackathon participations with recognition<br/>
            Proficient in React, Django, Python, and modern web technologies<br/>
            Strong collaboration and communication skills from team-based projects<br/>
            Active committee member of Glasgow University Tech Society
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
          <h3>What I Do</h3>
          <p>
            I'm a software developer with a passion for building full-stack web applications and solving complex problems.
            I specialize in creating interactive, user-friendly solutions using modern technologies like React, Django, and various APIs.
          </p>
        </div>
        <div className="card">
          <h3>Hackathon Experience</h3>
          <p>
            I've competed in multiple hackathons including GUTS (Glasgow University Tech Society) events, 
            where I've developed fully functional webapps in 24-hour sprints and received recognition for innovation.
            I thrive in fast-paced, collaborative environments.
          </p>
        </div>
        <div className="card">
          <h3>My Approach</h3>
          <p>
            I believe in practical problem-solving and clean code. Whether it's algorithms and data structures 
            challenges or building complete web applications, I focus on creating solutions that work efficiently 
            and provide real value to users.
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
      description: 'A dynamic portfolio that syncs with Spotify to display currently playing music and adapts colors to album artwork. Features an embedded player for visitors to listen along.',
      tech: 'React, Vite, Spotify API, Node.js, Vercel',
      link: 'vibewebsitevercel.vercel.app'
    },
    {
      title: '🎸 Do You Have the GUTS Hackathon 2024',
      description: 'Worked in a team to deploy a fully functional webapp in 24 hours using the GuitarGuitar API. Built a comprehensive music gear browsing and recommendation system.',
      tech: 'Django, REST API, React',
      link: 'dyhtg.com'
    },
    {
      title: '🧠 Good for Code - JPMorgan Chase',
      description: 'Developed a prototype webapp that generates catered playlists for dementia patients with minimal input about their music taste. Focused on accessibility and user experience.',
      tech: 'Spotify API, React, Machine Learning',
      link: null
    },
    {
      title: '🌱 Gardening Company Website',
      description: 'Currently developing a professional webapp for an Edinburgh-based gardening company. Features service showcase, booking system, and responsive design.',
      tech: 'React, Node.js, PostgreSQL',
      link: null
    },
    {
      title: '🎮 Game Review Website',
      description: 'Built a comprehensive game rating and review platform with multifaceted search system, user profiles, and password strength validation.',
      tech: 'Django, Python, SQLite, JavaScript',
      link: null
    },
    {
      title: '🪐 Gravity Simulator',
      description: 'Created an N-body gravity simulator featuring complex physics calculations and real-time visualization of celestial mechanics.',
      tech: 'Python, NumPy, Pygame',
      link: null
    },
    {
      title: '📁 File Transfer System',
      description: 'Implemented a robust file transfer system using TCP sockets with error handling and progress tracking.',
      tech: 'Python, Socket Programming, TCP',
      link: null
    },
    {
      title: '🕹️ Platformer Game',
      description: 'Developed a full-featured platformer with custom level editor, friendly UI, and SQL web server for high score storage.',
      tech: 'Python, Pygame, SQL',
      link: null
    }
  ]

  return (
    <div className="section">
      <h2 className="section-header">Projects & Hackathons</h2>
      <div className="section-content">
        {projects.map((project, i) => (
          <div key={i} className="card">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p style={{marginTop: '12px', fontSize: '12px', color: '#1db954', fontWeight: '600'}}>
              {project.tech}
            </p>
            {project.link && (
              <p style={{marginTop: '8px', fontSize: '12px', color: '#b3b3b3'}}>
                🔗 {project.link}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsSection() {
  const skills = [
    'React', 'Django', 'Python', 'JavaScript', 
    'Node.js', 'REST API', 'Spotify API', 'PostgreSQL',
    'SQLite', 'TCP Sockets', 'Git', 'HTML/CSS',
    'Pygame', 'NumPy', 'Vite', 'Vercel',
    'Algorithms', 'Data Structures', 'Socket Programming', 'Machine Learning'
  ]

  return (
    <div className="section">
      <h2 className="section-header">Skills & Technologies</h2>
      <div className="skills-grid">
        {skills.map((skill, i) => (
          <div key={i} className="skill-tag">{skill}</div>
        ))}
      </div>
      
      <div className="section" style={{marginTop: '48px'}}>
        <h3 className="section-header" style={{fontSize: '20px'}}>🏆 Achievements</h3>
        <div className="section-content">
          <div className="card">
            <h3>GUTS Code Olympics 2024</h3>
            <p>Utilized algorithms and data structures to solve complex problems. Demonstrated excellent communication and teamwork skills in competitive programming environment.</p>
          </div>
          <div className="card">
            <h3>Do You Have the GUTS Hackathon 2022</h3>
            <p>Received an honourable mention for innovative project in competitive tech environment. Built strong collaboration and communication skills.</p>
          </div>
        </div>
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
          <h3>� GitHub</h3>
          <p style={{color: '#1db954', cursor: 'pointer'}} onClick={() => window.open('https://github.com/lewistough04', '_blank')}>
            github.com/lewistough04
          </p>
        </div>
        <div className="card">
          <h3>💼 LinkedIn</h3>
          <p>Connect with me on LinkedIn to discuss opportunities and collaborations.</p>
        </div>
        <div className="card">
          <h3>📧 Email</h3>
          <p>Feel free to reach out for project inquiries or collaboration opportunities.</p>
        </div>
        <div className="card">
          <h3>🏫 Education</h3>
          <p>Glasgow University Tech Society Member - Active participant in hackathons and coding challenges.</p>
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

function getTimeAgo(timestamp) {
  if (!timestamp) return ''
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
}

export default App
