import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, Ghost } from 'lucide-react'
import { PageWrapper, GlassCard, GradientBtn } from '../theme/components.jsx'
import { colors, variants } from '../theme/index.js'

export default function NotFound() {
  return (
    <PageWrapper>
      <GlassCard maxWidth={400} padding="48px 36px">
        <motion.div
          variants={variants.page}
          initial="initial"
          animate="animate"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, textAlign:'center' }}
        >
          <motion.div
            variants={variants.scaleIn}
            style={{
              width:80, height:80, borderRadius:24,
              background:'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.25))',
              border:'1px solid rgba(139,92,246,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <Ghost size={38} color={colors.primaryLight} />
          </motion.div>

          <div>
            <motion.p
              animate={{ opacity:[0.4,1,0.4] }}
              transition={{ duration:2.5, repeat:Infinity }}
              style={{ margin:'0 0 6px', fontSize:72, fontWeight:800, color:'transparent',
                background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                lineHeight:1 }}
            >
              404
            </motion.p>
            <p style={{ margin:0, fontSize:20, fontWeight:700, color:colors.text.primary }}>
              Sahifa topilmadi
            </p>
            <p style={{ margin:'6px 0 0', fontSize:13, color:colors.text.muted }}>
              Siz izlagan sahifa mavjud emas yoki o'chirilgan
            </p>
          </div>

          <Link to="/" style={{ width:'100%', textDecoration:'none' }}>
            <GradientBtn type="button">
              <Home size={17} /> Bosh sahifaga qaytish
            </GradientBtn>
          </Link>
        </motion.div>
      </GlassCard>
    </PageWrapper>
  )
}
