import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ApiService } from '../../services/api'

function CheckoutPage() {
  const navigate = useNavigate()
  const [cartBuild, setCartBuild] = useState<{ components?: Array<{ name?: string; model?: string; priceValue?: number }> } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ezbuild-checkout')
      if (raw) {
        const parsed = JSON.parse(raw)
        setCartBuild(parsed)
      } else {
        setCartBuild(null)
      }
    } catch {
      setCartBuild(null)
    }
  }, [])

  const totalPrice = useMemo(() => {
    if (!cartBuild || !Array.isArray(cartBuild.components)) return 0
    return cartBuild.components.reduce((sum: number, c: { priceValue?: number }) => sum + (c?.priceValue || 0), 0)
  }, [cartBuild])

  async function handlePlaceOrder() {
    if (!cartBuild) return
    setIsSubmitting(true)
    try {
      // 1) Lấy user hiện tại
      const user = ApiService.getCurrentUser()
      if (!user) {
        alert('Vui lòng đăng nhập trước khi thanh toán')
        navigate('/login', { state: { from: '/checkout' } } as unknown as { state: { from: string } })
        return
      }

      console.log('=== CHECKOUT DEBUG ===')
      console.log('User object:', user)
      console.log('User ID:', user?.id || user?.userId)
      console.log('Total price:', totalPrice)

      // Kiểm tra user ID có hợp lệ không
      const userId = Number(user?.id || user?.userId || 0)
      if (!userId || userId === 0) {
        alert('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.')
        navigate('/login')
        return
      }

      // Kiểm tra nếu đang có tiến trình checkout khác
      const checkoutCreatingKey = `checkout_creating_${userId}`
      if (sessionStorage.getItem(checkoutCreatingKey)) {
        console.log('Checkout is being processed, please wait...')
        return
      }

      // Đánh dấu đang tạo order
      sessionStorage.setItem(checkoutCreatingKey, 'true')

      // 2) Lấy buildId từ build có sẵn của user
      let buildId: number | undefined
      try {
        const userBuilds = await ApiService.getBuildsByUser(userId)
        console.log('User builds:', userBuilds)
        
        if (userBuilds && userBuilds.length > 0) {
          // Lấy build mới nhất (có thể là build vừa được tạo từ PC Builder)
          const latestBuild = userBuilds[userBuilds.length - 1]
          buildId = Number(latestBuild.id)
          console.log('Using latest build ID:', buildId)
        } else {
          console.log('No builds found for user, creating order without buildId')
        }
      } catch (buildError) {
        console.error('Error fetching user builds:', buildError)
        console.log('Continuing without buildId')
      }

      // 3) Tạo order trạng thái PENDING để chờ thanh toán
      const order = await ApiService.createOrder({
        userId: userId,
        buildId: buildId, // Truyền buildId từ build có sẵn
        totalPrice: totalPrice,
        status: 'PENDING',
        paymentMethod: 'QR_CODE',
        phone: (user?.phone as string) || '',
        address: 'Chưa có địa chỉ' // Short address để test
      })

      console.log('Order created:', order)

      // Xóa flag sau khi tạo thành công
      sessionStorage.removeItem(checkoutCreatingKey)

      // 4) Payment API không tồn tại - chuyển về trang chủ
      alert('Đơn hàng đã được tạo thành công! Mã đơn hàng: #' + order.id)
      navigate('/')
      
      // 5) Xóa checkout data sau khi tạo order thành công
      localStorage.removeItem('ezbuild-checkout')
    } catch (e) {
      console.error(e)
      // Xóa flag khi có lỗi
      const user = ApiService.getCurrentUser()
      if (user) {
        const userId = Number(user?.id || user?.userId || 0)
        sessionStorage.removeItem(`checkout_creating_${userId}`)
      }
      alert('Có lỗi khi thanh toán, vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', margin: 0 }}>Thanh Toán</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Xem lại cấu hình và hoàn tất thanh toán</p>

        {!cartBuild && (
          <div style={{
            background: 'rgba(31, 41, 55, 0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            color: 'white'
          }}>
            Chưa có cấu hình để thanh toán. <Link to="/pcbuilder" style={{ color: '#60a5fa' }}>Quay lại PC Builder</Link>
          </div>
        )}

        {cartBuild && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
            <div style={{
              background: 'rgba(31, 41, 55, 0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              color: 'white'
            }}>
              <h3 style={{ marginTop: 0 }}>Cấu hình của bạn</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cartBuild.components?.map((c: { name?: string; model?: string; priceValue?: number }, idx: number) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '8px'
                  }}>
                    <span>{c?.name || c?.model || 'Linh kiện'}</span>
                    <span style={{ color: '#60a5fa' }}>{(c?.priceValue || 0).toLocaleString('vi-VN')} VND</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(31, 41, 55, 0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              color: 'white',
              height: 'fit-content'
            }}>
              <h3 style={{ marginTop: 0 }}>Tóm tắt</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Tạm tính</span>
                <span style={{ color: '#60a5fa' }}>{totalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                <span>Cọc</span>
                <span style={{ color: '#60a5fa' }}>50.000 VND</span>
              </div>
              <button
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                style={{
                  width: '100%', background: '#1e3a8a', border: 'none',
                  borderRadius: '8px', padding: '12px', color: 'white', fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đặt cọc'}
              </button>
              <button
                onClick={() => navigate('/pcbuilder')}
                style={{
                  width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', padding: '12px', color: 'white', fontWeight: 600,
                  marginTop: '8px', cursor: 'pointer'
                }}
              >
                Quay lại tùy chỉnh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutPage


