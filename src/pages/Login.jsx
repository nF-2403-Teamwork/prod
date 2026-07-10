import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { setCredentials } from '../store/slices/authSlice'
import socket from '../socket'
import {
  PageWrapper, GlassCard, AppLogo,
  GradientBtn, GlassInput, AlertMsg,
} from '../theme/components.jsx'
import { colors } from '../theme/index.js'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(s => s.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  function clearError() { setError('') }

  function handleLogin(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setError("Email va parolni kiriting"); return }
    setLoading(true); setError('')
    socket.emit('auth:login', { email: email.trim(), password }, res => {
      setLoading(false)
      if (!res.success) { setError(res.message || 'Xatolik yuz berdi'); return }
      dispatch(setCredentials({ user: res.user }))
      navigate('/', { replace:true })
    })
  }

  return (
    <PageWrapper>
      <GlassCard maxWidth={420}>
        <div style={{ marginBottom:28 }}>
          <AppLogo />
        </div>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <p style={{ margin:0, fontSize:18, fontWeight:700, color:colors.text.primary }}>Xush kelibsiz</p>
            <p style={{ margin:'4px 0 0', fontSize:13, color:colors.text.muted }}>Hisobingizga kiring</p>
          </div>

          <GlassInput
            icon={Mail}
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError() }}
            autoFocus required
          />

          <GlassInput
            icon={Lock}
            type="password"
            placeholder="Parol"
            value={password}
            onChange={e => { setPassword(e.target.value); clearError() }}
            required
          />

          <AnimatePresence>
            {error && <AlertMsg message={error} />}
          </AnimatePresence>

          <GradientBtn loading={loading}>
            {!loading && <><span>Kirish</span><ArrowRight size={17} /></>}
          </GradientBtn>

          <p style={{ margin:0, textAlign:'center', fontSize:13, color:colors.text.muted }}>
            Akkountingiz yo'qmi?{' '}
            <Link to="/register" style={{ color:colors.primaryLight, fontWeight:600, textDecoration:'none' }}>
              Ro'yxatdan o'tish
            </Link>
          </p>
        </form>
      </GlassCard>
    </PageWrapper>
  )
}
