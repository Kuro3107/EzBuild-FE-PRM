import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ApiService from '../../services/api'
import './index.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [isOtpValidated, setIsOtpValidated] = useState(false)
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

  // Function để kiểm tra email hợp lệ
  const isEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(input)
  }

  async function handleSendOTP(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      // Kiểm tra email hợp lệ
      if (!isEmail(email)) {
        setErrorMessage('Vui lòng nhập email hợp lệ')
        return
      }

      console.log('=== FORGOT PASSWORD DEBUG ===')
      console.log('Email:', email)
      
      // Gọi API để gửi OTP
      await ApiService.sendOTP(email)
      
      setSuccessMessage('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.')
      setStep('otp')
      console.log('OTP sent successfully')
      
    } catch (error: unknown) {
      console.error('Send OTP error:', error)
      let message = 'Có lỗi xảy ra'
      
      // Xử lý error object từ API
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message
        message = errorMessage
        
        // Cải thiện thông báo lỗi cho user
        if (errorMessage.includes('Email không tồn tại')) {
          message = 'Email chưa đăng ký'
        } else if (errorMessage.includes('Internal Server Error') && !errorMessage.includes('Email không tồn tại')) {
          message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        } else if (errorMessage.includes('EntityManager') || errorMessage.includes('transaction')) {
          message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      
      setErrorMessage(message)
      
      console.log('Error details:', {
        email,
        isEmail: isEmail(email),
        errorMessage: message,
        originalError: error
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCheckOTP() {
    if (isSubmitting) return
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      // Kiểm tra OTP có đủ 6 số không
      if (otp.length !== 6) {
        setErrorMessage('Mã OTP phải có 6 số')
        return
      }

      // Kiểm tra OTP có phải là số không
      if (!/^\d{6}$/.test(otp)) {
        setErrorMessage('Mã OTP phải là 6 chữ số')
        return
      }

      // Gọi API để validate OTP thực sự với backend
      await ApiService.validateOTP(email, otp)
      
      setSuccessMessage('OTP chính xác! Vui lòng nhập mật khẩu mới.')
      setIsOtpValidated(true)
      setStep('password')
      console.log('OTP validation successful')
      
    } catch (error: unknown) {
      console.error('Check OTP error:', error)
      let message = 'Có lỗi xảy ra'
      
      // Xử lý error object từ API
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message
        message = errorMessage
        
        if (errorMessage.includes('OTP không hợp lệ') || errorMessage.includes('OTP không chính xác') || errorMessage.includes('Invalid OTP')) {
          message = 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'
        } else if (errorMessage.includes('OTP đã hết hạn') || errorMessage.includes('expired')) {
          message = 'Mã OTP đã hết hạn. Vui lòng gửi lại OTP.'
        } else if (errorMessage.includes('Email không tồn tại')) {
          message = 'Email chưa đăng ký'
        } else if (errorMessage.includes('Transaction silently rolled back') || errorMessage.includes('rollback-only')) {
          // Lỗi transaction rollback thường xảy ra khi OTP không hợp lệ
          message = 'Mã OTP không chính xác. Vui lòng kiểm tra lại.'
        } else if (errorMessage.includes('Internal Server Error') && !errorMessage.includes('Email không tồn tại') && !errorMessage.includes('OTP') && !errorMessage.includes('Transaction')) {
          message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        } else if (errorMessage.includes('EntityManager') || errorMessage.includes('transaction')) {
          message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword() {
    if (isSubmitting) return
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      // Kiểm tra OTP đã được validate chưa
      if (!isOtpValidated) {
        setErrorMessage('Vui lòng kiểm tra OTP trước khi đặt lại mật khẩu')
        return
      }

      // Kiểm tra mật khẩu mới
      if (newPassword.length === 0) {
        setErrorMessage('Vui lòng nhập mật khẩu mới')
        return
      }

      // Gọi API để reset password (OTP đã được validate ở bước trước)
      await ApiService.resetPassword(email, otp, newPassword)
      
      setSuccessMessage('Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...')
      
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      let message = 'Có lỗi xảy ra'
      
      // Xử lý error object từ API
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message
        message = errorMessage
        
        // Nếu OTP bị lỗi ở bước reset (có thể đã hết hạn), quay về bước email
        if (errorMessage.includes('OTP không hợp lệ') || errorMessage.includes('OTP không chính xác') || errorMessage.includes('Invalid OTP') || errorMessage.includes('OTP đã hết hạn') || errorMessage.includes('expired')) {
          message = 'Mã OTP đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại OTP.'
          // Reset về bước email
          setStep('email')
          setIsOtpValidated(false)
        } else if (errorMessage.includes('Transaction silently rolled back') || errorMessage.includes('rollback-only')) {
          // Lỗi transaction rollback thường xảy ra khi OTP không hợp lệ
          message = 'Mã OTP đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại OTP.'
          // Reset về bước email
          setStep('email')
          setIsOtpValidated(false)
        } else if (errorMessage.includes('Email không tồn tại')) {
          message = 'Email chưa đăng ký'
        } else if (errorMessage.includes('Internal Server Error') && !errorMessage.includes('Email không tồn tại') && !errorMessage.includes('Transaction')) {
          message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        } else if (errorMessage.includes('EntityManager') || errorMessage.includes('transaction')) {
          message = 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      
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
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            {step === 'email' && 'Nhập email của bạn để nhận mã OTP reset mật khẩu'}
            {step === 'otp' && 'Nhập mã OTP đã được gửi đến email của bạn'}
            {step === 'password' && 'Nhập mật khẩu mới của bạn'}
          </p>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="auth-form">
              <label className="auth-label">
                <span className="mb-1 block">
                  Email
                  {email && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({isEmail(email) ? 'Email hợp lệ' : 'Email không hợp lệ'})
                    </span>
                  )}
                </span>
                
                <div className="auth-input-wrap">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="auth-input"
                  />
                </div>
              </label>

              {errorMessage ? (
                <div className="auth-error" role="alert">{errorMessage}</div>
              ) : null}

              {successMessage ? (
                <div className="auth-success" role="alert">{successMessage}</div>
              ) : null}

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === 'otp' && (
            <div className="auth-form">
              <label className="auth-label">
                <span className="mb-1 block">Mã OTP</span>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã OTP 6 số"
                    className="auth-input"
                    maxLength={6}
                  />
                </div>
              </label>

              {errorMessage ? (
                <div className="auth-error" role="alert">{errorMessage}</div>
              ) : null}

              {successMessage ? (
                <div className="auth-success" role="alert">{successMessage}</div>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCheckOTP}
                  className="auth-submit flex-1"
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? 'Đang kiểm tra...' : 'Check'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setIsOtpValidated(false)
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className="auth-submit flex-1 bg-gray-600 hover:bg-gray-700"
                >
                  Gửi lại OTP
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password Input */}
          {step === 'password' && (
            <div className="auth-form">
              <label className="auth-label">
                <span className="mb-1 block">Mật khẩu mới</span>
                <div className="auth-input-wrap">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
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

              {successMessage ? (
                <div className="auth-success" role="alert">{successMessage}</div>
              ) : null}

              <button
                type="button"
                onClick={handleResetPassword}
                className="auth-submit"
                disabled={isSubmitting || newPassword.length === 0}
              >
                {isSubmitting ? 'Đang lưu...' : 'Save'}
              </button>
            </div>
          )}

          <div className="auth-switch">
            Remember your password?{' '}
            <Link to="/login" className="auth-link">Log In</Link>
          </div>
          
          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
