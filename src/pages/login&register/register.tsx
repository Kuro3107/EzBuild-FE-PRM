import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ApiService from '../../services/api'
import './index.css'

function RegisterPage() {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    address: ''
  })
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  function handleClose() {
    // Prefer going back within SPA history when possible
    const canGoBackInSpa = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0
    if (canGoBackInSpa) {
      navigate(-1)
      return
    }
    // Otherwise, go to HomePage explicitly
    navigate(location.state?.from || '/')
  }

  function handleInputChange(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const data = await ApiService.register({
        fullname: formData.fullname,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address
      })

      localStorage.setItem('authToken', data.token)
      if (data.user) {
        localStorage.setItem('authUser', JSON.stringify(data.user))
      }

      const redirectTo = location.state?.from || '/'
      navigate(redirectTo)
    } catch (error: unknown) {
      console.error('Register error:', error)
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      setErrorMessage(message)
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
          <h2 className="auth-title">Sign Up</h2>
          <p className="auth-subtitle">Save your builds and interact with the community!</p>

          <div className="auth-provider">
            <button>
              <svg width="18" height="18" viewBox="0 0 48 48" className="-ml-1"><path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.23 3.6l6.9-6.9C35.9 2.3 30.47 0 24 0 14.62 0 6.48 5.38 2.56 13.22l8.93 6.93C13.44 14.22 18.3 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24c0-1.64-.16-3.21-.46-4.72H24v9h12.65c-.55 2.98-2.22 5.51-4.73 7.2l7.2 5.59C43.83 37.38 46.5 31.2 46.5 24z"/><path fill="#FBBC05" d="M11.49 27.15A14.5 14.5 0 0 1 10.5 24c0-1.09.12-2.15.34-3.18l-8.93-6.93A23.95 23.95 0 0 0 0 24c0 3.85.92 7.49 2.56 10.78l8.93-6.93z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.78l-7.2-5.59c-2 1.36-4.56 2.17-8.7 2.17-5.7 0-10.56-4.72-12.52-11.65l-8.93 6.93C6.48 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
          </div>

          <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              <span className="mb-1 block">Full Name *</span>
              <div className="auth-input-wrap">
                <input
                  type="text"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange('fullname')}
                  placeholder="fullname"
                  className="auth-input"
                />
              </div>
            </label>

            <label className="auth-label">
              <span className="mb-1 block">Email *</span>
              <div className="auth-input-wrap">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="email"
                  className="auth-input"
                />
              </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="auth-label">
                <span className="mb-1 block">Phone *</span>
                <div className="auth-input-wrap">
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="phone"
                    className="auth-input"
                  />
                </div>
              </label>
              
              <label className="auth-label">
                <span className="mb-1 block">Date of Birth *</span>
                <div className="auth-input-wrap">
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={handleInputChange('dob')}
                    className="auth-input"
                  />
                </div>
              </label>
            </div>

            <label className="auth-label">
              <span className="mb-1 block">Address *</span>
              <div className="auth-input-wrap">
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  placeholder="address"
                  className="auth-input"
                />
              </div>
            </label>

            <label className="auth-label">
              <span className="mb-1 block">Password *</span>
              <div className="auth-input-wrap">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  placeholder="Enter your password"
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
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage


