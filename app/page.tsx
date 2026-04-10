'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type ModalType = 'login' | 'signup' | null

function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupReferral, setSignupReferral] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: 'Season 4 Investment Query',
    message: '',
  })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactMsg, setContactMsg] = useState('')

  useEffect(() => {
    const modal = searchParams.get('modal')
    if (modal === 'login') setActiveModal('login')
    if (modal === 'signup') setActiveModal('signup')
  }, [searchParams])

  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : ''
  }, [activeModal])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let candles: any[] = [],
      lines: any[] = [],
      W = 0,
      H = 0,
      animId = 0
    function resize() {
      if (!canvas) return
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      initCandles()
      initLines()
    }
    function initCandles() {
      candles = []
      const count = Math.floor(W / 48)
      for (let i = 0; i < count; i++)
        candles.push({
          x: (i / count) * W + Math.random() * 40,
          y: H * 0.3 + Math.random() * H * 0.5,
          w: 10 + Math.random() * 8,
          h: 20 + Math.random() * 60,
          up: Math.random() > 0.4,
          speed: 0.2 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          wick: 8 + Math.random() * 20,
        })
    }
    function initLines() {
      lines = []
      for (let i = 0; i < 4; i++) {
        const pts: any[] = []
        for (let x = 0; x <= W; x += 40)
          pts.push({ x, y: H * (0.2 + i * 0.18) + Math.random() * 60 })
        lines.push({
          pts,
          speed: 0.15 + i * 0.05,
          phase: i * 1.2,
          amp: 18 + i * 8,
        })
      }
    }
    function drawCandles(t: number) {
      candles.forEach((c) => {
        const bob = Math.sin(t * c.speed + c.phase) * 8,
          x = c.x,
          y = c.y + bob
        ctx.strokeStyle = 'rgba(28,28,28,1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + c.w / 2, y - c.wick)
        ctx.lineTo(x + c.w / 2, y + c.h + c.wick)
        ctx.stroke()
        ctx.fillStyle = c.up ? 'rgba(74,103,65,1)' : 'rgba(184,147,90,1)'
        ctx.fillRect(x, y, c.w, c.h)
        ctx.strokeRect(x, y, c.w, c.h)
      })
    }
    function drawLines(t: number) {
      lines.forEach((l, i) => {
        ctx.beginPath()
        l.pts.forEach((p: any, j: number) => {
          const y = p.y + Math.sin(t * l.speed + j * 0.3 + l.phase) * l.amp
          j === 0 ? ctx.moveTo(p.x, y) : ctx.lineTo(p.x, y)
        })
        ctx.strokeStyle =
          i % 2 === 0 ? 'rgba(74,103,65,0.8)' : 'rgba(184,147,90,0.6)'
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }
    let t = 0
    function animate() {
      ctx.clearRect(0, 0, W, H)
      t += 0.012
      drawLines(t)
      drawCandles(t)
      animId = requestAnimationFrame(animate)
    }
    window.addEventListener('resize', resize)
    resize()
    animate()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((r) => obs.observe(r))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const nav = document.getElementById('navbar')
    const h = () => {
      if (nav)
        nav.style.borderBottomColor =
          window.scrollY > 40 ? 'rgba(184,147,90,0.2)' : 'var(--border)'
    }
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const openModal = (type: ModalType) => {
    setActiveModal(type)
    setMenuOpen(false)
  }
  const closeModal = () => {
    setActiveModal(null)
    setShowForgot(false)
    setLoginError('')
    setForgotMsg('')
    setSignupError('')
    setSignupSuccess(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) {
      setLoginError(error.message)
      setLoginLoading(false)
      return
    }
    router.push('/dashboard')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError('')
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: signupName, referral_code: signupReferral },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      setSignupError(error.message)
      setSignupLoading(false)
      return
    }
    setSignupSuccess(true)
    setSignupLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setForgotLoading(false)
    setForgotMsg(
      error ? error.message : 'Password reset link sent! Check your inbox.',
    )
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault()
    setContactLoading(true)
    setContactMsg('')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactForm),
    })
    const data = await res.json()
    setContactLoading(false)
    setContactMsg(
      data.success
        ? "Message sent! We'll respond within 24 hours."
        : data.error || 'Failed to send.',
    )
    if (data.success)
      setContactForm({
        firstName: '',
        lastName: '',
        email: '',
        subject: 'Season 4 Investment Query',
        message: '',
      })
  }

  return (
    <>
      <style>{`
        :root{--ink:#1c1c1c;--cream:#f6f1e9;--parchment:#ede7da;--gold:#b8935a;--gold-light:#d4aa72;--sage:#4a6741;--sage-light:#6a8c60;--mist:#8e9b8a;--charcoal:#2e2e2e;--surface:#faf7f2;--border:rgba(184,147,90,0.18);--text-secondary:#6b6459;--radius:4px}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth;font-size:16px}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--parchment)}::-webkit-scrollbar-thumb{background:var(--gold);border-radius:10px}
        #bg-canvas{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.06}
        body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:1;opacity:0.5}
        nav{position:fixed;top:0;width:100%;z-index:1000;padding:0 5%;background:rgba(246,241,233,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);transition:all 0.3s ease}
        .nav-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:64px}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
        .logo-mark{width:32px;height:32px;background:var(--ink);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
        .logo-mark::after{content:'';position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:14px;height:1.5px;background:var(--gold);border-radius:2px;box-shadow:0 -5px 0 var(--gold-light),0 -10px 0 var(--cream)}
        .logo-text{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:600;color:var(--ink);letter-spacing:0.05em}
        .logo-text span{color:var(--gold)}
        .nav-links{display:flex;align-items:center;gap:36px;list-style:none}
        .nav-links a{text-decoration:none;color:var(--charcoal);font-size:0.82rem;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;position:relative;transition:color 0.2s;cursor:pointer}
        .nav-links a::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:1px;background:var(--gold);transition:width 0.3s ease}
        .nav-links a:hover{color:var(--gold)}.nav-links a:hover::after{width:100%}
        .nav-actions{display:flex;align-items:center;gap:10px}
        .btn-ghost{padding:8px 18px;background:transparent;border:1px solid var(--border);color:var(--charcoal);font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:400;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:all 0.25s}
        .btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
        .btn-primary{padding:9px 22px;background:var(--ink);border:1px solid var(--ink);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:all 0.25s}
        .btn-primary:hover{background:var(--gold);border-color:var(--gold)}
        .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;background:none;border:none}
        .hamburger span{display:block;width:22px;height:1.5px;background:var(--ink);transition:all 0.3s}
        .mobile-menu{display:none;position:fixed;top:64px;left:0;width:100%;background:var(--cream);border-bottom:1px solid var(--border);padding:24px 5% 32px;z-index:999;flex-direction:column;gap:0;transform:translateY(-10px);opacity:0;pointer-events:none;transition:all 0.3s ease}
        .mobile-menu.open{display:flex;opacity:1;pointer-events:all;transform:translateY(0)}
        .mobile-menu a{text-decoration:none;color:var(--ink);font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer;display:block}
        .mobile-menu .mob-actions{display:flex;flex-direction:column;gap:10px;margin-top:20px}
        .mob-actions .btn-ghost,.mob-actions .btn-primary{width:100%;text-align:center;padding:12px}
        .hero{position:relative;z-index:2;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:100px 5% 80px}
        .hero-inner{max-width:900px;width:100%;text-align:center}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(184,147,90,0.1);border:1px solid rgba(184,147,90,0.25);padding:6px 16px;border-radius:100px;font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:36px;animation:fadeUp 0.8s ease both}
        .hero-badge::before{content:'';width:6px;height:6px;background:var(--gold);border-radius:50%;animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}
        .hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(2.6rem,7vw,5rem);font-weight:400;line-height:1.12;letter-spacing:-0.01em;color:var(--ink);margin-bottom:28px;animation:fadeUp 0.8s 0.1s ease both}
        .hero h1 em{font-style:italic;color:var(--gold)}
        .hero p{font-size:clamp(0.9rem,2.5vw,1.05rem);color:var(--text-secondary);font-weight:300;line-height:1.8;max-width:520px;margin:0 auto 44px;animation:fadeUp 0.8s 0.2s ease both}
        .hero-cta{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;animation:fadeUp 0.8s 0.3s ease both}
        .btn-lg{padding:14px 36px;background:var(--ink);color:var(--cream);border:1px solid var(--ink);font-family:'DM Sans',sans-serif;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:all 0.3s;position:relative;overflow:hidden}
        .btn-lg::after{content:'';position:absolute;inset:0;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform 0.3s ease;z-index:-1}
        .btn-lg:hover{border-color:var(--gold);color:var(--cream)}.btn-lg:hover::after{transform:scaleX(1)}
        .btn-outline-lg{padding:14px 36px;background:transparent;color:var(--ink);border:1px solid rgba(28,28,28,0.25);font-family:'DM Sans',sans-serif;font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:all 0.3s}
        .btn-outline-lg:hover{border-color:var(--gold);color:var(--gold)}
        .stats-bar{position:relative;z-index:2;background:var(--ink);padding:16px 5%;overflow:hidden}
        .stats-track{display:flex;gap:60px;animation:scroll 25s linear infinite;width:max-content}
        .stats-track:hover{animation-play-state:paused}
        .stat-item{display:flex;align-items:center;gap:10px;white-space:nowrap;color:var(--cream);font-size:0.78rem;letter-spacing:0.06em;text-transform:uppercase}
        .stat-item strong{color:var(--gold-light)}
        .stat-sep{width:4px;height:4px;background:var(--gold);border-radius:50%;opacity:0.5}
        @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        section{position:relative;z-index:2}
        .section-label{font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;display:block}
        .section-title{font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,5vw,3rem);font-weight:400;line-height:1.2;color:var(--ink)}
        .section-sub{font-size:0.9rem;color:var(--text-secondary);font-weight:300;line-height:1.8;margin-top:14px}
        .platform-stats{padding:100px 5%;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .platform-stats .inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px 80px;align-items:center}
        .stats-text .section-sub{max-width:380px}
        .stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
        .stat-card{background:var(--cream);border:1px solid var(--border);padding:28px 24px;position:relative;overflow:hidden;transition:all 0.3s}
        .stat-card:hover{border-color:var(--gold)}
        .stat-card::before{content:'';position:absolute;top:0;left:0;width:2px;height:0;background:var(--gold);transition:height 0.4s}
        .stat-card:hover::before{height:100%}
        .stat-number{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:500;color:var(--ink);line-height:1;margin-bottom:8px}
        .stat-number span{color:var(--gold)}
        .stat-desc{font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary)}
        .stat-trend{position:absolute;top:16px;right:16px;font-size:0.7rem;color:var(--sage);background:rgba(74,103,65,0.08);padding:3px 8px;border-radius:100px}
        .seasons{padding:100px 5%}
        .seasons-inner{max-width:1200px;margin:0 auto}
        .seasons-header{display:grid;grid-template-columns:1fr auto;align-items:end;gap:20px;margin-bottom:56px}
        .seasons-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
        .season-card{background:var(--surface);border:1px solid var(--border);padding:36px 28px;position:relative;overflow:hidden;cursor:pointer;transition:all 0.35s}
        .season-card::after{content:'';position:absolute;inset:0;background:var(--ink);opacity:0;transition:opacity 0.35s;z-index:0}
        .season-card:hover::after{opacity:0.03}
        .season-card>*{position:relative;z-index:1}
        .season-card.active{background:var(--ink);border-color:var(--ink);grid-column:span 3}
        .season-card.active *{color:var(--cream)!important}
        .season-card.active .season-tag{background:rgba(255,255,255,0.1);color:var(--gold-light)!important}
        .season-card.active .season-roi{color:var(--gold-light)!important}
        .season-tag{display:inline-block;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;padding:4px 10px;border-radius:100px;background:rgba(184,147,90,0.1);color:var(--gold);margin-bottom:20px}
        .season-name{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:500;color:var(--ink);margin-bottom:6px}
        .season-period{font-size:0.75rem;color:var(--text-secondary);margin-bottom:28px;letter-spacing:0.05em}
        .season-roi{font-family:'Cormorant Garamond',serif;font-size:2.8rem;font-weight:300;color:var(--sage);line-height:1;margin-bottom:4px}
        .season-roi-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-secondary);margin-bottom:24px}
        .season-detail{display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--border)}
        .season-card.active .season-detail{border-color:rgba(255,255,255,0.1)}
        .season-detail-item span{display:block;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-secondary);margin-bottom:4px}
        .season-detail-item strong{font-size:0.9rem;font-weight:500;color:var(--ink)}
        .how-it-works{padding:100px 5%;background:var(--ink)}
        .hiw-inner{max-width:1200px;margin:0 auto}
        .hiw-inner .section-label{color:var(--gold)}
        .hiw-inner .section-title{color:var(--cream)}
        .hiw-inner .section-sub{color:rgba(246,241,233,0.5)}
        .hiw-header{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;margin-bottom:70px}
        .hiw-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}
        .step{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:32px 24px;transition:all 0.3s}
        .step:hover{background:rgba(184,147,90,0.08);border-color:rgba(184,147,90,0.2)}
        .step-num{font-family:'Cormorant Garamond',serif;font-size:3rem;font-weight:300;color:rgba(184,147,90,0.25);line-height:1;margin-bottom:16px}
        .step h4{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:500;color:var(--cream);margin-bottom:10px}
        .step p{font-size:0.8rem;color:rgba(246,241,233,0.5);line-height:1.7;font-weight:300}
        .referral{padding:100px 5%;background:var(--parchment);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .referral-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
        .referral-visual{position:relative;display:flex;flex-direction:column;gap:2px}
        .ref-card{background:var(--cream);border:1px solid var(--border);padding:22px 24px;display:flex;align-items:center;gap:16px;transition:all 0.3s}
        .ref-card:hover{border-color:var(--gold);transform:translateX(6px)}
        .ref-icon{width:40px;height:40px;border-radius:var(--radius);background:var(--ink);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ref-icon svg{width:18px;height:18px;fill:var(--gold)}
        .ref-info{flex:1}
        .ref-info strong{display:block;font-size:0.85rem;font-weight:500;color:var(--ink);margin-bottom:2px}
        .ref-info span{font-size:0.75rem;color:var(--text-secondary)}
        .ref-badge{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:500;color:var(--sage)}
        .commission-box{background:var(--ink);padding:32px 28px;margin-top:2px;border:1px solid var(--ink);display:flex;align-items:center;gap:24px}
        .commission-num{font-family:'Cormorant Garamond',serif;font-size:3.5rem;font-weight:300;color:var(--gold-light);line-height:1}
        .commission-text strong{display:block;color:var(--cream);font-size:0.9rem;margin-bottom:4px}
        .commission-text span{font-size:0.75rem;color:rgba(246,241,233,0.5);line-height:1.6}
        .testimonials{padding:100px 5%;background:var(--surface)}
        .testi-inner{max-width:1200px;margin:0 auto}
        .testi-header{text-align:center;margin-bottom:60px}
        .testi-header .section-sub{max-width:400px;margin:14px auto 0}
        .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
        .testi-card{background:var(--cream);border:1px solid var(--border);padding:32px 28px;position:relative;overflow:hidden;transition:all 0.3s}
        .testi-card:hover{border-color:var(--gold)}
        .testi-card::before{content:'\\201C';position:absolute;top:-10px;right:20px;font-family:'Cormorant Garamond',serif;font-size:8rem;font-weight:600;color:rgba(184,147,90,0.07);line-height:1;pointer-events:none}
        .testi-stars{display:flex;gap:3px;margin-bottom:18px}
        .testi-stars span{color:var(--gold);font-size:0.8rem}
        .testi-text{font-size:0.85rem;color:var(--ink);line-height:1.8;font-weight:300;margin-bottom:24px;font-style:italic}
        .testi-author{display:flex;align-items:center;gap:12px;border-top:1px solid var(--border);padding-top:20px}
        .testi-avatar{width:36px;height:36px;border-radius:50%;background:var(--parchment);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:0.9rem;font-weight:600;color:var(--gold);flex-shrink:0}
        .testi-name{font-size:0.82rem;font-weight:500;color:var(--ink)}
        .testi-role{font-size:0.72rem;color:var(--text-secondary);letter-spacing:0.04em}
        .testi-roi{margin-left:auto;font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:500;color:var(--sage)}
        .about{padding:100px 5%;background:var(--cream)}
        .about-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:5fr 4fr;gap:80px;align-items:start}
        .about-features{display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:40px}
        .about-feature{background:var(--surface);border:1px solid var(--border);padding:24px 20px;transition:all 0.3s}
        .about-feature:hover{border-color:var(--gold)}
        .feature-icon{font-size:1.1rem;margin-bottom:10px;display:block}
        .about-feature h4{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:500;color:var(--ink);margin-bottom:6px}
        .about-feature p{font-size:0.75rem;color:var(--text-secondary);line-height:1.7;font-weight:300}
        .about-aside{position:sticky;top:100px}
        .aside-card{background:var(--ink);padding:36px 32px;border:1px solid var(--ink)}
        .aside-card .section-label{color:var(--gold)}
        .aside-card h3{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:400;color:var(--cream);margin:8px 0 20px;line-height:1.3}
        .aside-card p{font-size:0.8rem;color:rgba(246,241,233,0.55);line-height:1.8;font-weight:300;margin-bottom:28px}
        .aside-cta{width:100%;padding:13px;background:var(--gold);border:none;color:var(--cream);font-family:'DM Sans',sans-serif;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:opacity 0.2s}
        .aside-cta:hover{opacity:0.85}
        .aside-note{margin-top:14px;text-align:center;font-size:0.7rem;color:rgba(246,241,233,0.3);letter-spacing:0.05em}
        .contact{padding:100px 5%;background:var(--parchment);border-top:1px solid var(--border)}
        .contact-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
        .contact-form{display:flex;flex-direction:column;gap:14px}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .form-group{display:flex;flex-direction:column;gap:6px}
        .form-group label{font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-secondary)}
        .form-group input,.form-group textarea,.form-group select{padding:12px 14px;background:var(--cream);border:1px solid var(--border);font-family:'DM Sans',sans-serif;font-size:0.85rem;color:var(--ink);border-radius:var(--radius);outline:none;transition:border-color 0.2s;-webkit-appearance:none}
        .form-group input:focus,.form-group textarea:focus,.form-group select:focus{border-color:var(--gold)}
        .form-group textarea{resize:vertical;min-height:110px}
        .form-submit{width:100%;padding:14px;background:var(--ink);color:var(--cream);border:none;font-family:'DM Sans',sans-serif;font-size:0.82rem;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:background 0.25s;margin-top:4px}
        .form-submit:hover{background:var(--gold)}.form-submit:disabled{opacity:0.6;cursor:not-allowed}
        .form-msg{font-size:0.8rem;color:var(--sage);text-align:center;padding:6px 0}
        .contact-info{display:flex;flex-direction:column;gap:24px}
        .contact-item{display:flex;gap:14px;align-items:start;padding-bottom:24px;border-bottom:1px solid var(--border)}
        .contact-item:last-child{border-bottom:none}
        .contact-item-icon{width:36px;height:36px;border-radius:var(--radius);background:var(--ink);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .contact-item-icon svg{width:16px;height:16px;fill:var(--gold)}
        .contact-item strong{display:block;font-size:0.8rem;font-weight:500;letter-spacing:0.05em;margin-bottom:4px}
        .contact-item span{font-size:0.8rem;color:var(--text-secondary);line-height:1.6}
        footer{background:var(--ink);padding:60px 5% 32px;position:relative;z-index:2}
        .footer-inner{max-width:1200px;margin:0 auto}
        .footer-top{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid rgba(255,255,255,0.08)}
        .footer-brand .logo{margin-bottom:16px}.footer-brand .logo-text{color:var(--cream)}
        .footer-brand p{font-size:0.78rem;color:rgba(246,241,233,0.4);line-height:1.8;font-weight:300;max-width:260px}
        .footer-col h5{font-size:0.68rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold);margin-bottom:18px;font-weight:400}
        .footer-col ul{list-style:none;display:flex;flex-direction:column;gap:10px}
        .footer-col a{text-decoration:none;font-size:0.78rem;color:rgba(246,241,233,0.45);transition:color 0.2s;cursor:pointer}
        .footer-col a:hover{color:var(--cream)}
        .footer-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .footer-bottom p{font-size:0.72rem;color:rgba(246,241,233,0.25);letter-spacing:0.04em}
        .footer-legal{display:flex;gap:24px}
        .footer-legal a{font-size:0.72rem;color:rgba(246,241,233,0.25);text-decoration:none;letter-spacing:0.04em;transition:color 0.2s}
        .footer-legal a:hover{color:var(--cream)}
        .modal-overlay{display:none;position:fixed;inset:0;background:rgba(28,28,28,0.7);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:20px}
        .modal-overlay.active{display:flex}
        .modal{background:var(--cream);width:100%;max-width:420px;border-radius:var(--radius);overflow:hidden;animation:modalIn 0.3s ease}
        @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:none}}
        .modal-head{background:var(--ink);padding:28px 32px;display:flex;align-items:center;justify-content:space-between}
        .modal-head h3{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:400;color:var(--cream)}
        .modal-close{background:none;border:none;cursor:pointer;color:rgba(246,241,233,0.4);font-size:1.3rem;line-height:1;transition:color 0.2s}
        .modal-close:hover{color:var(--cream)}
        .modal-body{padding:32px;display:flex;flex-direction:column;gap:14px}
        .modal-input{display:flex;flex-direction:column;gap:6px}
        .modal-input label{font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-secondary)}
        .modal-input input{padding:12px 14px;background:var(--surface);border:1px solid var(--border);font-family:'DM Sans',sans-serif;font-size:0.85rem;color:var(--ink);border-radius:var(--radius);outline:none;transition:border-color 0.2s;width:100%}
        .modal-input input:focus{border-color:var(--gold)}
        .modal-submit{width:100%;padding:13px;background:var(--ink);color:var(--cream);border:none;font-family:'DM Sans',sans-serif;font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:background 0.25s;margin-top:4px}
        .modal-submit:hover{background:var(--gold)}.modal-submit:disabled{opacity:0.6;cursor:not-allowed}
        .modal-switch{text-align:center;font-size:0.78rem;color:var(--text-secondary)}
        .modal-switch a{color:var(--gold);text-decoration:none;cursor:pointer;font-weight:500}
        .modal-error{font-size:0.78rem;color:#c0392b;background:rgba(192,57,43,0.07);border:1px solid rgba(192,57,43,0.2);padding:8px 12px;border-radius:var(--radius);text-align:center}
        .modal-success{font-size:0.82rem;color:var(--sage);background:rgba(74,103,65,0.08);border:1px solid rgba(74,103,65,0.2);padding:12px 16px;border-radius:var(--radius);text-align:center;line-height:1.6}
        .modal-link{font-size:0.75rem;color:var(--gold);cursor:pointer;text-align:right;text-decoration:underline;margin-top:-6px;background:none;border:none;font-family:'DM Sans',sans-serif;width:100%}
        .reveal{opacity:0;transform:translateY(28px);transition:all 0.7s ease}.reveal.visible{opacity:1;transform:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @media(max-width:900px){.nav-links,.nav-actions{display:none}.hamburger{display:flex}.platform-stats .inner{grid-template-columns:1fr;gap:40px}.seasons-grid{grid-template-columns:1fr}.seasons-grid .season-card.active{grid-column:span 1}.hiw-steps{grid-template-columns:1fr 1fr}.hiw-header{grid-template-columns:1fr;gap:24px}.referral-inner{grid-template-columns:1fr;gap:40px}.testi-grid{grid-template-columns:1fr}.about-inner{grid-template-columns:1fr;gap:40px}.about-aside{position:static}.contact-inner{grid-template-columns:1fr;gap:48px}.footer-top{grid-template-columns:1fr 1fr;gap:36px}.form-row{grid-template-columns:1fr}.seasons-header{grid-template-columns:1fr}}
        @media(max-width:560px){.hiw-steps{grid-template-columns:1fr}.footer-top{grid-template-columns:1fr}.stats-grid{grid-template-columns:1fr 1fr}.about-features{grid-template-columns:1fr}.hero-cta{flex-direction:column;width:100%}.btn-lg,.btn-outline-lg{width:100%}.footer-bottom{flex-direction:column;align-items:start}}
      `}</style>

      <canvas id='bg-canvas' ref={canvasRef} />

      {/* NAVBAR */}
      <nav id='navbar'>
        <div className='nav-inner'>
          <a href='#' className='logo'>
            <div className='logo-mark' />
            <span className='logo-text'>
              Vault<span>X</span>
            </span>
          </a>
          <ul className='nav-links'>
            <li>
              <a href='#about'>About Us</a>
            </li>
            <li>
              <a href='#seasons'>Seasons</a>
            </li>
            <li>
              <a href='#contact'>Contact Us</a>
            </li>
          </ul>
          <div className='nav-actions'>
            <button className='btn-ghost' onClick={() => openModal('login')}>
              Login
            </button>
            <button className='btn-ghost' onClick={() => openModal('signup')}>
              Sign Up
            </button>
            <button className='btn-primary' onClick={() => openModal('signup')}>
              Get Started
            </button>
          </div>
          <div className='hamburger' onClick={() => setMenuOpen(!menuOpen)}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href='#about' onClick={() => setMenuOpen(false)}>
          About Us
        </a>
        <a href='#seasons' onClick={() => setMenuOpen(false)}>
          Seasons
        </a>
        <a href='#contact' onClick={() => setMenuOpen(false)}>
          Contact Us
        </a>
        <div className='mob-actions'>
          <button className='btn-ghost' onClick={() => openModal('login')}>
            Login
          </button>
          <button className='btn-ghost' onClick={() => openModal('signup')}>
            Sign Up
          </button>
          <button className='btn-primary' onClick={() => openModal('signup')}>
            Get Started
          </button>
        </div>
      </div>

      {/* HERO */}
      <section className='hero'>
        <div className='hero-inner'>
          <div className='hero-badge'>Season 4 — Now Open</div>
          <h1>
            Where capital grows
            <br />
            with <em>discipline</em>
          </h1>
          <p>
            A structured investment platform operating through defined seasonal
            cycles. No speculation. No volatility. Consistent, transparent
            returns.
          </p>
          <div className='hero-cta'>
            <button className='btn-lg' onClick={() => openModal('signup')}>
              Start Investing
            </button>
            <button
              className='btn-outline-lg'
              onClick={() =>
                document
                  .getElementById('seasons')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              View Seasons
            </button>
          </div>
        </div>
      </section>

      {/* STATS TICKER */}
      <div className='stats-bar'>
        <div className='stats-track'>
          <div className='stat-item'>
            <strong>50,000+</strong> Active Investors
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            <strong>100M+</strong> USDT Invested
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            Season 3 ROI <strong>+28.4%</strong>
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            <strong>$4.2M+</strong> Paid Out
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            Referral Rate <strong>7%</strong> Per Withdrawal
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            <strong>99.8%</strong> On-Time Payouts
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            Season 4 <strong>Now Live</strong>
          </div>
          <div className='stat-sep' />
          {/* duplicate for seamless loop */}
          <div className='stat-item'>
            <strong>50,000+</strong> Active Investors
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            <strong>100M+</strong> USDT Invested
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            Season 3 ROI <strong>+28.4%</strong>
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            <strong>$4.2M+</strong> Paid Out
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            Referral Rate <strong>7%</strong> Per Withdrawal
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            <strong>99.8%</strong> On-Time Payouts
          </div>
          <div className='stat-sep' />
          <div className='stat-item'>
            Season 4 <strong>Now Live</strong>
          </div>
        </div>
      </div>

      {/* PLATFORM STATS */}
      <section className='platform-stats'>
        <div className='inner'>
          <div className='stats-text reveal'>
            <span className='section-label'>Platform Performance</span>
            <h2 className='section-title'>
              Numbers that
              <br />
              speak for themselves
            </h2>
            <p className='section-sub'>
              Since our first season, we have maintained consistent returns,
              full transparency, and zero withdrawal failures.
            </p>
          </div>
          <div className='stats-grid reveal'>
            <div className='stat-card'>
              <div className='stat-trend'>↑ Active</div>
              <div className='stat-number'>
                50<span>K+</span>
              </div>
              <div className='stat-desc'>Verified Investors</div>
            </div>
            <div className='stat-card'>
              <div className='stat-trend'>↑ Growing</div>
              <div className='stat-number'>
                100<span>M+</span>
              </div>
              <div className='stat-desc'>USDT Total Invested</div>
            </div>
            <div className='stat-card'>
              <div className='stat-trend'>Last Season</div>
              <div className='stat-number'>
                28<span>.4%</span>
              </div>
              <div className='stat-desc'>Season 3 ROI</div>
            </div>
            <div className='stat-card'>
              <div className='stat-trend'>All Time</div>
              <div className='stat-number'>
                4.2<span>M+</span>
              </div>
              <div className='stat-desc'>USDT Paid Out</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEASONS */}
      <section className='seasons' id='seasons'>
        <div className='seasons-inner'>
          <div className='seasons-header reveal'>
            <div>
              <span className='section-label'>Investment Seasons</span>
              <h2 className='section-title'>
                Structured cycles,
                <br />
                predictable returns
              </h2>
            </div>
            <button className='btn-primary' onClick={() => openModal('signup')}>
              Join Season 4
            </button>
          </div>
          <div className='seasons-grid reveal'>
            <div className='season-card'>
              <div className='season-tag'>Completed</div>
              <div className='season-name'>Season One</div>
              <div className='season-period'>Jan 2023 — Apr 2023</div>
              <div className='season-roi'>+18.2%</div>
              <div className='season-roi-label'>Final ROI</div>
              <div className='season-detail'>
                <div className='season-detail-item'>
                  <span>Total Pool</span>
                  <strong>$12M</strong>
                </div>
                <div className='season-detail-item'>
                  <span>Investors</span>
                  <strong>8,400</strong>
                </div>
                <div className='season-detail-item'>
                  <span>Duration</span>
                  <strong>90 Days</strong>
                </div>
              </div>
            </div>
            <div className='season-card'>
              <div className='season-tag'>Completed</div>
              <div className='season-name'>Season Two</div>
              <div className='season-period'>Jun 2023 — Sep 2023</div>
              <div className='season-roi'>+23.7%</div>
              <div className='season-roi-label'>Final ROI</div>
              <div className='season-detail'>
                <div className='season-detail-item'>
                  <span>Total Pool</span>
                  <strong>$31M</strong>
                </div>
                <div className='season-detail-item'>
                  <span>Investors</span>
                  <strong>19,200</strong>
                </div>
                <div className='season-detail-item'>
                  <span>Duration</span>
                  <strong>90 Days</strong>
                </div>
              </div>
            </div>
            <div className='season-card'>
              <div className='season-tag'>Completed</div>
              <div className='season-name'>Season Three</div>
              <div className='season-period'>Nov 2023 — Feb 2024</div>
              <div className='season-roi'>+28.4%</div>
              <div className='season-roi-label'>Final ROI</div>
              <div className='season-detail'>
                <div className='season-detail-item'>
                  <span>Total Pool</span>
                  <strong>$57M</strong>
                </div>
                <div className='season-detail-item'>
                  <span>Investors</span>
                  <strong>34,800</strong>
                </div>
                <div className='season-detail-item'>
                  <span>Duration</span>
                  <strong>90 Days</strong>
                </div>
              </div>
            </div>
            <div className='season-card active'>
              <div className='season-tag'>Now Open · Limited Slots</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '20px',
                  alignItems: 'start',
                }}
              >
                <div>
                  <div className='season-name'>Season Four</div>
                  <div className='season-period'>
                    May 2025 — Aug 2025 · Entries close in 18 days
                  </div>
                  <div className='season-roi'>+24–32%</div>
                  <div className='season-roi-label'>Projected ROI Range</div>
                </div>
                <button
                  className='btn-primary'
                  style={{ whiteSpace: 'nowrap', padding: '12px 28px' }}
                  onClick={() => openModal('signup')}
                >
                  Invest Now
                </button>
              </div>
              <div className='season-detail' style={{ marginTop: '20px' }}>
                <div className='season-detail-item'>
                  <span style={{ color: 'rgba(246,241,233,0.4)' }}>
                    Min. Entry
                  </span>
                  <strong>$100 USDT</strong>
                </div>
                <div className='season-detail-item'>
                  <span style={{ color: 'rgba(246,241,233,0.4)' }}>
                    Pool Cap
                  </span>
                  <strong>$80M</strong>
                </div>
                <div className='season-detail-item'>
                  <span style={{ color: 'rgba(246,241,233,0.4)' }}>
                    Duration
                  </span>
                  <strong>90 Days</strong>
                </div>
                <div className='season-detail-item'>
                  <span style={{ color: 'rgba(246,241,233,0.4)' }}>
                    Referral Bonus
                  </span>
                  <strong>7% / Season Profit</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className='how-it-works'>
        <div className='hiw-inner'>
          <div className='hiw-header reveal'>
            <div>
              <span className='section-label'>Process</span>
              <h2 className='section-title'>
                Simple steps,
                <br />
                serious results
              </h2>
            </div>
            <p
              className='section-sub'
              style={{ color: 'rgba(246,241,233,0.45)' }}
            >
              No complexity. No jargon. Just a clear, proven system that has
              delivered returns across three consecutive seasons.
            </p>
          </div>
          <div className='hiw-steps reveal'>
            <div className='step'>
              <div className='step-num'>01</div>
              <h4>Create Your Account</h4>
              <p>
                Register in under two minutes. Verify your identity and set your
                investment preferences.
              </p>
            </div>
            <div className='step'>
              <div className='step-num'>02</div>
              <h4>Choose Your Season</h4>
              <p>
                Select an open season, review its projected ROI and pool
                details, and decide your entry amount.
              </p>
            </div>
            <div className='step'>
              <div className='step-num'>03</div>
              <h4>Deposit USDT</h4>
              <p>
                Fund your position via USDT (TRC-20 or ERC-20). Your investment
                is locked in for the season duration.
              </p>
            </div>
            <div className='step'>
              <div className='step-num'>04</div>
              <h4>Withdraw Profits</h4>
              <p>
                At season close, withdraw your principal plus earned returns —
                directly to your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REFERRAL */}
      <section className='referral'>
        <div className='referral-inner'>
          <div className='reveal'>
            <span className='section-label'>Referral Programme</span>
            <h2 className='section-title'>
              Earn while
              <br />
              others grow
            </h2>
            <p className='section-sub'>
              Every time someone you referred makes profits, you earn 7% of that
              amount — automatically, with no limits.
            </p>
            <br />
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.8',
              }}
            >
              Share your unique referral code. When your referee make profits,
              7% is credited to your VaultX wallet instantly. Stack referrals
              with no cap — the more you refer, the more you passively earn.
            </p>
            <br />
            <button
              className='btn-lg'
              onClick={() => openModal('signup')}
              style={{ marginTop: '8px' }}
            >
              Get My Referral Code
            </button>
          </div>
          <div className='referral-visual reveal'>
            <div className='ref-card'>
              <div className='ref-icon'>
                <svg viewBox='0 0 24 24'>
                  <path d='M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z' />
                </svg>
              </div>
              <div className='ref-info'>
                <strong>You refer a friend</strong>
                <span>They sign up and invest in a season</span>
              </div>
            </div>
            <div className='ref-card'>
              <div className='ref-icon'>
                <svg viewBox='0 0 24 24'>
                  <path d='M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3a2 2 0 110 4 2 2 0 010-4zm4 12H8v-.75C8 15.45 10 14 12 14s4 1.45 4 3.25V18z' />
                </svg>
              </div>
              <div className='ref-info'>
                <strong>They make a withdrawal</strong>
                <span>At the end of their investment season</span>
              </div>
            </div>
            <div className='ref-card'>
              <div className='ref-icon'>
                <svg viewBox='0 0 24 24'>
                  <path d='M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' />
                </svg>
              </div>
              <div className='ref-info'>
                <strong>You earn instantly</strong>
                <span>7% of their profits, auto-credited</span>
              </div>
              <div className='ref-badge'>7%</div>
            </div>
            <div className='commission-box'>
              <div className='commission-num'>7%</div>
              <div className='commission-text'>
                <strong>Commission on Profit</strong>
                <span>
                  No cap. No delays. Paid automatically
                  <br />
                  to your VaultX wallet.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className='testimonials'>
        <div className='testi-inner'>
          <div className='testi-header reveal'>
            <span className='section-label'>Testimonials</span>
            <h2 className='section-title'>Words from our investors</h2>
            <p className='section-sub'>
              Real people, real returns. Here is what our community has to say.
            </p>
          </div>
          <div className='testi-grid reveal'>
            {[
              {
                i: 'RM',
                n: 'Rafiqul Molla',
                r: 'Investor since Season 2 · Dhaka',
                roi: '+23.4%',
                t: '"I was skeptical at first — every platform promises returns. But VaultX delivered exactly what Season 2 projected. Withdrew 23.4% on top of my principal without a single issue. I am now in Season 4 with three times my original stake."',
              },
              {
                i: 'SN',
                n: 'Sharmin Nahar',
                r: 'Referral Earner · Chittagong',
                roi: '+7% ×7',
                t: '"The referral system is genuinely passive income. I referred seven colleagues from my office. Every time one of them withdraws, I get credited automatically. Last month alone I earned extra just from referrals."',
              },
              {
                i: 'AH',
                n: 'Aminul Hossain',
                r: 'Investor since Season 1 · Sylhet',
                roi: '+28.1%',
                t: '"Season 3 gave me the confidence to invest more seriously. The platform is transparent — you see the pool size, the projected ROI, and the exact end date. That clarity is rare. Already locked in for Season 4."',
              },
              {
                i: 'FK',
                n: 'Farzana Khanam',
                r: 'First-time Investor · Rajshahi',
                roi: '+18.2%',
                t: '"As a small investor starting with just $200, I appreciated that VaultX has no minimum pressure. The returns were proportional, the withdrawal was fast, and customer support actually responded within hours."',
              },
              {
                i: 'MR',
                n: 'Mostafizur Rahman',
                r: 'International Investor · Khulna',
                roi: '+26.8%',
                t: '"I have used similar platforms in Malaysia and Singapore. VaultX is comparable in professionalism — maybe better in terms of communication. The season-based model removes emotional trading decisions entirely."',
              },
              {
                i: 'NB',
                n: 'Nasreen Begum',
                r: 'Repeat Investor · Mymensingh',
                roi: '+27.9%',
                t: '"My husband and I both invested in Season 3 independently. We both received our returns on the same day, right at the 90-day mark. The consistency here is something we tell everyone in our circle about."',
              },
            ].map((c, idx) => (
              <div className='testi-card' key={idx}>
                <div className='testi-stars'>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <p className='testi-text'>{c.t}</p>
                <div className='testi-author'>
                  <div className='testi-avatar'>{c.i}</div>
                  <div>
                    <div className='testi-name'>{c.n}</div>
                    <div className='testi-role'>{c.r}</div>
                  </div>
                  <div className='testi-roi'>{c.roi}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className='about' id='about'>
        <div className='about-inner'>
          <div className='reveal'>
            <span className='section-label'>About VaultX</span>
            <h2 className='section-title'>
              Built for discipline,
              <br />
              not speculation
            </h2>
            <p className='section-sub'>
              VaultX is a structured investment platform operating through
              defined seasonal cycles. We do not chase volatile markets. We
              apply systematic, rule-based strategies across diversified asset
              pools — and we share the results with our investors transparently.
            </p>
            <div className='about-features'>
              <div className='about-feature'>
                <span className='feature-icon'>⬛</span>
                <h4>Season-Based Cycles</h4>
                <p>
                  Defined entry and exit dates eliminate emotional
                  decision-making and market timing pressure.
                </p>
              </div>
              <div className='about-feature'>
                <span className='feature-icon'>◈</span>
                <h4>Full Transparency</h4>
                <p>
                  Every season publishes its pool size, strategy summary, and
                  projected return range before entries open.
                </p>
              </div>
              <div className='about-feature'>
                <span className='feature-icon'>◎</span>
                <h4>USDT Settlement</h4>
                <p>
                  All investments and payouts are in USDT. No currency risk, no
                  conversion friction.
                </p>
              </div>
              <div className='about-feature'>
                <span className='feature-icon'>◇</span>
                <h4>Zero Withdrawal Failures</h4>
                <p>
                  Across three seasons, every withdrawal has been processed on
                  time — a record we intend to maintain.
                </p>
              </div>
            </div>
          </div>
          <div className='about-aside reveal'>
            <div className='aside-card'>
              <span className='section-label'>Season 4 is Live</span>
              <h3>Secure your position before entries close</h3>
              <p>
                Only 18 days remain in the Season 4 entry window. The pool cap
                is $80M. Current fill rate is at 62%. Once full, no further
                entries are accepted.
              </p>
              <button className='aside-cta' onClick={() => openModal('signup')}>
                Open an Account
              </button>
              <div className='aside-note'>
                Minimum investment: $100 USDT · No lock-in fees
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className='contact' id='contact'>
        <div className='contact-inner'>
          <div className='reveal'>
            <span className='section-label'>Contact Us</span>
            <h2 className='section-title'>
              We respond
              <br />
              within 24 hours
            </h2>
            <p className='section-sub'>
              Have a question about a season, a withdrawal, or your referral
              earnings? Reach out — our team is available every day.
            </p>
            <br />
            <div className='contact-info'>
              <div className='contact-item'>
                <div className='contact-item-icon'>
                  <svg viewBox='0 0 24 24'>
                    <path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' />
                  </svg>
                </div>
                <div>
                  <strong>Email Support</strong>
                  <span>
                    ozzyoo554@gmail.com
                    <br />
                    Typically within 4–8 hours
                  </span>
                </div>
              </div>
              <div className='contact-item'>
                <div className='contact-item-icon'>
                  <svg viewBox='0 0 24 24'>
                    <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' />
                  </svg>
                </div>
                <div>
                  <strong>Headquarters</strong>
                  <span>
                    Dhaka, Bangladesh
                    <br />
                    Remote operations globally
                  </span>
                </div>
              </div>
              <div className='contact-item'>
                <div className='contact-item-icon'>
                  <svg viewBox='0 0 24 24'>
                    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' />
                  </svg>
                </div>
                <div>
                  <strong>Community Channel</strong>
                  <span>
                    Join 50,000+ investors on Telegram
                    <br />
                    @VaultXOfficial
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className='reveal'>
            <form className='contact-form' onSubmit={handleContact}>
              <div className='form-row'>
                <div className='form-group'>
                  <label>First Name</label>
                  <input
                    type='text'
                    placeholder='Rafiqul'
                    required
                    value={contactForm.firstName}
                    onChange={(e) =>
                      setContactForm((p) => ({
                        ...p,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='form-group'>
                  <label>Last Name</label>
                  <input
                    type='text'
                    placeholder='Molla'
                    required
                    value={contactForm.lastName}
                    onChange={(e) =>
                      setContactForm((p) => ({
                        ...p,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className='form-group'>
                <label>Email Address</label>
                <input
                  type='email'
                  placeholder='you@example.com'
                  required
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className='form-group'>
                <label>Subject</label>
                <select
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, subject: e.target.value }))
                  }
                >
                  <option>Season 4 Investment Query</option>
                  <option>Withdrawal Support</option>
                  <option>Referral Programme</option>
                  <option>Account Verification</option>
                  <option>Other</option>
                </select>
              </div>
              <div className='form-group'>
                <label>Message</label>
                <textarea
                  placeholder='Describe your inquiry...'
                  required
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, message: e.target.value }))
                  }
                />
              </div>
              {contactMsg && <div className='form-msg'>{contactMsg}</div>}
              <button
                type='submit'
                className='form-submit'
                disabled={contactLoading}
              >
                {contactLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className='footer-inner'>
          <div className='footer-top'>
            <div className='footer-brand'>
              <a href='#' className='logo'>
                <div className='logo-mark' />
                <span className='logo-text'>
                  Vault<span>X</span>
                </span>
              </a>
              <p>
                A structured investment platform operating through seasonal
                cycles with full transparency and consistent returns since 2023.
              </p>
            </div>
            <div className='footer-col'>
              <h5>Platform</h5>
              <ul>
                <li>
                  <a href='#seasons'>Seasons</a>
                </li>
                <li>
                  <a onClick={() => openModal('signup')}>Start Investing</a>
                </li>
                <li>
                  <a href='#referral'>Referral Programme</a>
                </li>
                <li>
                  <a href='/dashboard'>Portfolio Tracker</a>
                </li>
              </ul>
            </div>
            <div className='footer-col'>
              <h5>Company</h5>
              <ul>
                <li>
                  <a href='#about'>About Us</a>
                </li>
                <li>
                  <a href='#'>Press</a>
                </li>
                <li>
                  <a href='#'>Careers</a>
                </li>
                <li>
                  <a href='#contact'>Contact</a>
                </li>
              </ul>
            </div>
            <div className='footer-col'>
              <h5>Legal</h5>
              <ul>
                <li>
                  <a href='#'>Terms of Service</a>
                </li>
                <li>
                  <a href='#'>Privacy Policy</a>
                </li>
                <li>
                  <a href='#'>Risk Disclosure</a>
                </li>
                <li>
                  <a href='#'>KYC Policy</a>
                </li>
              </ul>
            </div>
          </div>
          <div className='footer-bottom'>
            <p>
              © 2025 VaultX. All rights reserved. Investment returns are not
              guaranteed.
            </p>
            <div className='footer-legal'>
              <a href='#'>Privacy</a>
              <a href='#'>Terms</a>
              <a href='#'>Risk</a>
            </div>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <div
        className={`modal-overlay ${activeModal === 'login' ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}
      >
        <div className='modal'>
          <div className='modal-head'>
            <h3>{showForgot ? 'Reset Password' : 'Welcome Back'}</h3>
            <button className='modal-close' onClick={closeModal}>
              ✕
            </button>
          </div>
          <div className='modal-body'>
            {!showForgot ? (
              <form onSubmit={handleLogin} style={{ display: 'contents' }}>
                <div className='modal-input'>
                  <label>Email Address</label>
                  <input
                    type='email'
                    placeholder='you@example.com'
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className='modal-input'>
                  <label>Password</label>
                  <input
                    type='password'
                    placeholder='••••••••'
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <button
                  type='button'
                  className='modal-link'
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
                {loginError && <div className='modal-error'>{loginError}</div>}
                <button
                  type='submit'
                  className='modal-submit'
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <p className='modal-switch'>
                  Don&apos;t have an account?{' '}
                  <a
                    onClick={() => {
                      setActiveModal('signup')
                      setLoginError('')
                    }}
                  >
                    Create one
                  </a>
                </p>
              </form>
            ) : (
              <form
                onSubmit={handleForgotPassword}
                style={{ display: 'contents' }}
              >
                <div className='modal-input'>
                  <label>Email Address</label>
                  <input
                    type='email'
                    placeholder='you@example.com'
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                {forgotMsg && (
                  <div
                    className={
                      forgotMsg.includes('sent')
                        ? 'modal-success'
                        : 'modal-error'
                    }
                  >
                    {forgotMsg}
                  </div>
                )}
                <button
                  type='submit'
                  className='modal-submit'
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <p className='modal-switch'>
                  <a onClick={() => setShowForgot(false)}>← Back to Sign In</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* SIGNUP MODAL */}
      <div
        className={`modal-overlay ${activeModal === 'signup' ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}
      >
        <div className='modal'>
          <div className='modal-head'>
            <h3>Create Account</h3>
            <button className='modal-close' onClick={closeModal}>
              ✕
            </button>
          </div>
          <div className='modal-body'>
            {signupSuccess ? (
              <div className='modal-success'>
                ✅ Account created! Please check your email to verify your
                account, then sign in.
              </div>
            ) : (
              <form onSubmit={handleSignup} style={{ display: 'contents' }}>
                <div className='modal-input'>
                  <label>Full Name</label>
                  <input
                    type='text'
                    placeholder='Rafiqul Molla'
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                <div className='modal-input'>
                  <label>Email Address</label>
                  <input
                    type='email'
                    placeholder='you@example.com'
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className='modal-input'>
                  <label>Password</label>
                  <input
                    type='password'
                    placeholder='Create a strong password'
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <div className='modal-input'>
                  <label>Referral Code (Optional)</label>
                  <input
                    type='text'
                    placeholder='Enter code to earn 7% bonus'
                    value={signupReferral}
                    onChange={(e) => setSignupReferral(e.target.value)}
                  />
                </div>
                {signupError && (
                  <div className='modal-error'>{signupError}</div>
                )}
                <button
                  type='submit'
                  className='modal-submit'
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Creating Account...' : 'Get Started'}
                </button>
                <p className='modal-switch'>
                  Already have an account?{' '}
                  <a
                    onClick={() => {
                      setActiveModal('login')
                      setSignupError('')
                    }}
                  >
                    Sign in
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}
