import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "./store/store";
import { WebSocketProvider } from "./context/WebSocketContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./pages/ErrorBoundary";
import "./index.css";

// React Router v6 (data router). `errorElement` renders <ErrorBoundary /> for
// any error thrown in the tree; the `*` route renders <NotFound />. Routes
// nested under <ProtectedRoute /> require authentication.
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: "chat", element: <Chat /> }],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <WebSocketProvider>
          <RouterProvider router={router} />
        </WebSocketProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
