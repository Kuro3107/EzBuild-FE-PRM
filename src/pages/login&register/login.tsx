import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ApiService from '../../services/api'
import './index.css'

function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  function handleClose() {
    const canGoBackInSpa = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0
    if (canGoBackInSpa) {
      navigate(-1)
      return
    }
    navigate(location.state?.from || '/')
  }

  // Function để kiểm tra xem input có phải email hay phone
  const isEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(input)
  }

  const isPhone = (input: string): boolean => {
    // Regex cho số điện thoại Việt Nam (có thể có +84, 0, hoặc không có)
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/
    return phoneRegex.test(input.replace(/\s/g, ''))
  }

  const isUsername = (input: string): boolean => {
    // Username: không chứa @, không chứa số, ít nhất 3 ký tự
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,}$/
    return !isEmail(input) && !isPhone(input) && usernameRegex.test(input)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return    
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      // Debug: Log thông tin đăng nhập
      console.log('=== LOGIN DEBUG ===')
      console.log('Identifier:', identifier)
      console.log('Is Email:', isEmail(identifier))
      console.log('Is Phone:', isPhone(identifier))
      console.log('Is Username:', isUsername(identifier))
      console.log('Password length:', password.length)
      
      const loginData = {
        identifier: identifier.trim(), // email, phone, or username
        password,
      }
      
      console.log('Sending login data:', loginData)

      const data = await ApiService.login(loginData)
      
      console.log('Login response:', data)

      localStorage.setItem('authToken', data.token) 
      if (data.user) {
        localStorage.setItem('authUser', JSON.stringify(data.user))
      }

      // Redirect dựa trên role sau khi đăng nhập
      const userRole = ApiService.getUserRole()
      let redirectTo = location.state?.from || '/'

      // Nếu đang cố truy cập trang admin/staff nhưng role không phù hợp
      if (location.state?.from?.includes('/admin') && !ApiService.isAdmin()) {
        redirectTo = '/'
      } else if (location.state?.from?.includes('/staff') && !ApiService.isStaff()) {
        redirectTo = '/'
      }

      // Nếu không có trang cụ thể, redirect theo role
      if (!location.state?.from) {
        if (userRole === 'Admin') {
          redirectTo = '/admin'
        } else if (userRole === 'Staff') {
          redirectTo = '/staff'
        } else {
          redirectTo = '/'
        }
      }

      console.log('Redirecting to:', redirectTo)
      navigate(redirectTo)
    } catch (error: unknown) {
      console.error('Login error:', error)
      let message = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      
      // Cải thiện thông báo lỗi cho user
      if (message.includes('User not found')) {
        if (isEmail(identifier)) {
          message = 'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.'
        } else if (isPhone(identifier)) {
          message = 'Số điện thoại không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.'
        } else if (isUsername(identifier)) {
          message = 'Username không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.'
        } else {
          message = 'Email, số điện thoại hoặc username không tồn tại trong hệ thống. Vui lòng kiểm tra lại.'
        }
      } else if (message.includes('Invalid password')) {
        message = 'Mật khẩu không đúng. Vui lòng kiểm tra lại.'
      } else if (message.includes('Internal Server Error')) {
        message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
      }
      
      setErrorMessage(message)
      
      // Thêm thông tin debug cho lỗi
      console.log('Error details:', {
        identifier,
        isEmail: isEmail(identifier),
        isPhone: isPhone(identifier),
        isUsername: isUsername(identifier),
        errorMessage: message,
        originalError: error
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <button
          aria-label="Close"
          className="auth-close"
          onClick={handleClose}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="auth-body">
          <h2 className="auth-title">Log In</h2>
          <p className="auth-subtitle">Welcome back! Sign in to continue.</p>

          <div className="auth-provider">
          <button
  type="button"
  onClick={() => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google"
  }}
>
<svg width="18" height="18" viewBox="0 0 48 48" className="-ml-1"><path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.23 3.6l6.9-6.9C35.9 2.3 30.47 0 24 0 14.62 0 6.48 5.38 2.56 13.22l8.93 6.93C13.44 14.22 18.3 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24c0-1.64-.16-3.21-.46-4.72H24v9h12.65c-.55 2.98-2.22 5.51-4.73 7.2l7.2 5.59C43.83 37.38 46.5 31.2 46.5 24z"/><path fill="#FBBC05" d="M11.49 27.15A14.5 14.5 0 0 1 10.5 24c0-1.09.12-2.15.34-3.18l-8.93-6.93A23.95 23.95 0 0 0 0 24c0 3.85.92 7.49 2.56 10.78l8.93-6.93z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.78l-7.2-5.59c-2 1.36-4.56 2.17-8.7 2.17-5.7 0-10.56-4.72-12.52-11.65l-8.93 6.93C6.48 42.62 14.62 48 24 48z"/></svg> Continue with Google
</button>
          </div>

          <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              <span className="mb-1 block">
                Email, Số điện thoại hoặc Username
                {identifier && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({isEmail(identifier) ? 'Email' : 
                      isPhone(identifier) ? 'Số điện thoại' : 
                      isUsername(identifier) ? 'Username' : 
                      'Không hợp lệ'})
                  </span>
                )}
              </span>
              
              <div className="auth-input-wrap">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email, số điện thoại hoặc username"
                  className="auth-input"
                />
              </div>
            </label>
            <label className="auth-label">
              <span className="mb-1 block">Password</span>
              <div className="auth-input-wrap">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                />
                <button
                  type="button"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={isPasswordVisible}
                  className="auth-eye"
                  onClick={() => setIsPasswordVisible((v) => !v)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </label>

            {errorMessage ? (
              <div className="auth-error" role="alert">{errorMessage}</div>
            ) : null}

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Sign Up</Link>
          </div>
          
          <div className="auth-switch">
            Forget Password?{' '}
            <Link to="/forgot-password" className="auth-link">Click to reset Password</Link>
          </div>
          
   
        </div>
      </div>
    </div>
  )
}

export default LoginPage
