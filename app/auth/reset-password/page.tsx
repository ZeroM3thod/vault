'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [pw, setPw] = useState('')
  const [cpw, setCpw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [strength, setStrength] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState({ show: false, msg: '', type: '' })
  const [userEmail, setUserEmail] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

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

  // Handle Supabase recovery session from URL hash/code
  useEffect(() => {
    const handleSession = async () => {
      // Supabase SSR automatically exchanges the code in the URL for a session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email || '')
        setSessionReady(true)
      } else {
        // Listen for auth state change (token comes via URL hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session?.user) {
            setUserEmail(session.user.email || '')
            setSessionReady(true)
            subscription.unsubscribe()
          }
        })
        // Give it 3 seconds, then mark as invalid if no session
        setTimeout(() => {
          if (!sessionReady) setInvalidLink(true)
        }, 3000)
        return () => subscription.unsubscribe()
      }
    }
    handleSession()
  }, [])

  const showToast = (msg: string, type = '') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: '' }), 3500)
  }

  const calcStrength = (val: string) => {
    let s = 0
    if (val.length >= 8) s++
    if (/[A-Z]/.test(val)) s++
    if (/[0-9]/.test(val)) s++
    if (/[^A-Za-z0-9]/.test(val)) s++
    setStrength(s)
  }

  const strengthColor = ['', '#b05252', '#b8935a', '#b8935a', '#4a6741'][strength] || ''
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || ''
  const checks = { len: pw.length >= 8, upper: /[A-Z]/.test(pw), num: /[0-9]/.test(pw), sym: /[^A-Za-z0-9]/.test(pw) }
  const pwMatch = cpw ? pw === cpw : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!pw || pw.length < 8) errs.pw = '⚠ Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(pw)) errs.pw = '⚠ Include at least one uppercase letter.'
    else if (!/[0-9]/.test(pw)) errs.pw = '⚠ Include at least one number.'
    if (!cpw) errs.cpw = '⚠ Please confirm your new password.'
    else if (pw !== cpw) errs.cpw = '✕ Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); showToast('⚠ Please fix the errors above.', 'err'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) { showToast('✕ ' + error.message, 'err'); return }
    setSuccess(true)
    showToast('✓ Password updated successfully!', 'ok')
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
        .strength-bar{display:flex;gap:3px;margin-top:5px}
        .strength-seg{flex:1;height:3px;border-radius:100px;background:var(--parchment);transition:background .3s}
        .success-state{display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 0 4px;gap:14px}
        .success-icon{width:56px;height:56px;border-radius:50%;background:rgba(74,103,65,.1);border:1px solid rgba(74,103,65,.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem}
        .success-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:400;color:var(--ink)}
        .success-body{font-size:.8rem;color:var(--text-sec);font-weight:300;line-height:1.75;max-width:300px}
        .req-list{display:flex;flex-direction:column;gap:5px;margin-top:4px}
        .req-item{display:flex;align-items:center;gap:7px;font-size:.72rem;color:var(--text-sec);transition:color .25s}
        .req-dot{width:6px;height:6px;border-radius:50%;background:var(--parchment);border:1.5px solid rgba(184,147,90,.4);flex-shrink:0;transition:background .25s,border-color .25s}
        .req-item.met{color:var(--sage)}.req-item.met .req-dot{background:var(--sage);border-color:var(--sage)}
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
          <div className="card-logo">
            <div className="logo-icon" />
            <div className="logo-name">Vault<span>X</span></div>
          </div>

          {success ? (
            <div className="success-state">
              <div className="success-icon">🔐</div>
              <div className="success-title">Password updated</div>
              <p className="success-body">Your password has been changed successfully.<br />You can now sign in with your new credentials.</p>
              <div style={{ background: 'rgba(74,103,65,.06)', border: '1px solid rgba(74,103,65,.18)', borderRadius: '8px', padding: '13px 16px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '.71rem', color: 'var(--sage)', fontWeight: 300, lineHeight: 1.7 }}>✓ All active sessions have been logged out for your security.</div>
              </div>
              <Link href="/auth/signin" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '4px' }}><span>Go to Sign In →</span></Link>
            </div>
          ) : invalidLink ? (
            <div className="success-state">
              <div className="success-icon" style={{ background: 'rgba(155,58,58,.1)', border: '1px solid rgba(155,58,58,.25)' }}>⚠️</div>
              <div className="success-title" style={{ color: 'var(--error)' }}>Link expired</div>
              <p className="success-body">This reset link has expired or already been used. Please request a new one.</p>
              <Link href="/auth/signin" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '4px' }}><span>Request New Link →</span></Link>
            </div>
          ) : (
            <>
              <h1 className="card-heading">Set new password</h1>
              <p className="card-sub">Create a strong new password for your account. It must be different from your previous one.</p>

              {userEmail && (
                <div style={{ background: 'rgba(184,147,90,.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '11px 13px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '.71rem', color: 'var(--text-sec)', lineHeight: '1.75', fontWeight: 300 }}>
                    🔗 You&apos;re resetting the password for <strong style={{ color: 'var(--ink)' }}>{userEmail}</strong>
                  </div>
                </div>
              )}

              <form className="form-stack" onSubmit={handleSubmit} noValidate>
                <div className="fg">
                  <label className="fl">New Password</label>
                  <div className="pw-wrap">
                    <input className={`fi ${errors.pw ? 'err' : pw && strength >= 3 ? 'good' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Create a strong password" value={pw} onChange={e => { setPw(e.target.value); calcStrength(e.target.value); setErrors(p => ({ ...p, pw: '' })) }} autoComplete="new-password" />
                    <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: showPw ? eyeClosed : eyeOpen }} />
                    </button>
                  </div>
                  <div className="strength-bar">
                    {[0, 1, 2, 3].map(i => <div key={i} className="strength-seg" style={{ background: i < strength ? strengthColor : 'var(--parchment)' }} />)}
                  </div>
                  {pw && <div className={`msg ${strength <= 1 ? 'msg-err' : strength <= 2 ? 'msg-info' : 'msg-ok'}`}>{strengthLabel}</div>}
                  {errors.pw && <div className="msg msg-err">{errors.pw}</div>}
                </div>

                <div className="req-list">
                  <div className={`req-item ${checks.len ? 'met' : ''}`}><span className="req-dot" />At least 8 characters</div>
                  <div className={`req-item ${checks.upper ? 'met' : ''}`}><span className="req-dot" />One uppercase letter</div>
                  <div className={`req-item ${checks.num ? 'met' : ''}`}><span className="req-dot" />One number</div>
                  <div className={`req-item ${checks.sym ? 'met' : ''}`}><span className="req-dot" />One special character</div>
                </div>

                <div className="fg" style={{ marginTop: '4px' }}>
                  <label className="fl">Confirm New Password</label>
                  <div className="pw-wrap">
                    <input className={`fi ${cpw ? (pwMatch ? 'good' : 'err') : ''}`} type={showCpw ? 'text' : 'password'} placeholder="Repeat your new password" value={cpw} onChange={e => { setCpw(e.target.value); setErrors(p => ({ ...p, cpw: '' })) }} autoComplete="new-password" />
                    <button type="button" className="pw-eye" onClick={() => setShowCpw(!showCpw)} aria-label="Toggle password">
                      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: showCpw ? eyeClosed : eyeOpen }} />
                    </button>
                  </div>
                  {cpw && <div className={`msg ${pwMatch ? 'msg-ok' : 'msg-err'}`}>{pwMatch ? '✓ Passwords match.' : '✕ Passwords do not match.'}</div>}
                  {errors.cpw && <div className="msg msg-err">{errors.cpw}</div>}
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '6px' }}>
                  <span>{loading ? 'Updating…' : 'Update Password →'}</span>
                </button>
              </form>

              <div className="switch-row">
                Remembered it?&nbsp;<Link href="/auth/signin" className="switch-link">← Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="page-caption">© 2025 VaultX · All rights reserved</div>
    </>
  )
}
