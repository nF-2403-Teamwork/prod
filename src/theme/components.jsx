import { motion } from 'framer-motion'
import { MessageCircle, Loader2 } from 'lucide-react'
import { colors, gradients, shadows, radius, variants } from './index.js'

// ─── Animated background orbs (used on every page) ───────────────────────────
export function BackgroundOrbs() {
  return (
    <>
      <motion.div
        style={{ position:'absolute', width:520, height:520, borderRadius:'50%',
          top:'-15%', left:'-12%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)' }}
        animate={{ scale:[1,1.15,1], rotate:[0,120,240,360] }}
        transition={{ duration:22, repeat:Infinity, ease:'linear' }}
      />
      <motion.div
        style={{ position:'absolute', width:420, height:420, borderRadius:'50%',
          bottom:'-12%', right:'-10%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)' }}
        animate={{ scale:[1.1,1,1.1], rotate:[360,240,120,0] }}
        transition={{ duration:18, repeat:Infinity, ease:'linear' }}
      />
      <motion.div
        style={{ position:'absolute', width:260, height:260, borderRadius:'50%',
          top:'38%', right:'12%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)' }}
        animate={{ y:[-28,28,-28] }}
        transition={{ duration:7, repeat:Infinity, ease:'easeInOut' }}
      />
      <motion.div
        style={{ position:'absolute', width:180, height:180, borderRadius:'50%',
          top:'18%', left:'22%', pointerEvents:'none',
          background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
        animate={{ y:[18,-18,18] }}
        transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }}
      />
    </>
  )
}

// ─── Full-screen page wrapper with gradient + orbs ────────────────────────────
export function PageWrapper({ children, center = true }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:50, overflow:'hidden',
      background: gradients.bg,
      display:'flex',
      alignItems: center ? 'center' : 'flex-start',
      justifyContent: center ? 'center' : 'flex-start',
      padding: center ? 16 : 0,
    }}>
      <BackgroundOrbs />
      <div style={{ position:'relative', zIndex:10, width:'100%',
        height: center ? 'auto' : '100%' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Glassmorphism card ───────────────────────────────────────────────────────
export function GlassCard({ children, style, maxWidth = 420, padding = '40px 36px 36px', ...props }) {
  return (
    <motion.div
      variants={variants.cardPop}
      initial="initial"
      animate="animate"
      style={{
        width:'100%', maxWidth,
        background: colors.glass.bg,
        backdropFilter:'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        border:`1px solid ${colors.glass.border}`,
        borderRadius: radius.xl,
        padding,
        boxShadow: shadows.card,
        margin:'0 auto',
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── App logo ─────────────────────────────────────────────────────────────────
export function AppLogo({ size = 64, iconSize = 30, showText = true }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <motion.div
        whileHover={{ scale:1.08, rotate:-5 }}
        transition={{ type:'spring', stiffness:300 }}
        style={{
          width:size, height:size, borderRadius:size * 0.31,
          background: gradients.logo,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: shadows.logo,
        }}
      >
        <MessageCircle size={iconSize} color="white" strokeWidth={2.2} />
      </motion.div>
      {showText && (
        <div style={{ textAlign:'center' }}>
          <p style={{ margin:0, fontSize:22, fontWeight:700, color:colors.text.primary, letterSpacing:'-0.3px' }}>
            Chat App
          </p>
          <p style={{ margin:'3px 0 0', fontSize:12, color:colors.text.muted }}>
            Ulaning. Suhbat quring. Yaqin bo'ling.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Gradient button ──────────────────────────────────────────────────────────
export function GradientBtn({ loading, children, type='submit', onClick, disabled, style }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={!(loading || disabled) ? { scale:1.02, y:-1 } : {}}
      whileTap={!(loading || disabled)   ? { scale:0.97 }     : {}}
      style={{
        width:'100%', padding:'14px 20px', borderRadius:radius.lg,
        fontWeight:600, fontSize:15, color:'white',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        border:`1px solid rgba(255,255,255,0.10)`, cursor: loading || disabled ? 'not-allowed' : 'pointer',
        background: loading || disabled ? 'rgba(255,255,255,0.08)' : gradients.primary,
        boxShadow: loading || disabled ? 'none' : shadows.btn,
        transition:'background 0.2s',
        ...style,
      }}
    >
      {loading ? <Loader2 size={20} className="animate-spin" /> : children}
    </motion.button>
  )
}

// ─── Glass text input ─────────────────────────────────────────────────────────
export function GlassInput({ icon: Icon, label, error, style, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%' }}>
      {label && (
        <span style={{ fontSize:12, color:colors.text.muted,
          display:'flex', alignItems:'center', gap:5 }}>
          {Icon && <Icon size={12} color={colors.primaryLight} />}
          {label}
        </span>
      )}
      <div style={{ position:'relative' }}>
        {Icon && !label && (
          <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <Icon size={17} color="rgba(255,255,255,0.35)" />
          </div>
        )}
        <input
          {...props}
          style={{
            width:'100%', boxSizing:'border-box',
            padding: (Icon && !label) ? '13px 16px 13px 44px' : '13px 16px',
            borderRadius: radius.md,
            fontSize:14, color:colors.text.primary,
            background: colors.glass.inputBg,
            border:`1px solid ${colors.glass.inputBorder}`,
            outline:'none', transition:'all 0.2s',
            ...style,
          }}
          onFocus={e => {
            e.target.style.border  = `1px solid ${colors.glass.inputFocusBorder}`
            e.target.style.background = colors.glass.hoverBg
            e.target.style.boxShadow  = colors.glass.inputFocusShadow
          }}
          onBlur={e => {
            e.target.style.border     = `1px solid ${colors.glass.inputBorder}`
            e.target.style.background = colors.glass.inputBg
            e.target.style.boxShadow  = 'none'
          }}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
          style={{ margin:0, fontSize:12, color:colors.text.error }}>
          ⚠ {error}
        </motion.p>
      )}
    </div>
  )
}

// ─── Step pill indicator ──────────────────────────────────────────────────────
export function StepPills({ total, current }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map(s => (
        <motion.div
          key={s}
          animate={{ width: current === s ? 28 : 8, opacity: current >= s ? 1 : 0.25 }}
          transition={{ duration:0.35, ease:'easeInOut' }}
          style={{
            height:8, borderRadius:4,
            background: current >= s ? gradients.primary : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Glass icon button ────────────────────────────────────────────────────────
export function IconBtn({ icon: Icon, onClick, title, size = 18, style }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale:1.1, background:'rgba(255,255,255,0.12)' }}
      whileTap={{ scale:0.92 }}
      style={{
        width:38, height:38, borderRadius:radius.md,
        background:'rgba(255,255,255,0.06)',
        border:`1px solid ${colors.glass.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', color:colors.text.secondary,
        ...style,
      }}
    >
      <Icon size={size} />
    </motion.button>
  )
}

// ─── Error / info message ─────────────────────────────────────────────────────
export function AlertMsg({ message }) {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      style={{
        padding:'10px 14px', borderRadius:radius.md, fontSize:13,
        color:colors.text.error,
        background:'rgba(248,113,113,0.08)',
        border:'1px solid rgba(248,113,113,0.20)',
        display:'flex', alignItems:'center', gap:6,
      }}
    >
      ⚠ {message}
    </motion.div>
  )
}
