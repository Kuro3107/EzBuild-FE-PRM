import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ApiService } from '../../services/api'
import '../../Homepage.css'

function StaffPage() {
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const dragDataRef = useRef<{ dragging: boolean; startX: number }>({ dragging: false, startX: 0 })

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
        onMouseDown={(e) => {
          dragDataRef.current.dragging = true
          dragDataRef.current.startX = e.clientX
          setIsSidebarOpen(true)
        }}
      >
      </div>
      {/* Header với avatar user */}
      {currentUser && (
        <header className="fixed top-0 right-0 z-50 p-2 md:p-4">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 md:gap-3 bg-white/95 backdrop-blur-sm border border-black/20 rounded-full px-2 md:px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold">
                {(currentUser.email as string || 'S').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-800 max-w-20 md:max-w-32 truncate hidden sm:block">
                {currentUser.email as string || 'Staff'}
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
                      {currentUser.email as string || 'Staff'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {ApiService.getUserRole() || 'Staff'}
                    </div>
                  </div>
                </div>
                <Link 
                  to="/profile"
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
        {/* Sidebar - Desktop */}
        <aside className="sidebar">
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-green-600" />
              <span className="font-semibold">Staff Panel</span>
            </div>
          </div>

          <div>
            <div className="sidebar-group">Staff Management</div>
            <Link className="nav-item" to="/staff/dashboard">Dashboard</Link>
            <Link className="nav-item" to="/staff/orders">Order Management</Link>
            <Link className="nav-item" to="/staff/payments">Payment Management</Link>
            <Link className="nav-item" to="/staff/products">Product Management</Link>
            <Link className="nav-item" to="/staff/services">Service Management</Link>
            <Link className="nav-item" to="/staff/games">Game Management</Link>
            <Link className="nav-item" to="/staff/feedbacks">Feedback Management</Link>
            <Link className="nav-item" to="/staff/debug">Debug</Link>
          </div>

          <div>
            <div className="sidebar-group">Navigation</div>
            <Link className="nav-item" to="/">Back to Home</Link>
            <Link className="nav-item" to="/products">Products</Link>
          </div>
        </aside>

        {/* Sidebar - Mobile Overlay */}
        {isSidebarOpen && (
          <>
            <div className="sidebar-overlay-backdrop" onClick={() => setIsSidebarOpen(false)} />
            <aside className={`sidebar-overlay open`}>
              <div className="flex items-center justify-between px-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-green-600" />
                  <span className="font-semibold">Staff Panel</span>
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
                <div className="sidebar-group">Staff Management</div>
                <Link className="nav-item" to="/staff/dashboard" onClick={() => setIsSidebarOpen(false)}>Dashboard</Link>
                <Link className="nav-item" to="/staff/orders" onClick={() => setIsSidebarOpen(false)}>Order Management</Link>
                <Link className="nav-item" to="/staff/payments" onClick={() => setIsSidebarOpen(false)}>Payment Management</Link>
                <Link className="nav-item" to="/staff/products" onClick={() => setIsSidebarOpen(false)}>Product Management</Link>
                <Link className="nav-item" to="/staff/services" onClick={() => setIsSidebarOpen(false)}>Service Management</Link>
                <Link className="nav-item" to="/staff/games" onClick={() => setIsSidebarOpen(false)}>Game Management</Link>
                <Link className="nav-item" to="/staff/feedbacks" onClick={() => setIsSidebarOpen(false)}>Feedback Management</Link>
                <Link className="nav-item" to="/staff/debug" onClick={() => setIsSidebarOpen(false)}>Debug</Link>
              </div>

              <div>
                <div className="sidebar-group">Navigation</div>
                <Link className="nav-item" to="/" onClick={() => setIsSidebarOpen(false)}>Back to Home</Link>
                <Link className="nav-item" to="/products" onClick={() => setIsSidebarOpen(false)}>Products</Link>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="main">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
            <p className="text-gray-600">Quản lý hệ thống từ góc độ nhân viên</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Dashboard</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Tổng quan hoạt động và thống kê</p>
              <Link to="/staff/dashboard" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Order Management</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Xử lý đơn hàng, giao dịch và vận chuyển</p>
              <Link to="/staff/orders" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Customer Support</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Hỗ trợ khách hàng, xử lý khiếu nại</p>
              <Link to="/staff/customers" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Inventory Management</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Quản lý kho hàng, nhập xuất tồn kho</p>
              <Link to="/staff/inventory" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Product Management</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Quản lý sản phẩm, giá cả, mô tả</p>
              <Link to="/staff/products" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Sales Management</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Quản lý bán hàng, khuyến mãi, doanh thu</p>
              <Link to="/staff/sales" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Reports & Analytics</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Báo cáo chi tiết, phân tích dữ liệu</p>
              <Link to="/staff/reports" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>

            <div className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7M4.828 7H9a2 2 0 012 2v9.172M4.828 7L2.414 4.586A2 2 0 014.828 3H9a2 2 0 012 2v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">Notifications</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">Thông báo hệ thống, cảnh báo</p>
              <Link to="/staff/notifications" className="text-blue-600 text-sm font-medium hover:underline">
                Xem chi tiết →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StaffPage
