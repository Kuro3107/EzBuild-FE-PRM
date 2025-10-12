import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/homepage/index.tsx'
import AppShell from './components/AppShell'
import SalesPage from './pages/sales/index.tsx'
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
import AdminPage from './pages/admin/index.tsx'
import CustomerProfilePage from './pages/customer/index.tsx'
import PCBuilderPage from './pages/pcbuilder/index.tsx'
import OAuth2RedirectHandler from "./pages/login&register/OAuth2RedirectHandler"  

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
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/pcbuilder" element={<PCBuilderPage />} />
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
          <Route path="/staff" element={
            <ProtectedRoute requiredRole="Staff">
              <StaffPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  </StrictMode>,
)
