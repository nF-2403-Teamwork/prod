import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useMatch } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MessageSquare, LogOut, MessageCircle, Menu, Bell, X,
  BadgeCheck, UserRound, UsersRound, Radio, Phone, Settings, Contact, UserPlus,
} from 'lucide-react'
import { logout } from './store/slices/authSlice'
import { setContacts, addContact, setOnlineUsers, appendMessage, clearChat, incrementUnread, resetUnread, markRead } from './store/slices/chatSlice'
import { setNotifications, addNotification, markAllRead, clearNotifications } from './store/slices/notificationSlice'
import { BackgroundOrbs, IconBtn } from './theme/components.jsx'
import { colors, gradients, shadows } from './theme/index.js'
import socket from './socket'
import { playNotificationSound } from './utils/sound'

function convKey(a, b) {
  return [a, b].sort().join('_')
}

function initials(first, last) {
  return (first[0] + last[0]).toUpperCase()
}

function timeAgo(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'hozir'
  if (min < 60) return min + ' daqiqa oldin'
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr + ' soat oldin'
  return Math.floor(hr / 24) + ' kun oldin'
}

const NOTIF_TEXT = { friend_add: "sizni do'st sifatida qo'shdi" }

function Avatar({ contact, size = 44, isOnline }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: gradients.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: 'white',
        boxShadow: isOnline ? '0 0 0 2px rgba(52,211,153,0.6)' : 'none',
      }}>
        {initials(contact.firstName, contact.lastName)}
      </div>
      {isOnline !== undefined && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: isOnline ? '#34d399' : '#6b7280',
          border: '2px solid rgba(13,10,30,0.8)',
        }} />
      )}
    </div>
  )
}

function ContactItem({ contact, isActive, isOnline, unreadCount, onClick }) {
  return (
    <button
      onClick={() => onClick(contact._id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: isActive ? 'rgba(124,58,237,0.18)' : 'transparent',
        borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
      }}
    >
      <Avatar contact={contact} isOnline={isOnline} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 600, color: colors.text.primary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {contact.firstName} {contact.lastName}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: isOnline ? '#34d399' : colors.text.muted }}>
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
      {unreadCount > 0 && (
        <span style={{
          minWidth: 20, height: 20, borderRadius: 10, padding: '0 6px',
          background: '#7c3aed', color: 'white', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

function SearchResultItem({ result, onAdd, onOpenChat }) {
  return (
    <div
      onClick={() => onOpenChat(result)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}
    >
      <Avatar contact={result} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 600, color: colors.text.primary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {result.firstName} {result.lastName}
        </p>
        <p style={{
          margin: '2px 0 0', fontSize: 12, color: colors.text.muted,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {result.email}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(result._id) }}
        title="Do'stlikka qo'shish"
        style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'rgba(124,58,237,0.20)', border: '1px solid rgba(139,92,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: colors.primaryLight,
        }}
      >
        <UserPlus size={16} />
      </button>
    </div>
  )
}

export function EmptyState() {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 16,
      }}
    >
      <div
        style={{
          width: 72, height: 72, borderRadius: 22,
          background: gradients.primarySoft,
          border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <MessageSquare size={32} color={colors.primaryLight} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: colors.text.secondary }}>
          Kontakt tanlang
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.text.muted }}>
          Chap paneldan kontakt tanlang
        </p>
      </div>
    </div>
  )
}

