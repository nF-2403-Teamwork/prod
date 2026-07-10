import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Users, Calendar, ArrowRight } from 'lucide-react'
import { setCredentials } from '../store/slices/authSlice'
import socket from '../socket'
import {
  PageWrapper, GlassCard, AppLogo,
  GradientBtn, GlassInput, AlertMsg,
} from '../theme/components.jsx'
import { colors } from '../theme/index.js'

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector(s => s.auth)

  const [form, setForm] = useState({
    firstName:'', lastName:'', age:'', email:'', password:'', confirmPassword:'',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  function update(field) {
    return e => { setForm(f => ({ ...f, [field]: e.target.value })); setError('') }
  }

  function handleRegister(e) {
    e.preventDefault()
    const { firstName, lastName, age, email, password, confirmPassword } = form

    if (!firstName.trim() || !lastName.trim() || !age || !email.trim() || !password) {
      setError("Barcha maydonlarni to'ldiring"); return
    }
    if (!gmailRegex.test(email.trim())) {
      setError('Faqat @gmail.com manzil qabul qilinadi'); return
    }
    if (Number(age) < 5 || Number(age) > 100) {
      setError("Yoshni to'g'ri kiriting"); return
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return
    }
    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi"); return
    }

    setLoading(true); setError('')
    socket.emit('auth:register', {
      email: email.trim(), password, firstName, lastName, age: Number(age),
    }, res => {
      setLoading(false)
      if (!res.success) { setError(res.message || 'Xatolik'); return }
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

        <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <p style={{ margin:0, fontSize:18, fontWeight:700, color:colors.text.primary }}>
              Ro'yxatdan o'tish
            </p>
            <p style={{ margin:'4px 0 0', fontSize:13, color:colors.text.muted }}>
              Yangi hisob yarating
            </p>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <GlassInput
              icon={User} label="Ism"
              type="text" placeholder="Bekzod"
              style={{ flex:1 }}
              value={form.firstName}
              onChange={update('firstName')}
              autoFocus required
            />
            <GlassInput
              icon={Users} label="Familiya"
              type="text" placeholder="Mirzaaliyev"
              style={{ flex:1 }}
              value={form.lastName}
              onChange={update('lastName')}
              required
            />
          </div>

          <GlassInput
            icon={Calendar} label="Yosh"
            type="number" placeholder="20" min={5} max={100}
            value={form.age}
            onChange={update('age')}
            required
          />

          <GlassInput
            icon={Mail}
            type="email"
            placeholder="example@gmail.com"
            value={form.email}
            onChange={update('email')}
            required
          />

          <GlassInput
            icon={Lock}
            type="password"
            placeholder="Parol"
            value={form.password}
            onChange={update('password')}
            required
          />

          <GlassInput
            icon={Lock}
            type="password"
            placeholder="Parolni tasdiqlang"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            required
          />

          <AnimatePresence>
            {error && <AlertMsg message={error} />}
          </AnimatePresence>

          <GradientBtn loading={loading}>
            {!loading && <><span>Ro'yxatdan o'tish</span><ArrowRight size={17} /></>}
          </GradientBtn>

          <p style={{ margin:0, textAlign:'center', fontSize:13, color:colors.text.muted }}>
            Akkountingiz bormi?{' '}
            <Link to="/login" style={{ color:colors.primaryLight, fontWeight:600, textDecoration:'none' }}>
              Kirish
            </Link>
          </p>
        </form>
      </GlassCard>
    </PageWrapper>
  )
}
