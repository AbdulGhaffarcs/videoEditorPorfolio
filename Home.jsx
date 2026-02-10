import React, { useState, useEffect, useRef } from 'react'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DATA_SOURCE_URL     = import.meta.env.VITE_DATA_SOURCE_URL     || '/projects.json'
const APPS_SCRIPT_URL     = import.meta.env.VITE_APPS_SCRIPT_URL     || ''
const RESUME_URL          = import.meta.env.VITE_RESUME_URL          || '/resume.pdf'

// ─── SAMPLE DATA (used if JSON fetch fails) ────────────────────────────────
const FALLBACK_PROJECTS = [
  {
    title: 'Beyond the Summit',
    type: 'Documentary',
    thumbnail: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=500&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'A documentary exploring the challenges of mountain climbing in the Himalayas.',
  },
  {
    title: 'Future Vision',
    type: 'Commercial',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=500&fit=crop',
    videoUrl: 'https://vimeo.com/148751763',
    description: 'Tech company commercial showcasing innovative AI solutions.',
  },
  {
    title: 'Midnight Echo',
    type: 'Music Video',
    thumbnail: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=500&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Atmospheric music video featuring neon-lit urban landscapes.',
  },
  {
    title: 'The Last Frame',
    type: 'Short Film',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=500&fit=crop',
    videoUrl: 'https://vimeo.com/148751763',
    description: 'Award-winning short film about a photographer\'s final assignment.',
  },
  {
    title: 'Noir Collection',
    type: 'Fashion Campaign',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=500&fit=crop',
    videoUrl: '',
    description: 'High-fashion campaign with dramatic lighting and elegant movements.',
  },
  {
    title: 'Origin Stories',
    type: 'Brand Film',
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=500&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Brand film exploring the heritage of a legacy company.',
  },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getEmbedUrl(url) {
  if (!url) return ''
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.includes('youtu.be')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${id}?autoplay=1`
  }
  if (url.includes('vimeo.com')) {
    const id = url.split('vimeo.com/')[1]?.split('?')[0]
    return `https://player.vimeo.com/video/${id}?autoplay=1`
  }
  if (url.includes('drive.google.com')) {
    const match = url.match(/[-\w]{25,}/)
    return match ? `https://drive.google.com/file/d/${match[0]}/preview` : url
  }
  return url
}

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4500)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  return (
    <div className={`toast ${toast.type}`}>
      <div className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-msg">{toast.msg}</div>
      </div>
    </div>
  )
}

