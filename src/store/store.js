import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage

import authReducer from "./authSlice";
import accountsReducer from "./accountsSlice";
import uiReducer from "./uiSlice";
import appReducer from "./appSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  accounts: accountsReducer,
  ui: uiReducer,
  app: appReducer,
});

const migrations = {
  // v2 added the multi-account slice. Anyone already signed in has a valid
  // session in `auth` but no `accounts` entry for it, and nothing would ever
  // backfill one — seed the list from the session they're holding.
  2: (state) => ({
    ...state,
    accounts:
      state.auth?.token && state.auth?.user?.email
        ? {
            list: [{ user: state.auth.user, token: state.auth.token }],
            activeEmail: state.auth.user.email,
          }
        : { list: [], activeEmail: null },
  }),
};

const persistConfig = {
  key: "root",
  version: 2,
  storage,
  migrate: createMigrate(migrations),
  // Only persist these slices to localStorage
  whitelist: ["auth", "accounts", "ui", "app"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these non-serializable actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
