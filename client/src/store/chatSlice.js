import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contacts: [],
  chats: [],
  searchResults: [],
  searchLoading: false,
  activeChat: null,
  messages: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setContacts(state, action) {
      state.contacts = action.payload;
    },
    setChats(state, action) {
      state.chats = action.payload;
    },
    setSearchResults(state, action) {
      state.searchResults = action.payload;
    },
    setSearchLoading(state, action) {
      state.searchLoading = action.payload;
    },
    addToContacts(state, action) {
      const user = action.payload;
      const exists = state.contacts.some((c) => c._id === user._id);
      if (!exists) {
        state.contacts.push(user);
      }
    },
    addToChats(state, action) {
      const user = action.payload;
      const exists = state.chats.some((c) => c._id === user._id);
      if (!exists) {
        state.chats.push({ ...user, lastMessage: "" });
      }
    },
    clearSearch(state) {
      state.searchResults = [];
      state.searchLoading = false;
    },
    setActiveChat(state, action) {
      state.activeChat = action.payload;
      state.messages = [];
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    updateLastMessage(state, action) {
      const { contactId, text } = action.payload;
      const chat = state.chats.find((c) => c._id === contactId);
      if (chat) {
        chat.lastMessage = text;
      }
    },
  },
});

export const {
  setContacts,
  setChats,
  setSearchResults,
  setSearchLoading,
  addToContacts,
  addToChats,
  clearSearch,
  setActiveChat,
  setMessages,
  addMessage,
  updateLastMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
