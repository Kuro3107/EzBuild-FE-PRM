import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ApiService } from '../services/api'

function AppShell() {
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null)
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false)
  const productsBtnRef = useRef<HTMLAnchorElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const menuItems = [
    { key: 'home', label: 'PC Builder', link: '/pcbuilder' },
    { key: 'products', label: 'Products', children: [
      { key: 'case', label: 'Case', link: '/products/case' },
      { key: 'cpu', label: 'CPU', link: '/products/cpu' },
      { key: 'mainboard', label: 'Mainboard', link: '/products/mainboard' },
      { key: 'gpu', label: 'GPU', link: '/products/gpu' },
      { key: 'ram', label: 'RAM', link: '/products/ram' },
      { key: 'storage', label: 'Storage', link: '/products/storage' },
      { key: 'psu', label: 'Power Supply', link: '/products/psu' },
      { key: 'cooling', label: 'Cooling', link: '/products/cooling' },
      { key: 'headset', label: 'Headset/Speaker', link: '/products/headset-speaker' },
      { key: 'monitor', label: 'Monitor', link: '/products/monitor' },
      { key: 'mouse', label: 'Mouse', link: '/products/mouse' },
      { key: 'keyboard', label: 'Keyboard', link: '/products/keyboard' },
    ]},
    { key: 'sales', label: 'Sales', link: '/sales' },
    { key: 'compare', label: 'Compare', link: '/compare' },
    { key: 'gallery', label: 'PC Part Gallery' },
    { key: 'builds', label: 'Completed Builds' },
    { key: 'updates', label: 'Updates' },
    { key: 'setup', label: 'Setup Builder' },
    ...(ApiService.isStaff() && !ApiService.isAdmin() ? [{ key: 'staff', label: 'Staff Panel', link: '/staff' }] : []),
    ...(ApiService.isAdmin() ? [{ key: 'admin', label: 'Admin Panel', link: '/admin' }] : []),
  ]

  useEffect(() => {
    ApiService.checkAndClearOldData()
    const user = ApiService.getCurrentUser()
    if (user) setCurrentUser(user)
    else setCurrentUser(null)
  }, [])

  useEffect(() => {
    if (!isProductsOpen) return
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        productsBtnRef.current &&
        !productsBtnRef.current.contains(target)
      ) {
        setIsProductsOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProductsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isProductsOpen])

  useEffect(() => {
    if (!isUserMenuOpen) return
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
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
    const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?')
    if (confirmLogout) {
      ApiService.clearAuthData()
      setCurrentUser(null)
      setIsUserMenuOpen(false)
      navigate('/login')
      alert('Đăng xuất thành công!')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)', color: 'white' }}>
      {currentUser ? (
        <header style={{ position: 'fixed', top: 0, right: 0, zIndex: 1000, background: 'transparent', padding: '8px 16px', border: 'none', width: 'auto' }}>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-black/10 rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center !text-white text-sm font-semibold shadow-md">
                {(currentUser.email as string || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium !text-white max-w-32 truncate hidden sm:block">
                {currentUser.fullname as string || (currentUser.email as string) || 'User'}
              </span>
              <svg className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isUserMenuOpen && (
              <div ref={userMenuRef} className="absolute top-full right-0 mt-3 w-72 bg-gray-900 rounded-2xl shadow-2xl py-4 z-50 border border-gray-700">
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center !text-white text-lg font-bold shadow-lg">
                      {(currentUser.email as string || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold !text-white text-base truncate">{currentUser.fullname as string || (currentUser.email as string) || 'User'}</div>
                      <div className="text-sm !text-gray-300 truncate">{(currentUser.email as string) || 'user@example.com'}</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link to="/customer" className="w-full px-6 py-3 text-left text-blue-400 hover:bg-gray-800 transition-colors text-sm flex items-center gap-4 group" onClick={() => setIsUserMenuOpen(false)}>
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="font-medium">Profile</span>
                  </Link>
                  <button onClick={handleLogout} className="w-full px-6 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors text-sm flex items-center gap-4 group">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      ) : (
        <header style={{ position: 'fixed', top: 0, right: 0, zIndex: 1000, background: 'transparent', padding: '8px 16px', border: 'none', width: 'auto' }}>
          <Link to="/login" className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-black/10 rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            <span className="text-sm font-medium text-gray-800">Sign In</span>
          </Link>
        </header>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: '256px', background: '#000000', borderRight: '1px solid #333333', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, display: window.innerWidth >= 768 ? 'block' : 'none' }}>
          <Link to="/" style={{ padding: '16px', borderBottom: '1px solid #333333', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#1e3a8a' }} />
            <span style={{ fontWeight: '600', fontSize: '16px', color: 'white' }}>EzBuild</span>
          </Link>
          <nav style={{ height: 'calc(100% - 80px)', paddingTop: '8px', background: '#000000', overflowY: 'auto' }}>
            <div style={{ padding: '0 16px' }}>
              {menuItems.map((item) => (
                <div key={item.key}>
                  {item.link ? (
                    <Link to={item.link} style={{ display: 'block', padding: '12px 16px', color: 'white', textDecoration: 'none', borderRadius: '6px', marginBottom: '4px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {item.label}
                    </Link>
                  ) : item.children ? (
                    <div style={{ padding: '12px 16px', color: 'white', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} 
                         onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')} 
                         onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                         onClick={() => setIsProductsMenuOpen(!isProductsMenuOpen)}>
                      <span>{item.label}</span>
                      <svg 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          transition: 'transform 0.2s',
                          transform: isProductsMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                        }} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', color: 'white', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      {item.label}
                    </div>
                  )}
                  {item.children && isProductsMenuOpen && (
                    <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                      {item.children.map((child) => (
                        <Link key={child.key} to={child.link} style={{ display: 'block', padding: '8px 16px', color: '#cccccc', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', marginBottom: '2px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', fontSize: '12px', color: '#8c8c8c' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="#" style={{ color: '#1e3a8a' }}>Contact</a>
              <a href="#" style={{ color: '#1e3a8a' }}>FAQ</a>
            </div>
          </div>
        </aside>

        <main style={{ marginLeft: window.innerWidth >= 768 ? '256px' : '0', background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)', flex: 1, minHeight: '100vh', overflowX: 'hidden', width: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell