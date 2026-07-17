import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification(state, action) {
      const exists = state.list.some((n) => n._id === action.payload._id);
      if (exists) return;
      state.list.unshift(action.payload);
      state.unreadCount += 1;
    },
    setNotifications(state, action) {
      state.list = action.payload;
      state.unreadCount = action.payload.length;
    },
    removeNotification(state, action) {
      state.list = state.list.filter((n) => n._id !== action.payload);
    },
    markAllRead(state) {
      state.unreadCount = 0;
    },
    clearNotifications(state) {
      state.list = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  setNotifications,
  removeNotification,
  markAllRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
