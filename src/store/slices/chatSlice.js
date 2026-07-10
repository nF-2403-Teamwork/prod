import { createSlice } from '@reduxjs/toolkit'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    contacts: [],
    contactsLoading: true,
    messages: {},    // { convKey: [message, ...] }
    onlineUsers: [], // array of userId strings
  },
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload
      state.contactsLoading = false
    },
    addContact: (state, action) => {
      if (!state.contacts.some(c => c._id === action.payload._id)) {
        state.contacts.push(action.payload)
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
    clearChat: (state) => {
      state.contacts = []
      state.contactsLoading = true
      state.messages = {}
      state.onlineUsers = []
    },
  },
})

export const { setContacts, addContact, setHistory, appendMessage, setOnlineUsers, clearChat } = chatSlice.actions
export default chatSlice.reducer
