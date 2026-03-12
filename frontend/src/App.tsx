import { Routes, Route } from 'react-router-dom'
import { Spin } from 'antd'
import { lazy, Suspense } from 'react'
import { useGetMeQuery } from './store/api/authApi'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

const HomePage = lazy(() => import('./pages/HomePage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const ItemPage = lazy(() => import('./pages/ItemPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

export default function App() {
  const { isLoading } = useGetMeQuery()

  if (isLoading) return <Spin fullscreen size="large" />

  return (
    <Suspense fallback={<Spin fullscreen />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/inventory/:id" element={<InventoryPage />} />
          <Route path="/inventory/:inventoryId/item/:itemId" element={<ItemPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
