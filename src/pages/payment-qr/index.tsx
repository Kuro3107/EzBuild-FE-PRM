import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ApiService } from '../../services/api'

function PaymentQRPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Lấy payment data từ state hoặc localStorage
    const data = location.state?.paymentData || JSON.parse(localStorage.getItem('payment-data') || '{}')
    if (data && data.id) {
      setPaymentData(data)
    } else {
      // Nếu không có data, chuyển về trang chủ
      navigate('/')
    }
    setIsLoading(false)
  }, [location.state, navigate])

  const handleGoHome = () => {
    localStorage.removeItem('payment-data')
    navigate('/')
  }

  const handleGoProfile = () => {
    localStorage.removeItem('payment-data')
    navigate('/customer')
  }

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white'
      }}>
        <div>Đang tải...</div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white'
      }}>
        <div>Không tìm thấy thông tin thanh toán</div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Header */}
        <h1 style={{ 
          color: 'white', 
          margin: '0 0 8px 0',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          Thanh toán ứng trước
        </h1>
        <p style={{ 
          color: 'rgba(255,255,255,0.8)', 
          margin: '0 0 32px 0',
          fontSize: '16px'
        }}>
          Quét QR code để thanh toán 25% giá trị đơn hàng
        </p>

        {/* Payment Info */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Số tiền ứng trước:</span>
            <span style={{ 
              color: '#60a5fa', 
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {paymentData.amount?.toLocaleString('vi-VN')} VND
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Mã thanh toán:</span>
            <span style={{ 
              color: '#60a5fa', 
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              #{paymentData.id}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <img 
            src="https://i.postimg.cc/vDzfmPPR/qr-code.png" 
            alt="QR Code thanh toán"
            style={{
              width: '320px',
              height: 'auto',
              display: 'block',
              maxWidth: '100%'
            }}
          />
        </div>

        {/* Instructions */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <h3 style={{ 
            color: '#60a5fa', 
            margin: '0 0 12px 0',
            fontSize: '18px'
          }}>
            Hướng dẫn thanh toán
          </h3>
          <div style={{ 
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            lineHeight: '1.6',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>1. Mở ứng dụng ngân hàng trên điện thoại</p>
            <p style={{ margin: '0 0 8px 0' }}>2. Chọn chức năng "Quét QR"</p>
            <p style={{ margin: '0 0 8px 0' }}>3. Quét mã QR ở trên</p>
            <p style={{ margin: '0' }}>4. Xác nhận thanh toán với số tiền hiển thị</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          flexDirection: 'column'
        }}>
          <button
            onClick={handleGoHome}
            style={{
              width: '100%',
              background: '#1e40af',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1d4ed8'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#1e40af'
            }}
          >
            🏠 Về trang chủ
          </button>
          
          <button
            onClick={handleGoProfile}
            style={{
              width: '100%',
              background: 'transparent',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '16px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            👤 Về trang cá nhân
          </button>
        </div>

        {/* Footer Note */}
        <p style={{ 
          color: 'rgba(255,255,255,0.6)', 
          fontSize: '12px',
          margin: '24px 0 0 0',
          lineHeight: '1.4'
        }}>
          Sau khi thanh toán thành công, nhân viên sẽ kiểm tra và xác nhận đơn hàng của bạn.
          <br />
          Bạn sẽ nhận được thông báo khi đơn hàng được xử lý.
        </p>
      </div>
    </div>
  )
}

export default PaymentQRPage
