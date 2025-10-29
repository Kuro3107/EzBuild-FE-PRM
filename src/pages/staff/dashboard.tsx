import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiService } from '../../services/api'
import '../../Homepage.css'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  depositedOrders: number
  shippingOrders: number
  paidOrders: number
  doneOrders: number
  cancelOrders: number
  totalPayments: number
  pendingPayments: number
  paid25PercentPayments: number
  paidPayments: number
  totalRevenue: number
}

function StaffDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    depositedOrders: 0,
    shippingOrders: 0,
    paidOrders: 0,
    doneOrders: 0,
    cancelOrders: 0,
    totalPayments: 0,
    pendingPayments: 0,
    paid25PercentPayments: 0,
    paidPayments: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load orders only (payment API không tồn tại)
      const ordersData = await ApiService.getOrders()
      
      const orders = ordersData as Array<Record<string, unknown>>
      
      // Calculate stats chỉ dựa trên orders
      const newStats: DashboardStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'PENDING').length,
        depositedOrders: orders.filter(o => o.status === 'DEPOSITED').length,
        shippingOrders: orders.filter(o => o.status === 'SHIPPING').length,
        paidOrders: orders.filter(o => o.status === 'PAID').length,
        doneOrders: orders.filter(o => o.status === 'DONE').length,
        cancelOrders: orders.filter(o => o.status === 'CANCEL').length,
        totalPayments: 0, // Payment API không tồn tại
        pendingPayments: 0,
        paid25PercentPayments: 0,
        paidPayments: 0,
        totalRevenue: orders
          .filter(o => o.status === 'PAID' || o.status === 'DONE')
          .reduce((sum, o) => sum + (Number(o.totalPrice || o.total_price) || 0), 0)
      }
      
      setStats(newStats)
    } catch (err) {
      setError('Không thể tải dữ liệu dashboard')
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page bg-grid bg-radial">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Tổng quan hoạt động hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Orders Stats */}
        <div className="bg-white rounded-lg border border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/staff/orders" 
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Xem chi tiết →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn đã cọc</p>
              <p className="text-2xl font-bold text-blue-600">{stats.depositedOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn đang giao</p>
              <p className="text-2xl font-bold text-purple-600">{stats.shippingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-lg border border-black/10 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-emerald-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(stats.totalRevenue)}
            </p>
          </div>
          <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/staff/orders"
          className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Quản lý đơn hàng</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Xử lý đơn hàng, cập nhật trạng thái</p>
          <div className="text-blue-600 text-sm font-medium">Xem chi tiết →</div>
        </Link>

        <Link 
          to="/staff/customers"
          className="bg-white rounded-lg border border-black/10 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Hỗ trợ khách hàng</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Xử lý khiếu nại, hỗ trợ khách hàng</p>
          <div className="text-purple-600 text-sm font-medium">Xem chi tiết →</div>
        </Link>
      </div>
    </div>
  )
}

export default StaffDashboardPage
