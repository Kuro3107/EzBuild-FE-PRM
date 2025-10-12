import { Navigate, useLocation } from 'react-router-dom'
import { ApiService } from '../services/api'
import AccessDeniedPage from '../pages/access-denied/index'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'Admin' | 'Staff' | 'User' | 'Customer'
  fallbackPath?: string
}

function ProtectedRoute({ children, requiredRole, fallbackPath = '/login' }: ProtectedRouteProps) {
  const location = useLocation()
  const currentUser = ApiService.getCurrentUser()

  console.log('=== PROTECTED ROUTE DEBUG ===')
  console.log('Current location:', location.pathname)
  console.log('Required role:', requiredRole)
  console.log('Current user:', currentUser)
  console.log('Auth token exists:', !!localStorage.getItem('authToken'))
  console.log('Auth user exists:', !!localStorage.getItem('authUser'))

  // Kiểm tra đăng nhập
  if (!currentUser) {
    console.log('No current user found, redirecting to login')
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Kiểm tra role nếu có yêu cầu
  if (requiredRole && !ApiService.hasRole(requiredRole)) {
    console.log('User does not have required role:', requiredRole)
    return <AccessDeniedPage />
  }

  console.log('Access granted')
  return <>{children}</>
}

export default ProtectedRoute
