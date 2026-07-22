import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'
import './index.css'

import App, { EmptyState } from './App.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import UserChat from './pages/UserChat.jsx'
import Profile from './pages/Profile.jsx'
import GroupChat from './pages/GroupChat.jsx'
import NotFound from './pages/NotFound.jsx'
import ErrorBoundary from './pages/ErrorBoundary.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <EmptyState /> },
      { path: 'chat/:userId', element: <UserChat /> },
      { path: 'profile', element: <Profile /> },
      { path: 'group/:groupId', element: <GroupChat /> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <Register />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  </StrictMode>,
)
