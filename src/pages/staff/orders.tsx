import { useEffect, useState } from 'react'
import { ApiService } from '../../services/api'
import '../../Homepage.css'

interface Order {
  id: number
  status: string
  totalPrice: number
  total_price?: number
  paymentMethod: string
  payment_method?: string
  address: string
  phone: string | number
  createdAt: string
  created_at?: string
  build?: { id: number; name: string }
  user?: { id: number; email: string; fullname: string }
}


function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load orders
      const ordersData = await ApiService.getOrders()
      setOrders(ordersData as unknown as Order[])
    } catch (err) {
      setError('Không thể tải dữ liệu')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await ApiService.updateOrderStatus(orderId, newStatus)
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
      ))
      
      alert(`Đã cập nhật trạng thái đơn hàng thành: ${newStatus}`)
      
      // Refresh data từ server
      loadData()
    } catch (err) {
      console.error('Error updating order status:', err)
      alert(`Có lỗi khi cập nhật trạng thái đơn hàng. \n\nLỗi: ${err instanceof Error ? err.message : 'Unknown error'}\n\nVui lòng thử lại hoặc báo BE team.`)
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'DEPOSITED': return 'bg-blue-100 text-blue-800'
      case 'SHIPPING': return 'bg-purple-100 text-purple-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'DONE': return 'bg-emerald-100 text-emerald-800'
      case 'CANCEL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = orders.filter(order => 
    filterStatus === 'ALL' || order.status === filterStatus
  )

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
              onClick={loadData}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đơn hàng</h1>
        <p className="text-gray-600">Xử lý đơn hàng và thanh toán</p>
      </div>

      {/* Filter và Refresh */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'ALL' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tất cả ({orders.length})
          </button>
          {['PENDING', 'DEPOSITED', 'SHIPPING', 'PAID', 'DONE', 'CANCEL'].map(status => {
            const count = orders.filter(o => o.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status} ({count})
              </button>
            )
          })}
          </div>
          
          <button
            onClick={loadData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{order.user?.fullname || 'N/A'}</div>
                        <div className="text-gray-500">{order.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(order.totalPrice || order.total_price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt || order.created_at || '').toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Chi tiết
                        </button>
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'DEPOSITED')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Đã cọc
                          </button>
                        )}
                        {order.status === 'DEPOSITED' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'SHIPPING')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === 'SHIPPING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'PAID')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Đã thanh toán
                          </button>
                        )}
                        {order.status !== 'DONE' && order.status !== 'CANCEL' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'CANCEL')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hủy đơn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chi tiết đơn hàng #{selectedOrder.id}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedOrder.user?.fullname || 'N/A'} ({selectedOrder.user?.email || 'N/A'})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tổng tiền</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(selectedOrder.totalPrice || selectedOrder.total_price || 0)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.address}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.paymentMethod || selectedOrder.payment_method}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffOrdersPage
