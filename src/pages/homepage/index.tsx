import '../../Homepage.css'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiService } from '../../services/api'
import LandingHero from '../../components/LandingHero'
import LandingFeatures from '../../components/LandingFeatures'
import LandingStats from '../../components/LandingStats'
import LandingFooter from '../../components/LandingFooter'

function HomePage() {
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Record<string, unknown> | null>(null)
  const productsBtnRef = useRef<HTMLAnchorElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    // Kiểm tra và xóa dữ liệu cũ trước
    ApiService.checkAndClearOldData()
    
    const user = ApiService.getCurrentUser()
    console.log('Current user:', user) // Debug
    
    // Chỉ set user nếu thực sự có user đăng nhập
    if (user) {
      setCurrentUser(user)
    } else {
      setCurrentUser(null)
    }
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

  // Xử lý logout
  const handleLogout = () => {
    // Hiển thị confirm dialog
    const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?')
    
    if (confirmLogout) {
      ApiService.clearAuthData()
      setCurrentUser(null)
      setIsUserMenuOpen(false)
      
      // Redirect về trang login
      navigate('/login')
      
      // Hiển thị thông báo thành công
      alert('Đăng xuất thành công!')
    }
  }

  return (
    <div className="page" style={{ minHeight: '100vh', color: 'white', overflowX: 'hidden' }}>
      {/* Header with user avatar or login button */}
      {currentUser ? (
        <header style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0 0 0 20px',
          padding: '12px 20px',
          width: 'auto'
        }}>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-black/10 rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center !text-white text-sm font-semibold shadow-md">
                {(currentUser.email as string || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium !text-white max-w-32 truncate hidden sm:block">
                {currentUser.fullname as string || currentUser.email as string || 'User'}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
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
                className="absolute top-full right-0 mt-3 w-72 homepage-user-menu py-4 z-50"
              >
                {/* User Info Section */}
                <div className="px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center !text-white text-lg font-bold shadow-lg">
                      {(currentUser.email as string || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold !text-white text-base truncate">
                        {currentUser.fullname as string || currentUser.email as string || 'User'}
                      </div>
                      <div className="text-sm !text-gray-300 truncate">
                        {currentUser.email as string || 'user@example.com'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link 
                    to="/customer"
                    className="w-full px-6 py-3 text-left text-blue-400 hover:bg-gray-800 transition-colors text-sm flex items-center gap-4 group"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                  </Link>
                  
                  <button className="w-full px-6 py-3 text-left text-gray-300 hover:bg-gray-800 transition-colors text-sm flex items-center gap-4 group">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium">Favorites</span>
                  </button>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full px-6 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors text-sm flex items-center gap-4 group"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      ) : (
        <header style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0 0 0 20px',
          padding: '12px 20px',
          width: 'auto'
        }}>
          <Link 
            to="/login"
            className="flex items-center gap-2 homepage-login-btn"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium text-gray-800">Sign In</span>
          </Link>
        </header>
      )}

      <div>
        {/* Main Content */}
        <main>
          {/* Landing Hero Section */}
          <LandingHero currentUser={currentUser} />

          {/* Landing Features Section */}
          <LandingFeatures />

          {/* Landing Stats Section */}
          <LandingStats />

          <div className="homepage-quick-start">
            <div className="homepage-section-title">Quick Start</div>
          
            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {[
                { 
                  title: 'All-AMD Red Build', 
                  description: 'High-performance AMD build with red theme',
                  price: '$1,299',
                  image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=300&fit=crop'
                },
                { 
                  title: 'Baller White 4K RGB', 
                  description: 'Premium white build with RGB lighting',
                  price: '$2,199',
                  image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&h=300&fit=crop'
                },
                { 
                  title: 'Modern 1440p Gaming', 
                  description: 'Perfect for 1440p gaming experience',
                  price: '$1,599',
                  image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop'
                },
              ].map((item, index) => (
                 <article key={item.title} className={`qs-card group homepage-card homepage-float`} style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', maxWidth: '100%', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease', position: 'relative', animationDelay: `${index * 0.5}s` }}>
                   <div className="qs-media relative overflow-hidden" style={{ height: '200px' }}>
                     <img 
                       src={item.image} 
                       alt={item.title}
                       className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                     <div className="absolute bottom-3 left-3 text-white font-semibold text-lg">
                       {item.price}
                     </div>
                   </div>
                   <div className="qs-body" style={{ padding: '16px' }}>
                     <div className="qs-title" style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{item.title}</div>
                     <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{item.description}</p>
                     <div className="homepage-cta" style={{ fontSize: '14px' }}>Open Build</div>
                  </div>
                </article>
              ))}
            </div>

            {/* Mobile: Simple Grid Layout (replaced Carousel) */}
            <div className="md:hidden grid grid-cols-1 gap-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {[
                { 
                  title: 'All-AMD Red Build', 
                  description: 'High-performance AMD build with red theme',
                  price: '$1,299',
                  image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=300&fit=crop'
                },
                { 
                  title: 'Baller White 4K RGB', 
                  description: 'Premium white build with RGB lighting',
                  price: '$2,199',
                  image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&h=300&fit=crop'
                },
                { 
                  title: 'Modern 1440p Gaming', 
                  description: 'Perfect for 1440p gaming experience',
                  price: '$1,599',
                  image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=300&fit=crop'
                },
               ].map((item, index) => (
                 <article key={index} className={`qs-card group homepage-card homepage-float`} style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', maxWidth: '100%', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease', position: 'relative', animationDelay: `${index * 0.5}s` }}>
                   <div className="qs-media relative overflow-hidden" style={{ height: '200px' }}>
                     <img 
                       src={item.image} 
                       alt={item.title}
                       className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                     <div className="absolute bottom-3 left-3 text-white font-bold text-lg">
                       {item.price}
                     </div>
                   </div>
                   <div className="qs-body" style={{ padding: '16px' }}>
                     <div className="qs-title text-lg font-bold mb-2" style={{ color: 'white' }}>{item.title}</div>
                     <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.description}</p>
                     <div className="homepage-cta" style={{ fontSize: '14px' }}>
                       Open Build
                     </div>
                   </div>
                 </article>
               ))}
            </div>
          </div>
        </main>
      </div>
      
      {/* Landing Footer - Outside Layout for Full Width */}
      <LandingFooter />
    </div>
  )
}

export default HomePage
