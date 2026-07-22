import { createSlice } from "@reduxjs/toolkit";

import { setCredentials, updateUser, logout } from "./authSlice";

const initialState = {
  list: [], // [{ user, token }] — every account signed in on this device
  activeEmail: null,
};

const indexOfEmail = (list, email) =>
  list.findIndex((a) => a.user?.email === email);

// The locally stored account list. `authSlice` stays the source of truth for the
// *active* session; this slice mirrors it through extraReducers so the two can
// never drift apart, and keeps the other accounts' tokens alive so switching
// back never asks for a password again.
const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    accountRemoved: (state, action) => {
      const email = action.payload;
      state.list = state.list.filter((a) => a.user?.email !== email);
      if (state.activeEmail === email) state.activeEmail = null;
    },
    accountsCleared: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(setCredentials, (state, action) => {
        const { user, token } = action.payload;
        if (!user?.email || !token) return;
        const at = indexOfEmail(state.list, user.email);
        if (at === -1) state.list.push({ user, token });
        else state.list[at] = { user, token };
        state.activeEmail = user.email;
      })
      .addCase(updateUser, (state, action) => {
        const at = indexOfEmail(state.list, state.activeEmail);
        if (at !== -1) {
          state.list[at].user = { ...state.list[at].user, ...action.payload };
        }
      })
      // Only the active session ends here — the stored list survives so a
      // sign-out of one account can hand over to another.
      .addCase(logout, (state) => {
        state.activeEmail = null;
      });
  },
});

export const { accountRemoved, accountsCleared } = accountsSlice.actions;
export default accountsSlice.reducer;