function ProfileDrawer({ open, onClose, user }) {
  const isVerified = !!(user && user.email && user.email.endsWith('@gmail.com'))
  const items = [
    { icon: UserRound,  label: 'Mening profilim' },
    { icon: UsersRound, label: "Guruh yaratish" },
    { icon: Radio,      label: 'Kanal yaratish' },
    { icon: Contact,    label: 'Mening kontaktlarim' },
    { icon: Phone,      label: "Qo'ng'iroqlar" },
    { icon: Settings,   label: 'Sozlamalar' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.45)' }}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 91,
              width: 320, maxWidth: '85vw',
              background: 'rgba(20,16,40,0.98)',
              backdropFilter: 'blur(20px)',
              borderLeft: `1px solid ${colors.glass.border}`,
              display: 'flex', flexDirection: 'column',
              boxShadow: shadows.card,
            }}
          >
            <div style={{
              padding: '20px 20px 18px',
              borderBottom: `1px solid ${colors.glass.border}`,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              {user && <Avatar contact={user} size={52} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <p style={{
                    margin: 0, fontSize: 16, fontWeight: 700, color: colors.text.primary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {user && user.firstName} {user && user.lastName}
                  </p>
                  {isVerified && <BadgeCheck size={16} color="#34d399" />}
                </div>
                <p style={{
                  margin: '3px 0 0', fontSize: 12, color: colors.text.muted,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user && user.email}
                </p>
              </div>
              <IconBtn icon={X} onClick={onClose} title="Yopish" size={16} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
              {items.map(({ icon: Icon, label }) => (
                <motion.button
                  key={label}
                  onClick={onClose}
                  whileHover={{ background: 'rgba(255,255,255,0.07)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 12px', border: 'none', borderRadius: 12,
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Icon size={18} color={colors.primaryLight} />
                  <span style={{ fontSize: 14, color: colors.text.primary }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function NotificationPanel({ open, items, onClose }) {
  const unread = items.filter(n => !n.read).length
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', top: 64, left: 176, zIndex: 80,
            width: 300, maxHeight: 360, overflowY: 'auto',
            background: 'rgba(20,16,40,0.98)',
            border: `1px solid ${colors.glass.border}`,
            borderRadius: 16, boxShadow: shadows.card,
          }}
        >
          <div style={{
            padding: '10px 12px 10px 16px', borderBottom: `1px solid ${colors.glass.border}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.text.primary }}>
              Bildirishnomalar
            </span>
            {unread > 0 && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
                background: '#7c3aed', color: 'white', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <IconBtn icon={X} onClick={onClose} title="Yopish" size={14} />
          </div>
          {items.length === 0 ? (
            <p style={{ margin: 0, padding: '24px 16px', textAlign: 'center', fontSize: 13, color: colors.text.muted }}>
              Bildirishnoma yo'q
            </p>
          ) : (
            items.map(n => (
              <div key={n._id} style={{
                padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
                background: n.read ? 'transparent' : 'rgba(124,58,237,0.22)',
                borderBottom: `1px solid ${colors.glass.border}`,
              }}>
                {n.from && <Avatar contact={n.from} size={32} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: colors.text.primary }}>
                    <b>{n.from && n.from.firstName} {n.from && n.from.lastName}</b> {NOTIF_TEXT[n.type] || 'yangi bildirishnoma yubordi'}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: colors.text.muted }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: colors.primaryLight, marginTop: 5,
                  }} />
                )}
              </div>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const match = useMatch('/chat/:userId')
  const activeId = match?.params?.userId
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const contacts = useSelector(s => s.chat.contacts)
  const contactsLoading = useSelector(s => s.chat.contactsLoading)
  const onlineUsers = useSelector(s => s.chat.onlineUsers)
  const unreadCounts = useSelector(s => s.chat.unreadCounts)
  const notifications = useSelector(s => s.notification.items)
  const unreadCount = useSelector(s => s.notification.unreadCount)

  const activeIdRef = useRef(activeId)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  useEffect(() => {
    // eski persisted sessiyada user._id bo'lmasligi mumkin — null user:online yubormaymiz
    if (!user?._id) return

    const init = () => {
      socket.emit('user:online', user._id)
      socket.emit('contacts:list', user._id, res => {
        if (res.success) dispatch(setContacts(res.contacts))
      })
      socket.emit('notifications:list', user._id, res => {
        if (res.success) dispatch(setNotifications({ notifications: res.notifications, unreadCount: res.unreadCount }))
      })
    }

    // ulanish tugamasidan emit qilsak paketlar bufferga tushib, connect'da ikki marta ketadi
    socket.on('connect', init)
    if (socket.connected) init()

    socket.on('users:online', ids => dispatch(setOnlineUsers(ids)))

    socket.on('chat:receive', msg => {
      dispatch(appendMessage({ key: convKey(msg.from, msg.to), message: msg }))
      playNotificationSound()
      if (activeIdRef.current === msg.from) {
        socket.emit('chat:read', { userId: msg.to, fromUserId: msg.from }, res => {
          if (res?.success) dispatch(resetUnread(msg.from))
        })
      } else {
        dispatch(incrementUnread(msg.from))
      }
    })

    socket.on('chat:read', ({ by }) => {
      dispatch(markRead({ key: convKey(user._id, by), readerId: by }))
    })

    socket.on('contacts:added', contact => dispatch(addContact(contact)))
    socket.on('notification:new', notification => dispatch(addNotification(notification)))

    return () => {
      socket.off('connect', init)
      socket.off('users:online')
      socket.off('chat:receive')
      socket.off('chat:read')
      socket.off('contacts:added')
      socket.off('notification:new')
    }
  }, [user?._id])

  useEffect(() => {
    const query = search.trim()
    if (!user) return
    const timeout = setTimeout(() => {
      if (query.length < 2) { setSearchResults([]); return }
      socket.emit('users:search', { currentUserId: user._id, query }, res => {
        if (res.success) {
          const contactIds = new Set(contacts.map(c => c._id))
          setSearchResults(res.users.filter(u => !contactIds.has(u._id)))
        }
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [search, user?._id, contacts])

  const handleLogout = () => {
    dispatch(clearChat())
    dispatch(clearNotifications())
    dispatch(logout())
  }

  const handleAddFriend = (targetId) => {
    socket.emit('contacts:add', { userId: user._id, targetId }, res => {
      if (res.success) {
        dispatch(addContact(res.contact))
        setSearchResults(prev => prev.filter(u => u._id !== targetId))
      }
    })
  }

  const handleOpenChat = (result) => {
    dispatch(addContact(result))
    setSearch('')
    setSearchResults([])
    navigate('/chat/' + result._id)
  }

  const handleOpenNotifications = () => {
    setNotifOpen(p => {
      const next = !p
      if (next && unreadCount > 0) {
        socket.emit('notifications:read', user._id, () => dispatch(markAllRead()))
      }
      return next
    })
  }

  const filtered = contacts.filter(c =>
    (c.firstName + ' ' + c.lastName + ' ' + c.email).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden',
      background: gradients.bg,
      display: 'flex',
    }}>
      <BackgroundOrbs />

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
          position: 'relative', zIndex: 10,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: `1px solid ${colors.glass.border}`,
        }}
      >
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: `1px solid ${colors.glass.border}`,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: gradients.logo,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: shadows.logo,
              }}>
                <MessageCircle size={17} color="white" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.text.primary }}>
                  Chat App
                </p>
                {user && (
                  <p style={{ margin: 0, fontSize: 11, color: colors.text.muted }}>
                    {user.firstName} {user.lastName}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconBtn icon={Menu} onClick={() => setDrawerOpen(true)} title="Menyu" />
              <div style={{ position: 'relative' }}>
                <IconBtn icon={Bell} onClick={handleOpenNotifications} title="Bildirishnomalar" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    minWidth: 16, height: 16, borderRadius: 8, padding: '0 3px',
                    background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(13,10,30,0.9)',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <IconBtn icon={LogOut} onClick={handleLogout} title="Chiqish" />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: colors.text.muted, pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px 9px 36px',
                borderRadius: 12, fontSize: 13,
                background: colors.glass.inputBg,
                border: `1px solid ${colors.glass.inputBorder}`,
                color: colors.text.primary, outline: 'none',
              }}
              onFocus={e => {
                e.target.style.border = `1px solid ${colors.glass.inputFocusBorder}`
                e.target.style.boxShadow = colors.glass.inputFocusShadow
              }}
              onBlur={e => {
                e.target.style.border = `1px solid ${colors.glass.inputBorder}`
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          <AnimatePresence mode="wait">
            {contactsLoading ? (
              <motion.p
                key="loading-msg"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', fontSize: 13, color: colors.text.muted, marginTop: 32, padding: '0 16px' }}
              >
                Загрузка...
              </motion.p>
            ) : filtered.length === 0 && searchResults.length === 0 ? (
              <motion.p
                key="empty-msg"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', fontSize: 13, color: colors.text.muted, marginTop: 32, padding: '0 16px' }}
              >
                {search ? 'Ничего не найдено' : 'Чаты'}
              </motion.p>
            ) : (
              <motion.div key="contact-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filtered.map((c, i) => (
                  <ContactItem
                    key={c._id}
                    contact={c}
                    index={i}
                    isActive={c._id === activeId}
                    isOnline={onlineUsers.includes(c._id)}
                    unreadCount={unreadCounts[c._id] || 0}
                    onClick={id => navigate('/chat/' + id)}
                  />
                ))}

                {searchResults.length > 0 && (
                  <>
                    <p style={{ margin: '14px 16px 4px', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: colors.text.muted, textTransform: 'uppercase' }}>
                      Qo'shish mumkin
                    </p>
                    {searchResults.map((r, i) => (
                      <SearchResultItem key={r._id} result={r} index={i} onAdd={handleAddFriend} onOpenChat={handleOpenChat} />
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        <Outlet />
      </main>

      <NotificationPanel open={notifOpen} items={notifications} onClose={() => setNotifOpen(false)} />
      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
    </div>
  )
}
