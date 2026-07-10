// ─── Design tokens ────────────────────────────────────────────────────────────
export const colors = {
  primary:      '#7c3aed',
  primaryLight: '#a78bfa',
  secondary:    '#4f46e5',
  accent:       '#6366f1',
  pink:         '#ec4899',
  text: {
    primary:   '#ffffff',
    secondary: 'rgba(255,255,255,0.60)',
    muted:     'rgba(255,255,255,0.35)',
    error:     '#f87171',
  },
  glass: {
    bg:               'rgba(255,255,255,0.06)',
    border:           'rgba(255,255,255,0.10)',
    hoverBg:          'rgba(255,255,255,0.10)',
    inputBg:          'rgba(255,255,255,0.07)',
    inputBorder:      'rgba(255,255,255,0.12)',
    inputFocusBorder: 'rgba(139,92,246,0.60)',
    inputFocusShadow: '0 0 20px rgba(139,92,246,0.15)',
  },
}

export const gradients = {
  bg:         'linear-gradient(135deg, #0d0a1e 0%, #1a1040 40%, #0d1a3a 100%)',
  primary:    'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6366f1 100%)',
  primarySoft:'linear-gradient(135deg, rgba(124,58,237,0.30), rgba(79,70,229,0.30))',
  logo:       'linear-gradient(135deg, #7c3aed, #4f46e5)',
  textPurple: 'linear-gradient(135deg, #a78bfa, #818cf8)',
}

export const shadows = {
  card: '0 32px 80px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.10)',
  btn:  '0 8px 30px rgba(124,58,237,0.40)',
  logo: '0 12px 32px rgba(124,58,237,0.45)',
  glow: '0 0 20px rgba(139,92,246,0.30)',
  sm:   '0 4px 16px rgba(0,0,0,0.30)',
}

export const radius = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 9999,
}

// ─── Framer Motion reusable variants ──────────────────────────────────────────
export const variants = {
  // Full page fade+slide in (use with AnimatePresence on route change)
  page: {
    initial:   { opacity: 0, y: 20 },
    animate:   { opacity: 1, y: 0,  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
    exit:      { opacity: 0, y: -14, transition: { duration: 0.25 } },
  },

  // Card pop-up from below
  cardPop: {
    initial:   { opacity: 0, y: 48, scale: 0.95 },
    animate:   { opacity: 1, y: 0,  scale: 1,
                 transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  },

  // Horizontal slide for multi-step forms
  slide: {
    enter:  d => ({ x: d > 0 ?  60 : -60, opacity: 0 }),
    center:    { x: 0, opacity: 1 },
    exit:   d => ({ x: d > 0 ? -60 :  60, opacity: 0 }),
  },

  // Staggered fade-up for list items  (use custom={index} on each item)
  fadeUp: {
    initial: { opacity: 0, y: 12 },
    animate: i => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.06, duration: 0.32, ease: 'easeOut' },
    }),
  },

  // Spring scale-in (icons, avatars)
  scaleIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1,
               transition: { type: 'spring', stiffness: 300, damping: 22 } },
  },

  // Subtle hover lift (apply to interactive cards)
  hoverLift: {
    whileHover: { y: -3, boxShadow: '0 20px 50px rgba(0,0,0,0.40)' },
    transition:  { type: 'spring', stiffness: 400, damping: 25 },
  },
}
