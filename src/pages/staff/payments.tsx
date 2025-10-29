import { useState } from 'react'
import '../../Homepage.css'

function StaffPaymentsPage() {
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  // Payment API không tồn tại trong backend
  // Trang này đã bị vô hiệu hóa



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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page bg-grid bg-radial">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý thanh toán</h1>
        <p className="text-red-600">⚠️ Payment API hiện không có sẵn trong backend</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Trang này đã bị vô hiệu hóa</h3>
        <p className="text-yellow-800">
          Backend hiện không có Payment API endpoint. Vui lòng liên hệ với backend team để thêm Payment API hoặc 
          sử dụng trang <strong>Orders Management</strong> để quản lý thanh toán thông qua đơn hàng.
        </p>
      </div>
    </div>
  )
}

export default StaffPaymentsPage
