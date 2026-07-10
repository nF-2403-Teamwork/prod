import { motion } from 'framer-motion'
import { Link, useRouteError } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { PageWrapper, GlassCard, GradientBtn } from '../theme/components.jsx'
import { colors, variants } from '../theme/index.js'

export default function ErrorBoundary() {
  const error = useRouteError()
  const message = error?.statusText || error?.message || "Noma'lum xatolik"

  return (
    <PageWrapper>
      <GlassCard maxWidth={420} padding="48px 36px">
        <motion.div
          variants={variants.page}
          initial="initial"
          animate="animate"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, textAlign:'center' }}
        >
          <motion.div
            variants={variants.scaleIn}
            style={{
              width:72, height:72, borderRadius:22,
              background:'linear-gradient(135deg, rgba(248,113,113,0.20), rgba(239,68,68,0.15))',
              border:'1px solid rgba(248,113,113,0.30)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <AlertTriangle size={34} color="#f87171" />
          </motion.div>

          <div>
            <p style={{ margin:'0 0 8px', fontSize:22, fontWeight:700, color:colors.text.primary }}>
              Xatolik yuz berdi
            </p>
            <p style={{ margin:0, fontSize:13, color:colors.text.muted, lineHeight:1.5 }}>
              {message}
            </p>
          </div>

          <div style={{ display:'flex', gap:10, width:'100%' }}>
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              style={{
                flex:1, padding:'13px 16px', borderRadius:14,
                background:'rgba(255,255,255,0.07)',
                border:'1px solid rgba(255,255,255,0.12)',
                color:colors.text.secondary, fontSize:14, fontWeight:600,
                cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'center', gap:7,
              }}
            >
              <RefreshCw size={16} /> Qayta yuklash
            </motion.button>
            <Link to="/" style={{ flex:1, textDecoration:'none' }}>
              <GradientBtn type="button" style={{ height:'100%' }}>
                <Home size={16} /> Bosh sahifa
              </GradientBtn>
            </Link>
          </div>
        </motion.div>
      </GlassCard>
    </PageWrapper>
  )
}
