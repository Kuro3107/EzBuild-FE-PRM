import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ApiService } from '../../services/api'
import '../../Homepage.css'

function AdminPage() {
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const user = ApiService.getCurrentUser()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  // Xử lý click outside cho user menu
  useEffect(() => {
    if (!isUserMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen])

  const handleLogout = () => {
    ApiService.clearAuthData()
    setCurrentUser(null)
    setIsUserMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className="page bg-grid bg-radial">
      {/* Header với avatar user */}
      {currentUser && (
        <header className="fixed top-0 right-0 z-50 p-2 md:p-4">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 md:gap-3 bg-white/95 backdrop-blur-sm border border-black/20 rounded-full px-2 md:px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold">
                {(currentUser.email as string || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-800 max-w-20 md:max-w-32 truncate hidden sm:block">
                {currentUser.email as string || 'Admin'}
              </span>
              <svg 
                className={`w-3 h-3 md:w-4 md:h-4 text-gray-600 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isUserMenuOpen && (
              <div
                ref={userMenuRef}
                className="absolute top-full right-0 mt-2 w-48 md:w-56 bg-white/95 backdrop-blur-sm rounded-xl border border-black/20 shadow-2xl py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {currentUser.email as string || 'Admin'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ApiService.getUserRole() || 'Admin'}
                    </div>
                  </div>
                </div>
                <Link 
                  to="/customer"
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center gap-3"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Favorites
                </button>
                <hr className="my-2 border-gray-200" />
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors text-sm flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-red-600" />
              <span className="font-semibold">Admin Panel</span>
            </div>
          </div>

          <div>
            <div className="sidebar-group">Admin Management</div>
            <Link className="nav-item" to="/admin/dashboard">Admin Dashboard</Link>
            <Link className="nav-item" to="/admin/users">User Management</Link>
            <Link className="nav-item" to="/admin/ai">AI Management</Link>
            <Link className="nav-item" to="/admin/staff">Staff Management</Link>
          </div>

          <div>
            <div className="sidebar-group">Navigation</div>
            <Link className="nav-item" to="/">Back to Home</Link>
            <Link className="nav-item" to="/products">Products</Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Quản lý hệ thống từ góc độ quản trị viên</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Admin Dashboard</h3>
              </div>
              <p className="text-gray-600 mb-4">Tổng quan hệ thống, thống kê toàn diện và giám sát hoạt động</p>
              <Link to="/admin/dashboard" className="text-blue-600 text-sm font-medium hover:underline">
                Truy cập Dashboard →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">User Management</h3>
              </div>
              <p className="text-gray-600 mb-4">Quản lý người dùng, phân quyền và kiểm soát truy cập</p>
              <Link to="/admin/users" className="text-blue-600 text-sm font-medium hover:underline">
                Quản lý Users →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">AI Management</h3>
              </div>
              <p className="text-gray-600 mb-4">Quản lý AI, machine learning và tự động hóa hệ thống</p>
              <Link to="/admin/ai" className="text-blue-600 text-sm font-medium hover:underline">
                Cấu hình AI →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Staff Management</h3>
              </div>
              <p className="text-gray-600 mb-4">Quản lý nhân viên, phân quyền và giám sát hoạt động</p>
              <Link to="/admin/staff" className="text-blue-600 text-sm font-medium hover:underline">
                Quản lý Staff →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminPage
