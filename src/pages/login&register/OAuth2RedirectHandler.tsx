import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ApiService from "../../services/api"

function OAuth2RedirectHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Chỉ chạy một lần
      if (hasProcessed) {
        console.log('OAuth2RedirectHandler already processed, skipping...')
        return
      }
      
      try {
        console.log('=== OAUTH2 REDIRECT HANDLER ===')
        console.log('Current URL:', window.location.href)
        console.log('Search params:', window.location.search)
        console.log('Current origin:', window.location.origin)
        console.log('Expected redirect URL from backend: http://localhost:5173/oauth2/redirect')
        
        const params = new URLSearchParams(window.location.search)
        const token = params.get("token") || params.get("access_token") || params.get("accessToken")
        const error = params.get("error")
        const code = params.get("code") // Authorization code từ OAuth2
        const userParam = params.get("user") // User info từ backend (nếu có)
        
        // Kiểm tra xem có phải là OAuth2 redirect thật không
        if (!token && !error && !code) {
          console.log('Not an OAuth2 redirect, skipping...')
          setHasProcessed(true)
          return
        }
        
        console.log('Token from URL:', token)
        console.log('Error from URL:', error)
        console.log('Authorization code from URL:', code)
        console.log('User param from URL:', userParam)

        if (error) {
          console.error('OAuth error:', error)
          setError(`Lỗi đăng nhập Google: ${error}`)
          setTimeout(() => navigate("/login"), 3000)
          return
        }

        let finalToken = token

        // Nếu có authorization code, cần exchange để lấy token
        if (code && !token) {
          console.log('Received authorization code, exchanging for token...')
          try {
            // Gọi API để exchange authorization code thành token
            const response = await fetch(`http://localhost:8080/oauth2/token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: 'your-google-client-id', // Cần cấu hình từ backend
                redirect_uri: `${window.location.origin}/oauth2/redirect`
              })
            })

            if (response.ok) {
              const tokenData = await response.json()
              finalToken = tokenData.access_token || tokenData.token
              if (!finalToken) {
                throw new Error('No access token in response')
              }
              console.log('Token obtained from authorization code exchange')
            } else {
              throw new Error(`Token exchange failed: ${response.status}`)
            }
          } catch (exchangeError) {
            console.error('Token exchange error:', exchangeError)
            setError('Không thể lấy token từ Google. Vui lòng thử lại.')
            setTimeout(() => navigate("/login"), 3000)
            return
          }
        } else if (!token) {
          console.error('No token or authorization code received from OAuth callback')
          setError('Không nhận được token từ Google. Vui lòng thử lại.')
          setTimeout(() => navigate("/login"), 3000)
          return
        }

        // Lưu token vào localStorage
        localStorage.setItem("authToken", finalToken!)
        console.log('Token saved to localStorage')

        // Kiểm tra token có hợp lệ không
        console.log('Validating token:', finalToken)
        if (!ApiService.isTokenValid(finalToken!)) {
          console.error('Invalid token received')
          setError('Token không hợp lệ. Vui lòng thử lại.')
          localStorage.removeItem("authToken")
          setTimeout(() => navigate("/login"), 3000)
          return
        }

        // Kiểm tra xem có user info từ URL parameter không
        let userProfile = null
        if (userParam) {
          try {
            console.log('Found user info in URL parameter, parsing...')
            const decodedUser = JSON.parse(decodeURIComponent(userParam))
            userProfile = decodedUser
            localStorage.setItem('authUser', JSON.stringify(userProfile))
            console.log('User info from URL parameter saved:', userProfile)
          } catch (error) {
            console.error('Failed to parse user info from URL parameter:', error)
          }
        }
        
        // Nếu không có user info từ URL, thử lấy từ database
        if (!userProfile) {
          // Lấy email từ JWT token
          const tokenUser = ApiService.getCurrentUser()
          const email = tokenUser?.email as string
          
          console.log('Email from JWT token:', email)
          
          if (email) {
            try {
              console.log('Trying to get user info from multiple methods...')
              console.log('Email to fetch:', email)
              
            // Thử 1: Gọi login API với email để lấy user info
            console.log('Attempting getUserInfoByEmail...')
            userProfile = await ApiService.getUserInfoByEmail(email)
            if (userProfile) {
              console.log('Got user info from login API:', userProfile)
            } else {
              // Thử 2: Gọi các endpoint khác
              console.log('Attempting tryGetUserInfo...')
              userProfile = await ApiService.tryGetUserInfo(email)
              console.log('API response for tryGetUserInfo:', userProfile)
            }
              
              if (userProfile) {
                localStorage.setItem('authUser', JSON.stringify(userProfile))
                console.log('Full user profile fetched from database and saved:', userProfile)
              } else {
                console.log('No user profile returned from any method')
              }
            } catch (error) {
              console.error('Failed to fetch user profile from database:', error)
              console.error('Error details:', error)
            }
          } else {
            console.log('No email found, cannot fetch user profile from database')
          }
        }
        
        // Nếu không lấy được từ database, thử từ /api/user/home
        if (!userProfile) {
          try {
            console.log('Fallback: Fetching user profile from /api/user/home...')
            userProfile = await ApiService.getCurrentUserProfile()
            if (userProfile) {
              localStorage.setItem('authUser', JSON.stringify(userProfile))
              console.log('User profile from /api/user/home saved:', userProfile)
            } else {
              console.log('No user profile from /api/user/home')
            }
          } catch (error) {
            console.error('Failed to fetch user profile from /api/user/home:', error)
            console.error('Error details:', error)
          }
        }
        
        // Cuối cùng, fallback về token
        if (!userProfile) {
          const tokenUser = ApiService.getCurrentUser()
          if (tokenUser) {
            localStorage.setItem('authUser', JSON.stringify(tokenUser))
            console.log('Final fallback: User info from token saved:', tokenUser)
          }
        }

        // Redirect dựa trên role sau khi đăng nhập (giống như login thông thường)
        const userRole = ApiService.getUserRole()
        let redirectTo = location.state?.from || '/'

        console.log('=== REDIRECT LOGIC ===')
        console.log('User role:', userRole)
        console.log('Is Admin:', ApiService.isAdmin())
        console.log('Is Staff:', ApiService.isStaff())
        console.log('Location state from:', location.state?.from)

        // Nếu đang cố truy cập trang admin/staff nhưng role không phù hợp
        if (location.state?.from?.includes('/admin') && !ApiService.isAdmin()) {
          redirectTo = '/'
          console.log('Admin access denied, redirecting to home')
        } else if (location.state?.from?.includes('/staff') && !ApiService.isStaff()) {
          redirectTo = '/'
          console.log('Staff access denied, redirecting to home')
        }

        // Nếu không có trang cụ thể, redirect theo role
        if (!location.state?.from) {
          if (userRole === 'Admin') {
            redirectTo = '/admin'
            console.log('Admin user, redirecting to admin page')
          } else if (userRole === 'Staff') {
            redirectTo = '/staff'
            console.log('Staff user, redirecting to staff page')
    } else {
            redirectTo = '/'
            console.log('Regular user, redirecting to home')
          }
        }

        console.log('Final redirect destination:', redirectTo)
        console.log('About to navigate to:', redirectTo)
        setHasProcessed(true)
        navigate(redirectTo)
        console.log('Navigation completed')

      } catch (error) {
        console.error('=== OAUTH CALLBACK ERROR ===')
        console.error('Error details:', error)
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        setError('Có lỗi xảy ra khi xử lý đăng nhập Google. Vui lòng thử lại.')
        setTimeout(() => {
          console.log('Redirecting to login after 3 seconds due to error')
          navigate("/login")
        }, 3000)
      } finally {
        setIsProcessing(false)
      }
    }

    handleOAuthCallback()
  }, [navigate, location.pathname, location.search, location.state?.from, hasProcessed])

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
        <div style={{ color: 'gray' }}>
          Đang chuyển hướng về trang đăng nhập...
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '20px' }}>
        Đang xử lý đăng nhập Google...
      </div>
      {isProcessing && (
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default OAuth2RedirectHandler
