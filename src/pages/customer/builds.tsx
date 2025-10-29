import { useEffect, useMemo, useState } from 'react'
import { ApiService } from '../../services/api'
import { Link } from 'react-router-dom'
import ChatBubble from '../../components/AIChatBubble'

interface BuildItemDTO {
  id?: number
  // New flat fields from BuildDetailResponse
  product_price_id?: number
  product_name?: string
  product_id?: number
  supplier_id?: number
  supplier_name?: string
  price?: number
  // Legacy nested shape (fallback)
  productPrice?: {
    id?: number
    price?: number
    supplier?: { name?: string }
    product?: { name?: string }
  }
  quantity?: number
}

interface BuildDTO {
  id?: number
  name?: string
  totalPrice?: number
  total_price?: number
  createdAt?: string
  created_at?: string
  user?: { id?: number }
  items?: BuildItemDTO[]
}

function CustomerBuildsPage() {
  const currentUser = ApiService.getCurrentUser()
  const [builds, setBuilds] = useState<BuildDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        if (!currentUser?.id && !currentUser?.userId) {
          setError('Bạn cần đăng nhập để xem Build đã lưu')
          setIsLoading(false)
          return
        }
        const uid = String(currentUser.id || currentUser.userId)
        const data = await ApiService.getBuildsByUser(uid)
        // Fetch detail for each build to include items (in parallel)
        const withItems = await Promise.all(
          (data as unknown as BuildDTO[]).map(async (b) => {
            if (!b.id) return b
            try {
              const detail = await ApiService.getBuildById(b.id)
              return { ...b, items: detail.items } as BuildDTO
            } catch (error) {
              console.error(`Failed to fetch build detail for build ${b.id}:`, error)
              return b
            }
          })
        )
        setBuilds(withItems)
      } catch {
        setError('Không thể tải danh sách build')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [currentUser?.id, currentUser?.userId])

  const totalBuilds = useMemo(() => builds.length, [builds])

  return (
    <div className="page bg-grid-dark">
      <div className="layout">
        <aside className="sidebar profile-sidebar">
          <div className="px-6 py-8 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                {(currentUser?.fullname as string || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white text-lg">Builds</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">{totalBuilds} saved</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-6">
            <div className="px-6 mb-4">
              <Link className="nav-item" to="/profile">Profile</Link>
              <Link className="nav-item-active" to="/builds">My Builds</Link>
              <Link className="nav-item" to="/orders">Orders</Link>
              <Link className="nav-item" to="/pcbuilder">PC Builder</Link>
            </div>
          </nav>
        </aside>

        <main className="main">
          <div className="w-full px-6 md:px-8 lg:px-10 pt-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Build đã lưu</h1>
              <p className="text-gray-400">Xem lại các cấu hình bạn đã lưu để mua sau</p>
            </div>
            {isLoading ? (
              <div className="text-center text-gray-300">Đang tải...</div>
            ) : error ? (
              <div className="text-center text-red-400">{error}</div>
            ) : builds.length === 0 ? (
              <div className="text-center text-gray-300">
                Chưa có build nào. <Link className="text-blue-400" to="/pcbuilder">Tạo build</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {builds.map((b) => (
                  <div key={b.id} className="bg-white/10 border border-white/20 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-white font-semibold text-lg">{b.name || `Build #${b.id}`}</div>
                        <div className="text-gray-400 text-sm">{(() => { const anyB = b as unknown as Record<string, unknown>; const d = b.createdAt || (anyB.created_at as string | undefined); return d ? new Date(d).toLocaleString() : '-' })()}</div>
                      </div>
                      <div className="text-blue-400 font-bold">
                        {(() => { const anyB = b as unknown as Record<string, unknown>; const v = (typeof b.totalPrice === 'number' ? b.totalPrice : Number(anyB.total_price || 0)); return v.toLocaleString('vi-VN') })()} VND
                      </div>
                    </div>
                    <div className="mt-4 text-gray-300 text-sm">
                      {(b.items || []).slice(0, 4).map((it, idx) => {
                        const name = it.product_name || it.productPrice?.product?.name || `Item ${idx + 1}`
                        const price = Number(it.price ?? it.productPrice?.price ?? 0)
                        return (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <span>{name}</span>
                            <span className="text-gray-400">{price > 0 ? `${price.toLocaleString('vi-VN')} VND` : ''} x{it.quantity || 1}</span>
                          </div>
                        )
                      })}
                      {(b.items || []).length > 4 && (
                        <div className="text-gray-400">+ {(b.items || []).length - 4} linh kiện khác</div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          // Save mapping into localStorage for PCBuilder to consume
                          const mapped = (b.items || []).map((it) => {
                            const anyIt = it as unknown as Record<string, unknown>
                            const nestedProduct = (it.productPrice?.product as unknown as Record<string, unknown>) || {}
                            return {
                              category_id: (anyIt.category_id as number | undefined) || (nestedProduct.category as Record<string, unknown> | undefined)?.id as number | undefined,
                              product_id: anyIt.product_id as number | undefined,
                              productPriceId: it.product_price_id || it.productPrice?.id,
                              price: typeof anyIt.price === 'number' ? anyIt.price as number : (it.productPrice?.price || 0),
                              quantity: it.quantity || 1,
                              productName: it.product_name || (nestedProduct.name as string | undefined)
                            }
                          })
                          localStorage.setItem('ezbuild-selected-build', JSON.stringify({ id: b.id, name: b.name, items: mapped }))
                          window.location.href = '/pcbuilder'
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        style={{ color: '#fff' }}
                      >
                        Xem
                      </button>
                      <button className="px-4 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-800 text-sm" style={{ color: '#fff' }}>Chia sẻ</button>
                      <button
                        onClick={async () => {
                          if (!b.id) return
                          if (!confirm('Bạn có chắc muốn xóa build này?')) return
                          try {
                            await ApiService.deleteBuild(Number(b.id))
                            setBuilds(prev => prev.filter(x => x.id !== b.id))
                          } catch {
                            alert('Không thể xóa build. Vui lòng thử lại!')
                          }
                        }}
                        className="px-4 py-2 border border-red-600 text-red-400 rounded-lg hover:bg-red-900/30 text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Chat Bubble */}
      <ChatBubble />
    </div>
  )
}

export default CustomerBuildsPage


