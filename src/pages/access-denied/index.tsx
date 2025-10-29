import { Link } from 'react-router-dom'
import { ApiService } from '../../services/api'
import '../../Homepage.css'
import { useState } from 'react'

function AccessDeniedPage() {
  const currentUser = ApiService.getCurrentUser()
  const userRole = ApiService.getUserRole()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="page bg-grid bg-radial">
      {/* Sidebar trigger */}
      <button
        className="sidebar-overlay-trigger"
        onClick={() => setIsSidebarOpen(true)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>

      {/* Desktop drag handle */}
      <div
        className="sidebar-drag-handle"
        onMouseDown={() => setIsSidebarOpen(true)}
      >
      </div>
      <div className="layout">
        <aside className="sidebar">
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-red-600" />
              <span className="font-semibold">EzBuild</span>
            </div>
          </div>

          <div>
            <div className="sidebar-group">Navigation</div>
            <Link className="nav-item" to="/">Back to Home</Link>
            {ApiService.isStaff() && !ApiService.isAdmin() && (
              <Link className="nav-item" to="/staff">Staff Panel</Link>
            )}
            {ApiService.isAdmin() && (
              <Link className="nav-item" to="/admin">Admin Panel</Link>
            )}
          </div>
        </aside>

        {/* Sidebar - Mobile Overlay */}
        {isSidebarOpen && (
          <>
            <div className="sidebar-overlay-backdrop" onClick={() => setIsSidebarOpen(false)} />
            <aside className={`sidebar-overlay open`}>
              <div className="flex items-center justify-between px-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-red-600" />
                  <span className="font-semibold">EzBuild</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white/80 hover:text-white p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <div className="sidebar-group">Navigation</div>
                <Link className="nav-item" to="/" onClick={() => setIsSidebarOpen(false)}>Back to Home</Link>
                {ApiService.isStaff() && !ApiService.isAdmin() && (
                  <Link className="nav-item" to="/staff" onClick={() => setIsSidebarOpen(false)}>Staff Panel</Link>
                )}
                {ApiService.isAdmin() && (
                  <Link className="nav-item" to="/admin" onClick={() => setIsSidebarOpen(false)}>Admin Panel</Link>
                )}
              </div>
            </aside>
          </>
        )}

        <main className="main">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
              <p className="text-xl text-white/70 mb-6">
                Bạn không có quyền truy cập trang này
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">Thông tin tài khoản</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-white/70">Email:</span>
                  <span className="font-medium text-white">{String(currentUser?.email || 'N/A')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Role:</span>
                  <span className={`font-medium px-2 py-1 rounded text-sm ${
                    userRole === 'Admin' ? 'bg-red-500/20 text-red-300' :
                    userRole === 'Staff' ? 'bg-green-500/20 text-green-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {userRole || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-white/70">
                {userRole === 'Admin' ? 'Bạn có quyền truy cập tất cả các trang.' :
                 userRole === 'Staff' ? 'Bạn có thể truy cập Staff Panel.' :
                 'Bạn chỉ có quyền truy cập trang chủ và sản phẩm.'}
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link 
                  to="/" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Về trang chủ
                </Link>
                {userRole === 'Admin' && (
                  <Link 
                    to="/admin" 
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {userRole === 'Staff' && (
                  <Link 
                    to="/staff" 
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Staff Panel
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AccessDeniedPage
