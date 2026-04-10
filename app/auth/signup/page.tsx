'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', referral: '', password: '', confirmPassword: '' })
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fieldState, setFieldState] = useState<Record<string, 'err' | 'good' | ''>>({})
  const [strength, setStrength] = useState(0)
  const [unStatus, setUnStatus] = useState<{ msg: string; type: string }>({ msg: '', type: '' })
  const [success, setSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const unTimer = useRef<NodeJS.Timeout>()

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

  const showToast = (msg: string, type = '') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3500)
  }

  const calcStrength = (pw: string) => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    setStrength(s)
  }

  const checkUsername = (val: string) => {
    clearTimeout(unTimer.current)
    if (!val) { setUnStatus({ msg: '', type: '' }); return }
    if (val.length < 3) { setUnStatus({ msg: '⚠ Must be at least 3 characters.', type: 'err' }); return }
    if (!/^[a-z0-9._]+$/.test(val.toLowerCase())) { setUnStatus({ msg: '⚠ Only letters, numbers, dots and underscores.', type: 'err' }); return }
    setUnStatus({ msg: 'Checking availability…', type: 'info' })
    unTimer.current = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', val.toLowerCase()).maybeSingle()
      if (data) setUnStatus({ msg: '✕ Username taken. Try another.', type: 'err' })
      else setUnStatus({ msg: '✓ Username available!', type: 'ok' })
    }, 800)
  }

  const strengthColor = ['', '#b05252', '#b8935a', '#b8935a', '#4a6741'][strength] || ''
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || ''
  const pwMatch = form.confirmPassword ? form.password === form.confirmPassword : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name || form.name.length < 2) errs.name = '⚠ Please enter your full name.'
    if (!form.username || form.username.length < 3) errs.username = '⚠ Username must be at least 3 characters.'
    if (unStatus.type === 'err') errs.username = unStatus.msg
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = '⚠ Enter a valid email address.'
    if (!form.password || form.password.length < 8) errs.password = '⚠ Password must be at least 8 characters.'
    if (!form.confirmPassword) errs.confirmPassword = '⚠ Please confirm your password.'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = '✕ Passwords do not match.'
    if (!terms) errs.terms = '⚠ You must accept the Terms & Conditions.'
    if (Object.keys(errs).length) { setErrors(errs); showToast('⚠ Please fix the errors above.', 'err'); return }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}/auth/signin`,
      },
    })
    if (error) { showToast('✕ ' + error.message, 'err'); setLoading(false); return }

    // Save profile to DB
    if (data.user) {
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, fullName: form.name, username: form.username, phone: form.phone, referralCode: form.referral }),
      })
    }
    setLoading(false)
    setSuccess(true)
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
        .auth-card{background:rgba(250,247,242,0.92);backdrop-filter:blur(28px);border:1px solid var(--border);border-radius:16px;width:100%;max-width:500px;padding:36px 28px 32px;box-shadow:0 4px 32px rgba(184,147,90,.07),0 1px 0 rgba(255,255,255,.8) inset;position:relative;margin-top:60px}
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
        .phone-row{display:flex;gap:8px}
        .phone-pfx{padding:11px 12px;background:var(--parchment);border:1px solid var(--border);border-radius:var(--radius);font-size:.8rem;color:var(--text-sec);white-space:nowrap;flex-shrink:0}
        .phone-row .fi{flex:1}
        .msg{font-size:.71rem;letter-spacing:.03em;margin-top:2px;display:flex;align-items:center;gap:4px;min-height:16px}
        .msg-err{color:var(--error)}.msg-ok{color:var(--sage)}.msg-info{color:var(--text-sec)}
        .check-row{display:flex;align-items:flex-start;gap:10px;cursor:pointer}
        .check-row input[type="checkbox"]{width:16px;height:16px;flex-shrink:0;margin-top:2px;accent-color:var(--gold);cursor:pointer}
        .check-label{font-size:.78rem;color:var(--text-sec);line-height:1.55}
        .check-label a{color:var(--gold);text-decoration:underline;text-underline-offset:2px;cursor:pointer}
        .btn-primary{width:100%;padding:13px;background:var(--ink);color:var(--cream);border:1px solid var(--ink);font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:var(--radius);transition:all .3s;position:relative;overflow:hidden;margin-top:4px}
        .btn-primary::after{content:'';position:absolute;inset:0;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .35s ease;z-index:0}
        .btn-primary span{position:relative;z-index:1}
        .btn-primary:hover{border-color:var(--gold)}.btn-primary:hover::after{transform:scaleX(1)}
        .btn-primary:active{transform:scale(.97)}.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}.btn-primary:disabled::after{display:none}
        .switch-row{text-align:center;margin-top:20px;font-size:.78rem;color:var(--text-sec)}
        .switch-link{color:var(--gold);text-decoration:none;font-weight:500;cursor:pointer;transition:color .2s;border:none;background:none;font-family:'DM Sans',sans-serif;font-size:.78rem;padding:0;letter-spacing:0}
        .switch-link:hover{color:var(--gold-d);text-decoration:underline;text-underline-offset:2px}
        #toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-90px);background:rgba(28,28,28,.97);border:1px solid rgba(184,147,90,.3);border-radius:10px;padding:11px 24px;z-index:9000;color:var(--gold);font-size:.76rem;letter-spacing:.06em;box-shadow:0 8px 28px rgba(0,0,0,.15);transition:transform .4s cubic-bezier(.16,1,.3,1);white-space:nowrap;pointer-events:none}
        #toast.show{transform:translateX(-50%) translateY(0)}#toast.ok{border-color:rgba(74,103,65,.4);color:var(--sage-l,#6a8c60)}#toast.err{border-color:rgba(155,58,58,.4);color:#c97070}
        .un-spinner{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--border);border-top-color:var(--gold);animation:spin .7s linear infinite;display:inline-block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .strength-bar{display:flex;gap:3px;margin-top:5px}
        .strength-seg{flex:1;height:3px;border-radius:100px;background:var(--parchment);transition:background .3s}
        .success-state{display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 0 4px;gap:14px}
        .success-icon{width:56px;height:56px;border-radius:50%;background:rgba(74,103,65,.1);border:1px solid rgba(74,103,65,.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem}
        .success-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:400;color:var(--ink)}
        .success-body{font-size:.8rem;color:var(--text-sec);font-weight:300;line-height:1.75;max-width:300px}
        .page-caption{position:fixed;bottom:16px;left:0;right:0;text-align:center;z-index:2;font-size:.65rem;letter-spacing:.08em;color:rgba(107,100,89,.45);pointer-events:none}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <canvas id="bg-canvas" ref={canvasRef} />
      <div id="toast" className={toast.show ? `show ${toast.type}` : ''}>{toast.msg}</div>

      <Link href="/auth/signin" className="back-btn">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </Link>

      <div className="page-shell">
        <div className="auth-card">
          {success ? (
            <div className="success-state">
              <div className="success-icon">✉️</div>
              <div className="success-title">Verify your email</div>
              <p className="success-body">
                We&apos;ve sent a verification link to <strong style={{ color: 'var(--gold)' }}>{form.email}</strong>.<br />
                Click the link in the email to activate your account, then sign in.
              </p>
              <div style={{ background: 'rgba(74,103,65,.06)', border: '1px solid rgba(74,103,65,.18)', borderRadius: '8px', padding: '13px 16px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '.71rem', color: 'var(--sage)', fontWeight: 300, lineHeight: 1.7 }}>
                  ✓ Check your spam folder if you don&apos;t see the email within a minute.
                </div>
              </div>
              <Link href="/auth/signin" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '4px' }}><span>Go to Sign In →</span></Link>
            </div>
          ) : (
            <>
              <div className="card-logo">
                <div className="logo-icon" />
                <div className="logo-name">Vault<span>X</span></div>
              </div>
              <h1 className="card-heading">Create account</h1>
              <p className="card-sub">Join thousands of investors growing capital through structured seasons.</p>

              <form className="form-stack" onSubmit={handleSubmit} noValidate>
                <div className="fg">
                  <label className="fl">Full Name</label>
                  <input className={`fi ${errors.name ? 'err' : ''}`} type="text" placeholder="Rakib Kowshar" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }} autoComplete="name" />
                  {errors.name && <div className="msg msg-err">{errors.name}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Username</label>
                  <input className={`fi ${unStatus.type === 'err' ? 'err' : unStatus.type === 'ok' ? 'good' : ''}`} type="text" placeholder="rakib.investor" value={form.username} onChange={e => { setForm(p => ({ ...p, username: e.target.value })); checkUsername(e.target.value) }} autoComplete="off" />
                  {unStatus.msg && (
                    <div className={`msg ${unStatus.type === 'err' ? 'msg-err' : unStatus.type === 'ok' ? 'msg-ok' : 'msg-info'}`}>
                      {unStatus.type === 'info' && <span className="un-spinner" />}{unStatus.msg}
                    </div>
                  )}
                  {errors.username && <div className="msg msg-err">{errors.username}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Email Address</label>
                  <input className={`fi ${errors.email ? 'err' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }} autoComplete="email" />
                  {errors.email && <div className="msg msg-err">{errors.email}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Phone Number</label>
                  <div className="phone-row">
                    <span className="phone-pfx">🇧🇩 +880</span>
                    <input className="fi" type="tel" placeholder="1712-345678" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} autoComplete="tel" />
                  </div>
                </div>

                <div className="fg">
                  <label className="fl">Referral Code <span style={{ fontSize: '.6rem', color: 'var(--gold)', letterSpacing: '.08em' }}>(Optional)</span></label>
                  <input className="fi" type="text" placeholder="e.g. VX-ABC123" value={form.referral} onChange={e => setForm(p => ({ ...p, referral: e.target.value }))} autoComplete="off" />
                </div>

                <div className="fg">
                  <label className="fl">Password</label>
                  <div className="pw-wrap">
                    <input className={`fi ${errors.password ? 'err' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Create a strong password" value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); calcStrength(e.target.value); setErrors(p => ({ ...p, password: '' })) }} autoComplete="new-password" />
                    <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: showPw ? eyeClosed : eyeOpen }} />
                    </button>
                  </div>
                  <div className="strength-bar">
                    {[0, 1, 2, 3].map(i => <div key={i} className="strength-seg" style={{ background: i < strength ? strengthColor : 'var(--parchment)' }} />)}
                  </div>
                  {form.password && <div className={`msg ${strength <= 1 ? 'msg-err' : strength <= 2 ? 'msg-info' : 'msg-ok'}`}>{strengthLabel}</div>}
                  {errors.password && <div className="msg msg-err">{errors.password}</div>}
                </div>

                <div className="fg">
                  <label className="fl">Confirm Password</label>
                  <div className="pw-wrap">
                    <input className={`fi ${form.confirmPassword ? (pwMatch ? 'good' : 'err') : ''}`} type={showCpw ? 'text' : 'password'} placeholder="Repeat your password" value={form.confirmPassword} onChange={e => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })) }} autoComplete="new-password" />
                    <button type="button" className="pw-eye" onClick={() => setShowCpw(!showCpw)} aria-label="Toggle password">
                      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: showCpw ? eyeClosed : eyeOpen }} />
                    </button>
                  </div>
                  {form.confirmPassword && <div className={`msg ${pwMatch ? 'msg-ok' : 'msg-err'}`}>{pwMatch ? '✓ Passwords match.' : '✕ Passwords do not match.'}</div>}
                  {errors.confirmPassword && <div className="msg msg-err">{errors.confirmPassword}</div>}
                </div>

                <label className="check-row" style={{ marginTop: '2px' }}>
                  <input type="checkbox" checked={terms} onChange={e => { setTerms(e.target.checked); setErrors(p => ({ ...p, terms: '' })) }} style={{ accentColor: 'var(--gold)' }} />
                  <span className="check-label">I agree to the <a onClick={() => showToast('Terms & Conditions — coming soon.')}>Terms &amp; Conditions</a> and <a onClick={() => showToast('Privacy Policy — coming soon.')}>Privacy Policy</a></span>
                </label>
                {errors.terms && <div className="msg msg-err">{errors.terms}</div>}

                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '6px' }}>
                  <span>{loading ? 'Creating account…' : 'Create Account →'}</span>
                </button>
              </form>

              <div className="switch-row">
                Already have an account?&nbsp;<Link href="/auth/signin" className="switch-link">Sign in →</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="page-caption">© 2025 VaultX · All rights reserved</div>
    </>
  )
}
