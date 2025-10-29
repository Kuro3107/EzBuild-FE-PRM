import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiService } from '../../services/api'

function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [payment, setPayment] = useState<{
    id: string | number;
    order: { id: number };
    amount: number;
    method: string;
    status: string;
    transactionId?: string | null;
    paidAt?: string | null;
    isMock?: boolean;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const depositAmount = 50000 // Hardcode 50k cho đặt cọc

  useEffect(() => {
    console.log('=== PAYMENT PAGE useEffect ===')
    console.log('orderId:', orderId)
    console.log('amount:', amount)
    
    if (!orderId || !amount) {
      alert('Thiếu thông tin đơn hàng')
      navigate('/checkout')
      return
    }
    
    // Kiểm tra xem đã có payment cho order này chưa
    const existingPayment = localStorage.getItem(`payment_${orderId}`)
    if (existingPayment) {
      console.log('Using existing payment:', existingPayment)
      setPayment(JSON.parse(existingPayment))
      setIsLoading(false)
      return
    }

    // Kiểm tra nếu đang có tiến trình tạo payment khác
    const paymentCreatingKey = `payment_creating_${orderId}`
    if (sessionStorage.getItem(paymentCreatingKey)) {
      console.log('Payment is being created, please wait...')
      setIsLoading(false)
      return
    }

    // Đánh dấu đang tạo payment
    sessionStorage.setItem(paymentCreatingKey, 'true')

    let isMounted = true // Flag để tránh race condition
    
    const initializePayment = async () => {
      console.log('Creating new payment for orderId:', orderId)

      try {
        setIsLoading(true)
        
        // Tạo payment qua API - CHỈ 1 LẦN DUY NHẤT
        const newPayment = await ApiService.createPayment({
          orderId: parseInt(orderId),
          amount: depositAmount, // Dùng 50k cố định
          method: 'QR_CODE',
          status: 'PENDING'
        })

        if (isMounted) {
          setPayment(newPayment as typeof payment)
          // Lưu payment vào localStorage để tránh tạo duplicate
          localStorage.setItem(`payment_${orderId}`, JSON.stringify(newPayment))
          console.log('✅ Payment created via API:', newPayment)
        }
      } catch (apiError) {
        console.log('❌ API payment failed:', apiError)
        
        // Không tạo mock payment, báo lỗi
        if (isMounted) {
          alert('Không thể tạo payment. Vui lòng thử lại sau.')
          navigate('/checkout')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
          // Xóa flag sau khi hoàn thành
          sessionStorage.removeItem(paymentCreatingKey)
        }
      }
    }

    initializePayment()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [orderId, amount, navigate])

  const handlePaymentSuccess = async () => {
    console.log('=== HANDLE PAYMENT SUCCESS ===')
    console.log('Payment from state:', payment)
    
    // Lấy payment từ localStorage nếu state null
    let currentPayment = payment
    if (!currentPayment && orderId) {
      const storedPayment = localStorage.getItem(`payment_${orderId}`)
      if (storedPayment) {
        currentPayment = JSON.parse(storedPayment)
        console.log('Getting payment from localStorage:', currentPayment)
      }
    }
    
    if (!currentPayment) {
      console.error('❌ No payment object!')
      alert('Không tìm thấy thông tin payment. Vui lòng thử lại.')
      return
    }

    try {
      setIsProcessing(true)
      
      console.log('Payment ID:', currentPayment.id)
      console.log('Payment ID type:', typeof currentPayment.id)
      
      // Khi customer ấn "đặt cọc", chỉ lưu thông tin và không update payment status
      // Payment vẫn giữ nguyên status PENDING
      // Staff sẽ ấn "đã cọc" ở order management sau
      
      console.log('✅ Customer đã xác nhận đặt cọc')
      console.log('Payment status vẫn là PENDING - chờ staff xác nhận')
      alert('Bạn đã xác nhận đặt cọc. Staff sẽ kiểm tra và xác nhận trong vòng 24h.')
      
      // Navigate về trang chủ
      navigate('/')
      
    } catch (error) {
      console.error('❌ Error updating payment:', error)
      alert('Có lỗi khi cập nhật thanh toán: ' + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy thanh toán?')) {
      try {
        setIsProcessing(true)
        
        if (payment?.isMock) {
          // Xử lý mock payment - xóa khỏi localStorage
          console.log('Deleting mock payment...')
          
          // Lưu payment info vào localStorage với status "Cancelled"
          const paymentHistory = JSON.parse(localStorage.getItem('paymentHistory') || '[]')
          paymentHistory.push({
            ...payment,
            status: 'Cancelled',
            cancelledAt: new Date().toISOString()
          })
          localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory))
          
          alert('Đã hủy thanh toán.')
          // Xóa payment khỏi localStorage sau khi hủy
          localStorage.removeItem(`payment_${orderId}`)
          localStorage.removeItem(`global_payment_creating_${orderId}`)
          navigate('/checkout')
        } else {
          // Xử lý API payment - xóa payment
          await ApiService.deletePayment(Number(payment?.id))
          
          alert('Đã hủy thanh toán.')
          // Xóa payment khỏi localStorage sau khi hủy
          localStorage.removeItem(`payment_${orderId}`)
          localStorage.removeItem(`global_payment_creating_${orderId}`)
          navigate('/checkout')
        }
      } catch (error) {
        console.error('Error cancelling payment:', error)
        alert('Có lỗi khi hủy thanh toán, vui lòng thử lại')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleEmergencyExit = () => {
    if (window.confirm('🚨 THOÁT KHẨN CẤP\n\nBạn có chắc chắn muốn thoát khỏi trang thanh toán?\nViệc này sẽ xóa tất cả dữ liệu thanh toán hiện tại.')) {
      console.log('🚨 Emergency exit triggered')
      
      // Xóa tất cả dữ liệu liên quan đến payment
      if (orderId) {
        localStorage.removeItem(`payment_${orderId}`)
        localStorage.removeItem(`global_payment_creating_${orderId}`)
        sessionStorage.removeItem(`payment_creating_${orderId}`)
      }
      
      // Xóa tất cả payment keys trong localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('payment_') || key.startsWith('global_payment_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Xóa tất cả payment keys trong sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('payment_')) {
          sessionStorage.removeItem(key)
        }
      })
      
      alert('✅ Đã thoát khỏi trang thanh toán và xóa tất cả dữ liệu.')
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        fontSize: '18px',
        gap: '24px'
      }}>
        <div>Đang tạo payment...</div>
        
        {/* Nút thoát khẩn cấp trong loading */}
        <button
          onClick={handleEmergencyExit}
          style={{
            background: 'transparent',
            border: '2px solid #dc2626',
            borderRadius: '12px',
            padding: '12px 24px',
            color: '#dc2626',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '140px',
            transition: 'all 0.2s ease'
          }}
          title="Thoát khẩn cấp khỏi trang thanh toán"
        >
          🚨 Thoát khẩn cấp
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '24px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(31, 41, 55, 0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Đặt Cọc
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.7)', 
            margin: '0 0 32px 0',
            fontSize: '16px'
          }}>
            Quét mã QR để đặt cọc 50,000 VND
          </p>

          {/* Thông tin đơn hàng */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>Thông tin đơn hàng</h3>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Mã đơn hàng:</strong> #{orderId}
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Số tiền đặt cọc:</strong> 50,000 VND
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Trạng thái:</strong> 
              <span style={{ 
                color: '#fbbf24',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(251, 191, 36, 0.2)',
                marginLeft: '8px'
              }}>
                ⏳ Chờ xác nhận đặt cọc
              </span>
            </p>
            <p style={{ margin: '4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              Sau khi đặt cọc, đơn hàng sẽ chuyển sang trạng thái "Đã cọc"
            </p>
          </div>

          {/* Ảnh QR Code */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="https://i.postimg.cc/xTrRthMd/e9c8aeab-d3bf-40a0-8f21-bd5f07f07dcf.jpg"
              alt="QR Code thanh toán"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Hướng dẫn */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#22c55e' }}>Hướng dẫn đặt cọc</h4>
            <ol style={{ 
              textAlign: 'left', 
              margin: '8px 0 0 0', 
              paddingLeft: '20px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <li>Mở ứng dụng ngân hàng trên điện thoại</li>
              <li>Quét mã QR ở trên</li>
              <li>Chuyển khoản 50,000 VND để đặt cọc</li>
              <li>Nhấn nút "Đã đặt cọc" bên dưới để xác nhận</li>
            </ol>
          </div>

          {/* Nút hành động */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handlePaymentSuccess}
              disabled={isProcessing}
              style={{
                background: '#22c55e',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                minWidth: '160px',
                opacity: isProcessing ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isProcessing ? 'Đang xử lý...' : 'Đã đặt cọc'}
            </button>

            <button
              onClick={handleCancel}
              disabled={isProcessing}
              style={{
                background: 'transparent',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                padding: '16px 32px',
                color: '#ef4444',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                minWidth: '160px',
                opacity: isProcessing ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isProcessing ? 'Đang xử lý...' : 'Hủy'}
            </button>

            {/* Nút thoát khẩn cấp - luôn hiển thị */}
            <button
              onClick={handleEmergencyExit}
              style={{
                background: 'transparent',
                border: '2px solid #dc2626',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#dc2626',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '140px',
                transition: 'all 0.2s ease',
                opacity: 0.8
              }}
              title="Thoát khẩn cấp khỏi trang thanh toán"
            >
              🚨 Thoát khẩn cấp
            </button>
          </div>

          {/* Lưu ý */}
          <div style={{
            marginTop: '24px',
            padding: '12px',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            <strong>Lưu ý:</strong> Vui lòng chỉ nhấn "Đã đặt cọc" sau khi đã hoàn tất chuyển khoản đặt cọc thành công.
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
