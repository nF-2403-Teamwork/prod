import { createSlice, nanoid } from "@reduxjs/toolkit";

// Client-side state for features that live only in the UI layer for now:
// channels & groups the user created, and a local call log. Persisted to
// localStorage via redux-persist so they survive reloads.
const initialState = {
  channels: [], // { id, name, bio, avatar, ts }
  groups: [], // { id, name, bio, avatar, members: [email], ts }
  calls: [], // { id, email, name, avatar, dir: in|out|missed, duration, ts }
  contactAvatars: {}, // { [contactEmail]: dataURL } — local photo override per contact
  // Cross-user features tunneled through chat envelopes (see WebSocketContext).
  // Keyed by email; entries are deduped by id because history replays them.
  giftsByEmail: {}, // { [recipientEmail]: [{ id, emoji, name, note, from, ts }] }
  postsByEmail: {}, // { [authorEmail]: [{ id, ts, text, image, views }] }
  postViewers: {}, // { [postId]: [viewerEmails] } — who saw MY posts (author side)
  viewedPosts: {}, // { [postId]: true } — which foreign posts I already reported seeing
  profileOverrides: {}, // { [email]: { bio, displayName, firstName, lastName, avatar } }
};

const bucket = (state, key, email) => {
  if (!state[key]) state[key] = {};
  if (!state[key][email]) state[key][email] = [];
  return state[key][email];
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    addChannel: {
      reducer: (state, action) => {
        state.channels.unshift(action.payload);
      },
      prepare: (data) => ({ payload: { id: nanoid(), ts: Date.now(), ...data } }),
    },
    addGroup: {
      reducer: (state, action) => {
        state.groups.unshift(action.payload);
      },
      prepare: (data) => ({ payload: { id: nanoid(), ts: Date.now(), ...data } }),
    },
    addCall: {
      reducer: (state, action) => {
        state.calls.unshift(action.payload);
        if (state.calls.length > 100) state.calls.length = 100;
      },
      prepare: (data) => ({ payload: { id: nanoid(), ts: Date.now(), ...data } }),
    },
    clearCalls: (state) => {
      state.calls = [];
    },
    setContactAvatar: (state, action) => {
      const { email, avatar } = action.payload;
      if (!state.contactAvatars) state.contactAvatars = {};
      state.contactAvatars[email] = avatar;
    },
    clearContactAvatar: (state, action) => {
      if (state.contactAvatars) delete state.contactAvatars[action.payload];
    },
    addGift: (state, action) => {
      const { email, gift } = action.payload; // email = recipient
      const list = bucket(state, "giftsByEmail", email);
      if (!list.some((g) => g.id === gift.id)) list.unshift(gift);
    },
    addPost: (state, action) => {
      const { email, post } = action.payload; // email = author
      const list = bucket(state, "postsByEmail", email);
      if (!list.some((p) => p.id === post.id)) {
        list.unshift(post);
        list.sort((a, b) => b.ts - a.ts);
      }
    },
    removePost: (state, action) => {
      const { email, id } = action.payload;
      if (state.postsByEmail?.[email]) {
        state.postsByEmail[email] = state.postsByEmail[email].filter((p) => p.id !== id);
      }
    },
    // Author side: a contact reported viewing my post (deduped by email).
    addPostViewer: (state, action) => {
      const { id, viewer } = action.payload;
      if (!state.postViewers) state.postViewers = {};
      if (!state.postViewers[id]) state.postViewers[id] = [];
      if (!state.postViewers[id].includes(viewer)) state.postViewers[id].push(viewer);
    },
    // Viewer side: remember I already reported this post, so it's sent once.
    markPostViewed: (state, action) => {
      if (!state.viewedPosts) state.viewedPosts = {};
      state.viewedPosts[action.payload] = true;
    },
    // Viewer side: the author broadcast a fresh view count. Monotonic max —
    // history replays out of order must never shrink the counter.
    setPostViews: (state, action) => {
      const { email, id, views } = action.payload;
      const post = state.postsByEmail?.[email]?.find((p) => p.id === id);
      if (post) post.views = Math.max(post.views ?? 0, views);
    },
    setProfileOverride: (state, action) => {
      const { email, patch } = action.payload;
      if (!state.profileOverrides) state.profileOverrides = {};
      state.profileOverrides[email] = { ...state.profileOverrides[email], ...patch };
    },
  },
});

export const {
  addChannel,
  addGroup,
  addCall,
  clearCalls,
  setContactAvatar,
  clearContactAvatar,
  addGift,
  addPost,
  removePost,
  addPostViewer,
  markPostViewed,
  setPostViews,
  setProfileOverride,
} = appSlice.actions;
export default appSlice.reducer;
