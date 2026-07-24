import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "./store/store";
import { WebSocketProvider } from "./context/WebSocketContext";
import { CallProvider } from "./context/CallContext";
import CallOverlay from "./components/CallOverlay";
import ThemeApplier from "./components/ThemeApplier";
import ProtectedRoute from "./routes/ProtectedRoute";
import ChatLayout from "./layouts/ChatLayout";
import ChatEmpty from "./pages/ChatEmpty";
import Conversation from "./pages/Conversation";
import RoomConversation from "./pages/RoomConversation";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./pages/ErrorBoundary";
import "./index.css";

// React Router v6 data router. The chat lives at "/" behind <ProtectedRoute />;
// unauthenticated users are bounced to /login (which itself runs over the same
// websocket connection to request and verify a login code).
const router = createBrowserRouter([
  { path: "/login", element: <Login />, errorElement: <ErrorBoundary /> },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/",
        element: <ChatLayout />,
        children: [
          { index: true, element: <ChatEmpty /> },
          { path: "chat/:contactId", element: <Conversation /> },
          { path: "room/:roomId", element: <RoomConversation /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeApplier />
        <WebSocketProvider>
          {/* Outside the router so an incoming call surfaces on any screen. */}
          <CallProvider>
            <RouterProvider router={router} />
            <CallOverlay />
          </CallProvider>
        </WebSocketProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