// ─── VIDEO MODAL ──────────────────────────────────────────────────────────────
function VideoModal({ project, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-meta">
            <span className="modal-type">{project.type}</span>
            <h3 className="modal-title">{project.title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-video">
          <iframe
            src={getEmbedUrl(project.videoUrl)}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        </div>
        {project.description && (
          <p className="modal-desc">{project.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function ContactForm({ addToast }) {
  const [form, setForm]       = useState({ name: '', email: '', service: '', message: '' })
  const [status, setStatus]   = useState('idle') // idle | sending | success | error

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!APPS_SCRIPT_URL) {
      addToast({
        type: 'error',
        title: 'Not Configured',
        msg: 'Please add your Google Apps Script URL to the .env file.',
      })
      return
    }
    setStatus('sending')
    try {
      const payload = new FormData()
      payload.append('name',    form.name)
      payload.append('email',   form.email)
      payload.append('service', form.service)
      payload.append('message', form.message)

      await fetch(APPS_SCRIPT_URL, { method: 'POST', body: payload, mode: 'no-cors' })

      setStatus('success')
      setForm({ name: '', email: '', service: '', message: '' })
      addToast({
        type: 'success',
        title: 'Message Sent!',
        msg: 'Thanks for reaching out. I\'ll be in touch within 24 hours.',
      })
    } catch (err) {
      setStatus('error')
      addToast({
        type: 'error',
        title: 'Send Failed',
        msg: 'Something went wrong. Please email me directly.',
      })
    } finally {
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name" name="name" type="text"
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email" name="email" type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="service">Project Type</label>
        <select
          id="service" name="service"
          value={form.service}
          onChange={handleChange}
          required
        >
          <option value="">Select a service…</option>
          <option value="Documentary">Documentary</option>
          <option value="Commercial">Commercial</option>
          <option value="Music Video">Music Video</option>
          <option value="Short Film">Short Film</option>
          <option value="Corporate Video">Corporate Video</option>
          <option value="Brand Film">Brand Film</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message" name="message"
          placeholder="Tell me about your project, timeline, and budget…"
          value={form.message}
          onChange={handleChange}
          required
        />
      </div>

      <button
        className="btn-submit"
        type="submit"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? (
          <><div className="spinner" /> Sending…</>
        ) : status === 'success' ? (
          <>✓ Message Sent</>
        ) : (
          <>Send Message →</>
        )}
      </button>
    </form>
  )
}

// ─── MAIN HOME PAGE ───────────────────────────────────────────────────────────
export default function Home() {
  const [projects,      setProjects]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modalProject,  setModalProject]  = useState(null)
  const [toasts,        setToasts]        = useState([])
  const [scrolled,      setScrolled]      = useState(false)

  // Header scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Block body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalProject ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalProject])

  // Fetch projects
  useEffect(() => {
    fetch(DATA_SOURCE_URL)
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .catch(() => setProjects(FALLBACK_PROJECTS))
      .finally(() => setLoading(false))
  }, [])

  // Toast helpers
  const addToast   = (t) => setToasts(prev => [...prev, { ...t, id: Date.now() }])
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <>
      {/* ── HEADER ── */}
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="logo">AR</div>
        <nav>
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Video Editor & Post-Production Specialist</p>
          <h1>Crafting Stories<br /><em>Through Motion</em></h1>
          <p className="hero-sub">
            Award-winning editor specialising in documentaries, brand films, and commercial work
            that moves audiences and drives results.
          </p>
          <div className="hero-buttons">
            <a href="#work" className="btn btn-primary">View Selected Work</a>
            <a href={RESUME_URL} className="btn btn-secondary" download>Download Résumé</a>
          </div>
        </div>
        <div className="scroll-line">
          <span>Scroll</span>
          <div className="scroll-line-bar" />
        </div>
      </section>

      {/* ── PORTFOLIO ── */}
      <section className="portfolio" id="work">
        <div className="section-header">
          <span className="section-label">Selected Projects</span>
          <h2 className="section-title">Recent Work</h2>
        </div>

        <div className="portfolio-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" />
              ))
            : projects.map((project, i) => (
                <div
                  key={i}
                  className={`project-card${!project.videoUrl ? ' no-video-card' : ''}`}
                  onClick={() => project.videoUrl && setModalProject(project)}
                >
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="project-thumbnail"
                    loading="lazy"
                  />
                  <span className="project-badge">{project.type}</span>
                  {project.videoUrl && (
                    <div className="project-play">
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="white">
                        <path d="M0 0l14 8L0 16V0z" />
                      </svg>
                    </div>
                  )}
                  <div className="project-overlay">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-type">{project.type}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* ── VIDEO MODAL ── */}
      {modalProject && (
        <VideoModal project={modalProject} onClose={() => setModalProject(null)} />
      )}

      {/* ── ABOUT ── */}
      <section className="about" id="about">
        <div className="about-grid">
          <div className="about-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=faces"
              alt="Alex Rivera"
              className="profile-img"
            />
            <div className="about-image-accent" />
          </div>

          <div className="about-text">
            <span className="section-label">About Me</span>
            <h2>8 Years Telling Stories<br />That Matter</h2>
            <p>
              I'm Alex Rivera — a Los Angeles-based video editor with a passion for
              narrative-driven content. From documentary features to 30-second commercials,
              I bring the same obsessive attention to pacing, rhythm, and emotion.
            </p>
            <p>
              My work has aired on Netflix, won at Sundance, and driven millions in revenue
              for Fortune 500 brands. Every cut is intentional. Every frame earns its place.
            </p>
            <div className="skills-list">
              {['Premiere Pro', 'DaVinci Resolve', 'After Effects', 'Avid', 'Color Grading', 'Sound Design', 'Motion Graphics'].map(s => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="stats-row">
          {[
            { num: '120+', lbl: 'Projects Completed' },
            { num: '8',    lbl: 'Years Experience' },
            { num: '15+',  lbl: 'Awards Won' },
            { num: '50+',  lbl: 'Happy Clients' },
          ].map(s => (
            <div key={s.lbl} className="stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="contact" id="contact">
        <div className="contact-layout">
          <div className="contact-info">
            <span className="section-label">Get in Touch</span>
            <h2>Let's Create Something Together</h2>
            <p>
              Have a project in mind? Whether it's a documentary, commercial, or music video —
              I'd love to hear about it. Fill in the form and I'll get back to you within 24 hours.
            </p>
            <a href="mailto:alex@alexrivera.com" className="contact-email-link">
              alex@alexrivera.com <span>→</span>
            </a>
          </div>
          <ContactForm addToast={addToast} />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-logo">AR</div>
        <div className="footer-links">
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://vimeo.com"     target="_blank" rel="noreferrer">Vimeo</a>
          <a href="https://linkedin.com"  target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
        <div className="footer-copy">© 2026 Alex Rivera</div>
      </footer>

      {/* ── TOASTS ── */}
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </>
  )
}