import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/homepage/index.tsx'
import AppShell from './components/AppShell'
import CasePage from './pages/products/case.tsx'
import CPUPage from './pages/products/cpu.tsx'
import ProductDetailPage from './pages/products/product-detail.tsx'
import MainboardPage from './pages/products/mainboard.tsx'
import GPUPage from './pages/products/gpu.tsx'
import RAMPage from './pages/products/ram.tsx'
import StoragePage from './pages/products/storage.tsx'
import PSUPage from './pages/products/psu.tsx'
import CoolingPage from './pages/products/cooling.tsx'
import HeadsetSpeakerPage from './pages/products/headset-speaker.tsx'
import MonitorPage from './pages/products/monitor.tsx'
import MousePage from './pages/products/mouse.tsx'
import KeyboardPage from './pages/products/keyboard.tsx'
import LoginPage from './pages/login&register/login.tsx'
import RegisterPage from './pages/login&register/register.tsx'
import ForgotPasswordPage from './pages/login&register/forgot-password.tsx'
import ComparePage from './pages/compare/compare.tsx'
import StaffPage from './pages/staff/index.tsx'
import StaffDashboardPage from './pages/staff/dashboard.tsx'
import StaffOrdersPage from './pages/staff/orders.tsx'
import StaffPaymentsPage from './pages/staff/payments.tsx'
import StaffDebugPage from './pages/staff/debug.tsx'
import StaffProductsPage from './pages/staff/products.tsx'
import StaffServicesPage from './pages/staff/services.tsx'
import StaffGamesPage from './pages/staff/games.tsx'
import StaffFeedbacksPage from './pages/staff/feedbacks.tsx'
import AdminPage from './pages/admin/index.tsx'
import AdminUsersPage from './pages/admin/users.tsx'
import CustomerProfilePage from './pages/customer/index.tsx'
import CustomerBuildsPage from './pages/customer/builds.tsx'
import CustomerOrdersPage from './pages/customer/orders.tsx'
import PCBuilderPage from './pages/pcbuilder/index.tsx'
import CheckoutPage from './pages/checkout/index.tsx'
import OAuth2RedirectHandler from "./pages/login&register/OAuth2RedirectHandler"  
import UserChatPage from './pages/chat/user.tsx'
import StaffChatPage from './pages/chat/staff.tsx'
import ProfilePage from './pages/profile/index.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/pcbuilder" element={<PCBuilderPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/chat" element={<UserChatPage />} />
          <Route path="/products/case" element={<CasePage />} />
          <Route path="/products/cpu" element={<CPUPage />} />
          <Route path="/products/:category/:id" element={<ProductDetailPage />} />
          <Route path="/products/mainboard" element={<MainboardPage />} />
          <Route path="/products/gpu" element={<GPUPage />} />
          <Route path="/products/ram" element={<RAMPage />} />
          <Route path="/products/storage" element={<StoragePage />} />
          <Route path="/products/psu" element={<PSUPage />} />
          <Route path="/products/cooling" element={<CoolingPage />} />
          <Route path="/products/headset-speaker" element={<HeadsetSpeakerPage />} />
          <Route path="/products/monitor" element={<MonitorPage />} />
          <Route path="/products/mouse" element={<MousePage />} />
          <Route path="/products/keyboard" element={<KeyboardPage />} />
          <Route path="/customer" element={<CustomerProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/builds" element={<CustomerBuildsPage />} />
          <Route path="/orders" element={<CustomerOrdersPage />} />
          <Route path="/staff" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/orders" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/payments" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffPaymentsPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/debug" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffDebugPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/products" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffProductsPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/services" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffServicesPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/games" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffGamesPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/feedbacks" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffFeedbacksPage />
            </ProtectedRoute>
          } />
          <Route path="/staff/chat" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffChatPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requiredRole="Admin">
              <StaffProductsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminUsersPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  </StrictMode>,
)
