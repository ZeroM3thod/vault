'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const ADMIN_EMAIL = 'admin@gmail.com'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [countdown, setCountdown] = useState(900)

  const [toast, setToast] = useState({ show: false, msg: '', type: '' })

  // Show info message if redirected from signup
  useEffect(() => {
    const msg = searchParams.get('msg')
    if (msg === 'verify') showToast('✓ Check your email to verify your account first.', 'ok')
  }, [])

  // Canvas animation
  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return
    const cx = cvs.getContext('2d')!
    let W = 0, H = 0, candles: any[] = [], waves: any[] = [], T = 0, animId = 0
    function setupCanvas() { W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight; buildScene() }
    function buildScene() {
      const n = Math.max(6, Math.floor(W / 50))
      candles = Array.from({ length: n }, (_, i) => ({ x: (i / n) * W + 10 + Math.random() * 18, y: H * .15 + Math.random() * H * .68, w: 8 + Math.random() * 9, h: 14 + Math.random() * 72, wick: 6 + Math.random() * 22, up: Math.random() > .42, spd: .15 + Math.random() * .35, ph: Math.random() * Math.PI * 2 }))
      const pts = Math.ceil(W / 36) + 2
      waves = [0, 1, 2, 3].map(i => ({ pts: Array.from({ length: pts }, (_, j) => ({ x: j * 36, y: H * (.12 + i * .22) + Math.random() * 44 })), spd: .1 + i * .04, ph: i * 1.4, amp: 13 + i * 8, col: i % 2 === 0 ? 'rgba(74,103,65,' : 'rgba(184,147,90,', opa: i % 2 === 0 ? '.72)' : '.56)' }))
    }
    function draw() {
      cx.clearRect(0, 0, W, H); T += .011
      waves.forEach((w: any) => { cx.beginPath(); w.pts.forEach((p: any, j: number) => { const y = p.y + Math.sin(T * w.spd + j * .3 + w.ph) * w.amp; j === 0 ? cx.moveTo(p.x, y) : cx.lineTo(p.x, y) }); cx.strokeStyle = w.col + w.opa; cx.lineWidth = 1; cx.stroke() })
      candles.forEach((c: any) => { const b = Math.sin(T * c.spd + c.ph) * 7, x = c.x, y = c.y + b; cx.strokeStyle = 'rgba(28,28,28,.8)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x + c.w / 2, y - c.wick); cx.lineTo(x + c.w / 2, y + c.h + c.wick); cx.stroke(); cx.fillStyle = c.up ? 'rgba(74,103,65,.88)' : 'rgba(184,147,90,.82)'; cx.fillRect(x, y, c.w, c.h); cx.strokeRect(x, y, c.w, c.h) })
      animId = requestAnimationFrame(draw)
    }
    window.addEventListener('resize', setupCanvas); setupCanvas(); draw()
    return () => { window.removeEventListener('resize', setupCanvas); cancelAnimationFrame(animId) }
  }, [])

  // Countdown timer for forgot password
  useEffect(() => {
    if (!forgotSent) return
    const timer = setInterval(() => setCountdown(s => { if (s <= 1) { clearInterval(timer); return 0 } return s - 1 }), 1000)
    return () => clearInterval(timer)
  }, [forgotSent])

  const showToast = (msg: string, type = '') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3500)
  }

  const fmtCountdown = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!loginEmail) errs.email = '⚠ Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) errs.email = '⚠ Enter a valid email address.'
    if (!loginPw) errs.pw = '⚠ Password is required.'
    else if (loginPw.length < 6) errs.pw = '⚠ Password must be at least 6 characters.'
    if (Object.keys(errs).length) { setLoginErrors(errs); return }

    setLoginLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPw })
    if (error) {
      setLoginLoading(false)
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setLoginErrors({ email: '⚠ Please verify your email first. Check your inbox.' })
      } else if (error.message.toLowerCase().includes('invalid')) {
        setLoginErrors({ pw: '⚠ Incorrect email or password.' })
      } else {
        setLoginErrors({ pw: '⚠ ' + error.message })
      }
      return
    }

    // Check role — admin goes to /admin, user goes to /dashboard
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const role = profile?.role || 'user'
    showToast('✓ Welcome back! Redirecting…', 'ok')
    setTimeout(() => router.push(role === 'admin' ? '/admin' : '/dashboard'), 1000)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail) { setForgotError('⚠ Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) { setForgotError('⚠ Enter a valid email address.'); return }

    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setForgotLoading(false)
    if (error) { setForgotError('⚠ ' + error.message); return }
    setForgotSent(true)
    setCountdown(900)
    showToast('✓ Reset link sent to ' + forgotEmail, 'ok')
  }

  async function resendLink() {
    setForgotSent(false)
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` })
    setForgotSent(true)
    setCountdown(900)
    showToast('✓ Reset link resent!', 'ok')
  }

  const eyeOpen = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
  const eyeClosed = `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`

  return (
    <>
      <style>{`
        :root{--ink:#1c1c1c;--cream:#f6f1e9;--parchment:#ede7da;--gold:#b8935a;--gold-l:#d4aa72;--gold-d:#9a7a47;--sage:#4a6741;--sage-l:#6a8c60;--charcoal:#2e2e2e;--surface:#faf7f2;--border:rgba(184,147,90,0.2);--border-s:rgba(184,147,90,0.35);--text-sec:#6b6459;--error:#9b3a3a;--ok:#4a6741;--radius:6px}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth;height:100%}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);min-height:100svh;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--parchment)}::-webkit-scrollbar-thumb{background:var(--gold);border-radius:10px}
        body::before{content:'';position:fixed;inset:0;z-index:1;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");opacity:.42}
        #bg-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.055}
        .page-shell{position:relative;z-index:2;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:20px 16px 40px}
        @media(min-width:640px){.page-shell{justify-content:center;padding:40px 20px}}
        .back-btn{position:fixed;top:20px;left:20px;z-index:100;display:flex;align-items:center;gap:7px;background:rgba(246,241,233,0.9);backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:100px;padding:8px 16px 8px 12px;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--charcoal);cursor:pointer;text-decoration:none;transition:all .22s;box-shadow:0 2px 12px rgba(28,28,28,.06)}
        .back-btn svg{width:14px;height:14px;stroke:var(--gold);stroke-width:2;fill:none;flex-shrink:0}
        .back-btn:hover{border-color:var(--gold);color:var(--gold)}
        .auth-card{background:rgba(250,247,242,0.92);backdrop-filter:blur(28px);border:1px solid var(--border);border-radius:16px;width:100%;max-width:460px;padding:36px 28px 32px;box-shadow:0 4px 32px rgba(184,147,90,.07),0 1px 0 rgba(255,255,255,.8) inset;position:relative;margin-top:60px}
        @media(min-width:640px){.auth-card{padding:44px 40px 38px;margin-top:0}}
        .auth-card::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:40%;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);border-radius:0 0 4px 4px}
        .card-logo{display:flex;flex-direction:column;align-items:center;margin-bottom:28px}
        .logo-icon{width:40px;height:40px;background:var(--ink);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:10px}
        .logo-icon::after{content:'';position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:16px;height:1.5px;background:var(--gold);border-radius:2px;box-shadow:0 -5px 0 var(--gold-l),0 -10px 0 var(--cream)}
        .logo-name{font-family:'Cormorant Garamond',serif;font-size:1.45rem;font-weight:600;color:var(--ink);letter-spacing:.04em}
        .logo-name span{color:var(--gold)}
        .card-heading{font-family:'Cormorant Garamond',serif;font-size:clamp(1.5rem,4vw,2rem);font-weight:400;line-height:1.15;color:var(--ink);margin-bottom:6px}
        .card-sub{font-size:.8rem;color:var(--text-sec);font-weight:300;line-height:1.6;margin-bottom:26px}
        .form-stack{display:flex;flex-direction:column;gap:14px}
        .fg{display:flex;flex-direction:column;gap:5px}
        .fl{font-size:.67rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-sec)}
        .fi{padding:11px 13px;background:var(--cream);border:1px solid var(--border);font-family:'DM Sans',sans-serif;font-size:.84rem;color:var(--ink);border-radius:var(--radius);outline:none;transition:border-color .2s,box-shadow .2s;width:100%}
        .fi:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,147,90,.08)}
        .fi::placeholder{color:#bbb4ac}
        .fi.err{border-color:var(--error);box-shadow:0 0 0 3px rgba(155,58,58,.06)}
        .fi.good{border-color:var(--sage);box-shadow:0 0 0 3px rgba(74,103,65,.06)}
        .pw-wrap{position:relative}
        .pw-wrap .fi{padding-right:40px}
        .pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text-sec);transition:color .2s;background:none;border:none;padding:2px;display:flex;align-items:center}
        .pw-eye:hover{color:var(--gold)}
        .pw-eye svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8}
        .msg{font-size:.71rem;letter-spacing:.03em;margin-top:2px;display:flex;align-items:center;gap:4px;min-height:16px}
        .msg-err{color:var(--error)}.msg-ok{color:var(--sage)}.msg-info{color:var(--text-sec)}
        .check-row{display:flex;align-items:flex-start;gap:10px;cursor:pointer}
        .check-row input[type="checkbox"]{width:16px;height:16px;flex-shrink:0;margin-top:2px;accent-color:var(--gold);cursor:pointer}
        .check-label{font-size:.78rem;color:var(--text-sec);line-height:1.55}
        .btn-primary{width:100%;padding:13px;background:var(--ink);color:var(--cream);border:1px solid var(--ink);font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:all .3s;position:relative;overflow:hidden;margin-top:4px}
        .btn-primary::after{content:'';position:absolute;inset:0;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .35s ease;z-index:0}
        .btn-primary span{position:relative;z-index:1}
        .btn-primary:hover{border-color:var(--gold)}.btn-primary:hover::after{transform:scaleX(1)}
        .btn-primary:active{transform:scale(.97)}.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}.btn-primary:disabled::after{display:none}
        .switch-row{text-align:center;margin-top:20px;font-size:.78rem;color:var(--text-sec)}
        .switch-link{color:var(--gold);text-decoration:none;font-weight:500;cursor:pointer;transition:color .2s;border:none;background:none;font-family:'DM Sans',sans-serif;font-size:.78rem;padding:0;letter-spacing:0}
        .switch-link:hover{color:var(--gold-d);text-decoration:underline;text-underline-offset:2px}
        .divider-text{display:flex;align-items:center;gap:12px;margin:4px 0;color:var(--text-sec);font-size:.72rem}
        .divider-text::before,.divider-text::after{content:'';flex:1;height:1px;background:var(--border)}
        #toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-90px);background:rgba(28,28,28,.97);border:1px solid rgba(184,147,90,.3);border-radius:10px;padding:11px 24px;z-index:9000;color:var(--gold);font-size:.76rem;letter-spacing:.06em;box-shadow:0 8px 28px rgba(0,0,0,.15);transition:transform .4s cubic-bezier(.16,1,.3,1);white-space:nowrap;pointer-events:none}
        #toast.show{transform:translateX(-50%) translateY(0)}#toast.ok{border-color:rgba(74,103,65,.4);color:var(--sage-l,#6a8c60)}#toast.err{border-color:rgba(155,58,58,.4);color:#c97070}
        .success-state{display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 0 4px;gap:14px}
        .success-icon{width:56px;height:56px;border-radius:50%;background:rgba(74,103,65,.1);border:1px solid rgba(74,103,65,.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem}
        .success-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:400;color:var(--ink)}
        .success-body{font-size:.8rem;color:var(--text-sec);font-weight:300;line-height:1.75;max-width:300px}
        .view{animation:fadeView .35s ease both}
        @keyframes fadeView{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .page-caption{position:fixed;bottom:16px;left:0;right:0;text-align:center;z-index:2;font-size:.65rem;letter-spacing:.08em;color:rgba(107,100,89,.45);pointer-events:none}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <canvas id="bg-canvas" ref={canvasRef} />
      <div id="toast" className={toast.show ? `show ${toast.type}` : ''}>{toast.msg}</div>

      <Link href="/" className="back-btn">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </Link>

      <div className="page-shell">

        {/* ── LOGIN VIEW ── */}
        {view === 'login' && (
          <div className="view auth-card">
            <div className="card-logo">
              <div className="logo-icon" />
              <div className="logo-name">Vault<span>X</span></div>
            </div>
            <h1 className="card-heading">Welcome back</h1>
            <p className="card-sub">Sign in to your investment account</p>
            <form className="form-stack" onSubmit={handleLogin} noValidate>
              <div className="fg">
                <label className="fl">Email or Phone</label>
                <input className={`fi ${loginErrors.email ? 'err' : ''}`} type="text" placeholder="email@example.com or 017XXXXXXXX" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setLoginErrors(p => ({ ...p, email: '' })) }} autoComplete="username" />
                {loginErrors.email && <div className="msg msg-err">{loginErrors.email}</div>}
              </div>
              <div className="fg">
                <label className="fl">Password</label>
                <div className="pw-wrap">
                  <input className={`fi ${loginErrors.pw ? 'err' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Your password" value={loginPw} onChange={e => { setLoginPw(e.target.value); setLoginErrors(p => ({ ...p, pw: '' })) }} autoComplete="current-password" />
                  <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                    <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: showPw ? eyeClosed : eyeOpen }} />
                  </button>
                </div>
                {loginErrors.pw && <div className="msg msg-err">{loginErrors.pw}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <label className="check-row">
                  <input type="checkbox" style={{ accentColor: 'var(--gold)' }} />
                  <span className="check-label">Remember me</span>
                </label>
                <button type="button" className="switch-link" onClick={() => { setView('forgot'); setLoginErrors({}) }}>Forgot Password?</button>
              </div>
              <button type="submit" className="btn-primary" disabled={loginLoading}><span>{loginLoading ? 'Signing in…' : 'Sign In'}</span></button>
            </form>
            <div className="divider-text" style={{ marginTop: '18px' }}>or</div>
            <div className="switch-row" style={{ marginTop: '8px' }}>
              Don&apos;t have an account?&nbsp;<Link href="/auth/signup" className="switch-link">Create one →</Link>
            </div>
          </div>
        )}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <div className="view auth-card">
            <div className="card-logo">
              <div className="logo-icon" />
              <div className="logo-name">Vault<span>X</span></div>
            </div>

            {!forgotSent ? (
              <>
                <h1 className="card-heading">Reset password</h1>
                <p className="card-sub">Enter your email and we&apos;ll send a secure reset link to your inbox.</p>
                <form className="form-stack" onSubmit={handleForgot} noValidate>
                  <div className="fg">
                    <label className="fl">Email Address</label>
                    <input className={`fi ${forgotError ? 'err' : ''}`} type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setForgotError('') }} autoComplete="email" />
                    {forgotError && <div className="msg msg-err">{forgotError}</div>}
                  </div>
                  <div style={{ background: 'rgba(184,147,90,.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '11px 13px' }}>
                    <div style={{ fontSize: '.71rem', color: 'var(--text-sec)', lineHeight: '1.75', fontWeight: 300 }}>
                      🔒 The reset link is valid for <strong style={{ color: 'var(--ink)' }}>15 minutes</strong> and can only be used once.
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={forgotLoading}><span>{forgotLoading ? 'Sending…' : 'Send Reset Link →'}</span></button>
                </form>
              </>
            ) : (
              <div className="success-state">
                <div className="success-icon">✉️</div>
                <div className="success-title">Check your inbox</div>
                <p className="success-body">
                  We&apos;ve sent a secure reset link to <strong style={{ color: 'var(--gold)' }}>{forgotEmail}</strong>.<br />
                  If it doesn&apos;t appear within a minute, check your spam folder.
                </p>
                <div style={{ background: 'rgba(74,103,65,.06)', border: '1px solid rgba(74,103,65,.18)', borderRadius: '8px', padding: '13px 16px', width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '2px' }}>Link expires in</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.8rem', fontWeight: 400, color: countdown <= 60 ? 'var(--error)' : 'var(--ink)' }}>
                    {countdown > 0 ? fmtCountdown(countdown) : 'Expired'}
                  </div>
                </div>
                <button className="btn-primary" style={{ marginTop: '4px' }} onClick={resendLink}><span>Resend Link</span></button>
              </div>
            )}

            <div className="switch-row" style={{ marginTop: '18px' }}>
              <button className="switch-link" onClick={() => { setView('login'); setForgotSent(false); setForgotError(''); setForgotEmail('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>← Back to Login</button>
            </div>
          </div>
        )}

      </div>
      <div className="page-caption">© 2025 VaultX · All rights reserved</div>
    </>
  )
}

export default function SignInPage() {
  return <Suspense fallback={null}><SignInContent /></Suspense>
}
