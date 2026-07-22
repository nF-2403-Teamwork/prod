import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Send, Smile, Check, CheckCheck } from 'lucide-react'
import { setHistory, appendMessage, resetUnread } from '../store/slices/chatSlice'
import { colors, gradients, shadows } from '../theme/index.js'
import socket from '../socket'

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','🙂','😅',
  '👍','❤️','🔥','🎉','🙏','💪','✅','🚀',
  '⭐','😢','😡','🤣','👏','💯','🎊','😊',
]

function convKey(a, b) {
  return [a, b].sort().join('_')
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

function initials(first, last) {
  return `${first[0]}${last[0]}`.toUpperCase()
}

function Avatar({ contact, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: gradients.primary,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: 'white',
    }}>
      {initials(contact.firstName, contact.lastName)}
    </div>
  )
}

export default function UserChat() {
  const { userId } = useParams()
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const contacts = useSelector(s => s.chat.contacts)
  const onlineUsers = useSelector(s => s.chat.onlineUsers)
  const contact = contacts.find(c => c._id === userId)
  const key = user ? convKey(user._id, userId) : null
  const messages = useSelector(s => (key ? s.chat.messages[key] : null) || [])

  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user || !userId) return
    if (!/^[a-f\d]{24}$/i.test(userId)) return
    setText('')
    setShowEmoji(false)

    socket.emit('chat:history', { from: user._id, to: userId }, res => {
      if (res.success) dispatch(setHistory({ key: convKey(user._id, userId), messages: res.messages }))
      socket.emit('chat:read', { userId: user._id, fromUserId: userId }, readRes => {
        if (readRes?.success) dispatch(resetUnread(userId))
      })
    })
  }, [userId, user?._id])

  useLayoutEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || !user) return

    socket.emit('chat:send', { from: user._id, to: userId, text: trimmed }, res => {
      if (res.success) {
        dispatch(appendMessage({ key: convKey(user._id, userId), message: res.message }))
      }
    })
    setText('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  if (!contact) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: colors.text.muted, fontSize: 14,
    }}>
      Kontakt topilmadi
    </div>
  )

  const isOnline = onlineUsers.includes(userId)

  return (
    <div
      key={userId}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${colors.glass.border}`,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{ position: 'relative' }}>
          <Avatar contact={contact} size={42} />
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            background: isOnline ? '#34d399' : '#6b7280',
            border: '2px solid rgba(13,10,30,0.9)',
          }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.text.primary }}>
            {contact.firstName} {contact.lastName}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: isOnline ? '#34d399' : colors.text.muted }}>
            {isOnline ? '● Online' : '○ Offline'}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={messagesRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 13, color: colors.text.muted, marginTop: 40 }}>
            Hali xabar yo'q. Salomlashing! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const fromMe = msg.from === user?._id
            return (
              <div
                key={msg._id}
                style={{
                  display: 'flex',
                  flexDirection: fromMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 8,
                }}
              >
                {!fromMe && <Avatar contact={contact} size={30} />}
                <div style={{
                  maxWidth: '68%', display: 'flex', flexDirection: 'column',
                  alignItems: fromMe ? 'flex-end' : 'flex-start', gap: 3,
                }}>
                  <div style={{
                    padding: '9px 14px',
                    borderRadius: fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: 14, lineHeight: 1.45,
                    color: colors.text.primary,
                    background: fromMe ? gradients.primary : 'rgba(255,255,255,0.09)',
                    boxShadow: fromMe ? shadows.btn : shadows.sm,
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 11, color: colors.text.muted, paddingInline: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    {formatTime(msg.createdAt)}
                    {fromMe && (msg.read
                      ? <CheckCheck size={13} color="#34d399" />
                      : <Check size={13} color={colors.text.muted} />)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Emoji picker ── */}
      {showEmoji && (
        <div
          style={{
            overflow: 'hidden', borderTop: `1px solid ${colors.glass.border}`,
            background: 'rgba(255,255,255,0.04)', padding: '10px 16px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EMOJIS.map(emoji => (
              <button key={emoji}
                onClick={() => { setText(p => p + emoji); inputRef.current?.focus() }}
                style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${colors.glass.border}`,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={() => setShowEmoji(p => !p)}
          style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: showEmoji ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${showEmoji ? 'rgba(139,92,246,0.5)' : colors.glass.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: colors.text.secondary,
          }}>
          <Smile size={18} />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Xabar yozing..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 14, fontSize: 14,
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

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: text.trim() ? gradients.primary : 'rgba(255,255,255,0.07)',
            border: `1px solid ${text.trim() ? 'transparent' : colors.glass.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            color: 'white', boxShadow: text.trim() ? shadows.btn : 'none',
          }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
