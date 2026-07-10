import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload.notifications
      state.unreadCount = action.payload.unreadCount
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload)
      state.unreadCount += 1
    },
    markAllRead: (state) => {
      state.items = state.items.map(n => ({ ...n, read: true }))
      state.unreadCount = 0
    },
    clearNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
    },
  },
})

export const { setNotifications, addNotification, markAllRead, clearNotifications } = notificationSlice.actions
export default notificationSlice.reducer
