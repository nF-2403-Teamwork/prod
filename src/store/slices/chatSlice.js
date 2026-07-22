import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    contacts: [],
    contactsLoading: true,
    messages: {},    // { convKey: [message, ...] }
    onlineUsers: [], // array of userId strings
    unreadCounts: {}, // { contactId: count }
  },
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload
      state.contactsLoading = false
      action.payload.forEach(c => {
        state.unreadCounts[c._id] = c.unreadCount || 0
      })
    },
    addContact: (state, action) => {
      if (!state.contacts.some(c => c._id === action.payload._id)) {
        state.contacts.push(action.payload)
      }
      if (state.unreadCounts[action.payload._id] === undefined) {
        state.unreadCounts[action.payload._id] = 0
      }
    },
    setHistory: (state, action) => {
      const { key, messages } = action.payload
      state.messages[key] = messages
    },
    appendMessage: (state, action) => {
      const { key, message } = action.payload
      if (!state.messages[key]) state.messages[key] = []
      if (!state.messages[key].some(m => m._id === message._id)) {
        state.messages[key].push(message)
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
    incrementUnread: (state, action) => {
      const contactId = action.payload
      state.unreadCounts[contactId] = (state.unreadCounts[contactId] || 0) + 1
    },
    resetUnread: (state, action) => {
      const contactId = action.payload
      state.unreadCounts[contactId] = 0
    },
    markRead: (state, action) => {
      const { key, readerId } = action.payload
      if (!state.messages[key]) return
      state.messages[key].forEach(message => {
        if (message.from !== readerId) {
          message.read = true
        }
      })
    },
    clearChat: (state) => {
      state.contacts = []
      state.contactsLoading = true
      state.messages = {}
      state.onlineUsers = []
      state.unreadCounts = {}
    },
  },
})

export const {
  setContacts,
  addContact,
  setHistory,
  appendMessage,
  setOnlineUsers,
  incrementUnread,
  resetUnread,
  markRead,
  clearChat,
} = chatSlice.actions
export default chatSlice.reducer
