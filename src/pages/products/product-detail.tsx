import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'

interface ProductItem {
  id: number
  name: string
  brand: string
  price: string
  image: string
  specs: Record<string, string | number | boolean>
  features: string[]
  rating: number
  reviews: number
  inStock: boolean
  category: string
  categoryId: number
  productPrices?: Array<{
    id: number
    supplier: {
      id: number
      name: string
      website: string
    }
    price: number
    supplierLink: string
    updatedAt: string
  }>
}

// Mapping các category ID với tên và icon
const CATEGORY_INFO: Record<number, { name: string; icon: string; route: string }> = {
  1: { name: 'CPU', icon: '🖥️', route: '/products/cpu' },
  2: { name: 'GPU', icon: '🎮', route: '/products/gpu' },
  3: { name: 'RAM', icon: '💾', route: '/products/ram' },
  4: { name: 'Mainboard', icon: '🔌', route: '/products/mainboard' },
  5: { name: 'Storage', icon: '💿', route: '/products/storage' },
  6: { name: 'PSU', icon: '⚡', route: '/products/psu' },
  7: { name: 'Case', icon: '📦', route: '/products/case' },
  8: { name: 'Cooling', icon: '❄️', route: '/products/cooling' },
  9: { name: 'Monitor', icon: '🖥️', route: '/products/monitor' },
  10: { name: 'Keyboard', icon: '⌨️', route: '/products/keyboard' },
  11: { name: 'Mouse', icon: '🖱️', route: '/products/mouse' },
  12: { name: 'Headset & Speaker', icon: '🎧', route: '/products/headset-speaker' }
}

function ProductDetailPage() {
  const { id } = useParams<{ category: string; id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchProductDetail = useCallback(async (productId: number) => {
    setLoading(true)
    setError(null)
    try {
      // Kiểm tra cache trước
      const cacheKey = `product_${productId}`
      const cachedProduct = localStorage.getItem(cacheKey)
      
      if (cachedProduct) {
        try {
          const parsedProduct = JSON.parse(cachedProduct)
          // Kiểm tra cache có cũ hơn 5 phút không
          const cacheTime = parsedProduct.cacheTime || 0
          const now = Date.now()
          if (now - cacheTime < 5 * 60 * 1000) { // 5 phút
            console.log('Using cached product data')
            setProduct(parsedProduct.data)
            setLoading(false)
            return
          }
        } catch {
          console.log('Invalid cache data, fetching fresh data')
        }
      }
      
      // Gọi API trực tiếp theo ID (nhanh hơn nhiều)
      console.log('Fetching product by ID:', productId)
      const foundProduct = await ApiService.getProductById(productId)
      
      if (!foundProduct) {
        setProduct(null)
        return
      }
      
      // Lấy thông tin category
      const categoryId = Number(foundProduct.category_id) || Number((foundProduct.category as { id?: number })?.id) || 1
      const categoryInfo = CATEGORY_INFO[categoryId] || { name: 'Unknown', icon: '📦', route: '/products' }
      
      // Xử lý productPrices
      const productPrices = foundProduct.productPrices as Array<{
        id: number
        supplier: {
          id: number
          name: string
          website: string
        }
        price: number
        supplierLink: string
        updatedAt: string
      }> || []
      
      // Tính min-max price range
      let priceRange = 'Liên hệ'
      if (productPrices.length > 0) {
        const prices = productPrices.map(p => p.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        
        if (minPrice === maxPrice) {
          priceRange = `${minPrice.toLocaleString('vi-VN')} VND`
        } else {
          priceRange = `${minPrice.toLocaleString('vi-VN')} - ${maxPrice.toLocaleString('vi-VN')} VND`
        }
      }
      
      // Xử lý specs dựa trên loại sản phẩm
      const specs = parseSpecsByCategory(foundProduct, categoryId)
      
      const formattedProduct: ProductItem = {
        id: Number(foundProduct.id) || 0,
        name: String(foundProduct.name) || 'Unknown Product',
        brand: String(foundProduct.brand) || 'Unknown',
        price: priceRange,
        image: String(foundProduct.image_url1 || foundProduct.imageUrl1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
        specs: specs,
        features: ['Unknown'],
        rating: 4.0,
        reviews: 0,
        inStock: true,
        category: categoryInfo.name,
        categoryId: categoryId,
        productPrices: productPrices.map(pp => ({
          id: pp.id || 0,
          supplier: {
            id: pp.supplier?.id || 0,
            name: pp.supplier?.name || 'Unknown Supplier',
            website: pp.supplier?.website || ''
          },
          price: pp.price || 0,
          supplierLink: pp.supplierLink || '',
          updatedAt: pp.updatedAt || ''
        }))
      }
      
      setProduct(formattedProduct)
      
      // Lưu vào cache
      try {
        const cacheData = {
          data: formattedProduct,
          cacheTime: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log('Product data cached successfully')
      } catch (e) {
        console.log('Failed to cache product data:', e)
      }
      
    } catch (err) {
      console.error('Error fetching product detail:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải sản phẩm')
      setProduct(null)
      
      // Auto retry nếu chưa retry quá 3 lần
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchProductDetail(productId)
        }, 1000 * (retryCount + 1)) // Exponential backoff
      }
    } finally {
      setLoading(false)
    }
  }, [retryCount])

  useEffect(() => {
    if (id) {
      fetchProductDetail(parseInt(id))
    }
  }, [id, fetchProductDetail])

  // Preload related products khi component mount
  useEffect(() => {
    const preloadRelatedProducts = async () => {
      try {
        // Preload một số sản phẩm cùng category để cache sẵn
        const allProducts = await ApiService.getAllProducts()
        const currentProduct = allProducts.find(p => Number(p.id) === Number(id))
        
        if (currentProduct) {
          const categoryId = Number(currentProduct.category_id) || Number((currentProduct.category as { id?: number })?.id) || 1
          const relatedProducts = allProducts
            .filter(p => {
              const pCategoryId = Number(p.category_id) || Number((p.category as { id?: number })?.id) || 1
              return pCategoryId === categoryId && Number(p.id) !== Number(id)
            })
            .slice(0, 3) // Chỉ preload 3 sản phẩm đầu tiên
          
          // Cache các sản phẩm liên quan
          relatedProducts.forEach(product => {
            const cacheKey = `product_${product.id}`
            const cacheData = {
              data: product,
              cacheTime: Date.now()
            }
            try {
              localStorage.setItem(cacheKey, JSON.stringify(cacheData))
            } catch (e) {
              console.log('Failed to cache related product:', e)
            }
          })
          
          console.log(`Preloaded ${relatedProducts.length} related products`)
        }
      } catch (error) {
        console.log('Failed to preload related products:', error)
      }
    }

    // Chỉ preload sau khi trang đã load xong
    const timer = setTimeout(preloadRelatedProducts, 2000)
    return () => clearTimeout(timer)
  }, [id])

  // Hàm parse specs dựa trên category
  const parseSpecsByCategory = (product: Record<string, unknown>, categoryId: number): Record<string, string | number | boolean> => {
    const specsString = String(product.specs || '')
    
    switch (categoryId) {
      case 1: { // CPU
        const baseClockMatch = specsString.match(/(\d+\.?\d*)\s*GHz/)
        const coresMatch = specsString.match(/(\d+)-Core/)
        const baseClock = baseClockMatch ? `${baseClockMatch[1]} GHz` : 'Unknown'
        const cores = coresMatch ? parseInt(coresMatch[1]) : 0
        const threads = cores * 2
        
        return {
          socketType: String(product.socket) || 'Unknown',
          cores: cores,
          threads: threads,
          baseClock: baseClock,
          boostClock: 'Unknown',
          tdp: `${Number(product.tdp_watt || product.tdpWatt) || 0}W`,
          integratedGraphics: true,
          cache: 'Unknown',
          lithography: 'Unknown',
          memoryType: 'Unknown',
          maxMemory: 'Unknown'
        }
      }
      
      case 2: { // GPU
        return {
          chipset: String(product.chipset) || 'Unknown',
          memory: String(product.memory) || 'Unknown',
          memoryType: String(product.memoryType) || 'Unknown',
          baseClock: String(product.baseClock) || 'Unknown',
          boostClock: String(product.boostClock) || 'Unknown',
          tdp: `${Number(product.tdp_watt || product.tdpWatt) || 0}W`,
          interface: String(product.interface) || 'Unknown',
          outputs: String(product.outputs) || 'Unknown'
        }
      }
      
      case 3: { // RAM
        return {
          capacity: String(product.capacity) || 'Unknown',
          type: String(product.type) || 'Unknown',
          speed: String(product.speed) || 'Unknown',
          latency: String(product.latency) || 'Unknown',
          voltage: String(product.voltage) || 'Unknown',
          formFactor: String(product.formFactor) || 'Unknown'
        }
      }
      
      case 4: { // Mainboard
        return {
          socket: String(product.socket) || 'Unknown',
          chipset: String(product.chipset) || 'Unknown',
          formFactor: String(product.formFactor) || 'Unknown',
          memorySlots: String(product.memorySlots) || 'Unknown',
          maxMemory: String(product.maxMemory) || 'Unknown',
          expansionSlots: String(product.expansionSlots) || 'Unknown',
          storage: String(product.storage) || 'Unknown',
          networking: String(product.networking) || 'Unknown'
        }
      }
      
      case 5: { // Storage
        return {
          capacity: String(product.capacity) || 'Unknown',
          type: String(product.type) || 'Unknown',
          interface: String(product.interface) || 'Unknown',
          readSpeed: String(product.readSpeed) || 'Unknown',
          writeSpeed: String(product.writeSpeed) || 'Unknown',
          formFactor: String(product.formFactor) || 'Unknown',
          endurance: String(product.endurance) || 'Unknown'
        }
      }
      
      case 6: { // PSU
        return {
          wattage: String(product.wattage) || 'Unknown',
          efficiency: String(product.efficiency) || 'Unknown',
          modular: String(product.modular) || 'Unknown',
          formFactor: String(product.formFactor) || 'Unknown',
          connectors: String(product.connectors) || 'Unknown',
          fan: String(product.fan) || 'Unknown'
        }
      }
      
      case 7: { // Case
        return {
          formFactor: String(product.formFactor) || 'Unknown',
          dimensions: String(product.dimensions) || 'Unknown',
          material: String(product.material) || 'Unknown',
          color: String(product.color) || 'Unknown',
          fans: String(product.fans) || 'Unknown',
          driveBays: String(product.driveBays) || 'Unknown',
          expansionSlots: String(product.expansionSlots) || 'Unknown'
        }
      }
      
      case 8: { // Cooling
        return {
          type: String(product.type) || 'Unknown',
          socket: String(product.socket) || 'Unknown',
          fanSize: String(product.fanSize) || 'Unknown',
          noiseLevel: String(product.noiseLevel) || 'Unknown',
          tdp: String(product.tdp) || 'Unknown',
          height: String(product.height) || 'Unknown',
          material: String(product.material) || 'Unknown'
        }
      }
      
      case 9: { // Monitor
        return {
          size: String(product.size) || 'Unknown',
          resolution: String(product.resolution) || 'Unknown',
          refreshRate: String(product.refreshRate) || 'Unknown',
          panelType: String(product.panelType) || 'Unknown',
          responseTime: String(product.responseTime) || 'Unknown',
          brightness: String(product.brightness) || 'Unknown',
          connectivity: String(product.connectivity) || 'Unknown'
        }
      }
      
      case 10: { // Keyboard
        return {
          type: String(product.type) || 'Unknown',
          switch: String(product.switch) || 'Unknown',
          layout: String(product.layout) || 'Unknown',
          connectivity: String(product.connectivity) || 'Unknown',
          backlight: String(product.backlight) || 'Unknown',
          material: String(product.material) || 'Unknown',
          dimensions: String(product.dimensions) || 'Unknown'
        }
      }
      
      case 11: { // Mouse
        return {
          type: String(product.type) || 'Unknown',
          sensor: String(product.sensor) || 'Unknown',
          dpi: String(product.dpi) || 'Unknown',
          connectivity: String(product.connectivity) || 'Unknown',
          buttons: String(product.buttons) || 'Unknown',
          weight: String(product.weight) || 'Unknown',
          dimensions: String(product.dimensions) || 'Unknown'
        }
      }
      
      case 12: { // Headset & Speaker
        return {
          type: String(product.type) || 'Unknown',
          connectivity: String(product.connectivity) || 'Unknown',
          frequency: String(product.frequency) || 'Unknown',
          impedance: String(product.impedance) || 'Unknown',
          microphone: String(product.microphone) || 'Unknown',
          weight: String(product.weight) || 'Unknown',
          color: String(product.color) || 'Unknown'
        }
      }
      
      default: {
        return {
          specs: specsString || 'Unknown'
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="layout">
          <main className="main">
            {/* Breadcrumb skeleton */}
            <div className="mb-6 flex items-center gap-2 text-sm">
              <div className="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-white/20 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-white/20 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image skeleton */}
              <div className="space-y-4">
                <div className="aspect-square rounded-lg bg-white/10 border border-white/20 animate-pulse"></div>
                <div className="rounded-lg border border-white/20 bg-white/10 p-6">
                  <div className="h-8 w-3/4 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-1/2 bg-white/20 rounded animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-white/20 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price skeleton */}
              <div className="space-y-6">
                <div className="rounded-lg border border-white/20 bg-white/10 p-6">
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse mb-4"></div>
                  <div className="h-10 w-48 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-40 bg-white/20 rounded animate-pulse"></div>
                </div>
                
                <div className="rounded-lg border border-white/20 bg-white/10 p-6">
                  <div className="h-6 w-48 bg-white/20 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                        <div className="flex-1">
                          <div className="h-5 w-24 bg-white/20 rounded animate-pulse mb-1"></div>
                          <div className="h-4 w-16 bg-white/20 rounded animate-pulse mb-1"></div>
                          <div className="h-3 w-20 bg-white/20 rounded animate-pulse"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-6 w-20 bg-white/20 rounded animate-pulse mb-2"></div>
                          <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-12 w-full bg-white/20 rounded-lg animate-pulse"></div>
                  <div className="h-12 w-full bg-white/20 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="layout">
          <main className="main">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <div className="text-lg text-red-400 mb-2">Lỗi tải sản phẩm</div>
              <div className="text-sm text-white/70 mb-6">{error}</div>
              <div className="space-x-4">
                <button 
                  onClick={() => {
                    setRetryCount(0)
                    setError(null)
                    if (id) fetchProductDetail(parseInt(id))
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🔄 Thử lại
                </button>
                <button 
                  onClick={() => navigate('/products')}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ← Quay lại danh sách
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!product && !loading) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="layout">
          <main className="main">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-lg text-white/70 mb-4">Không tìm thấy sản phẩm</div>
              <button 
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ← Quay lại danh sách sản phẩm
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const categoryInfo = CATEGORY_INFO[product?.categoryId || 1] || { name: 'Unknown', icon: '📦', route: '/products' }

  return (
    <div className="page bg-grid bg-radial">
      <div className="layout">
        <main className="main">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <span 
              onClick={() => navigate('/products')}
              className="text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
            >
              📦 Products
            </span>
            <svg className="w-3 h-3 text-white/60" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
            <span 
              onClick={() => navigate(categoryInfo.route)}
              className="text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
            >
              {categoryInfo.icon} {categoryInfo.name}
            </span>
            <svg className="w-3 h-3 text-white/60" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 font-medium rounded-md border border-blue-400/30">
              {product?.name || 'Unknown Product'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hình ảnh bên trái */}
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-white/10 border border-white/20">
                <img
                  src={product?.image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'}
                  alt={product?.name || 'Unknown Product'}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thông tin cơ bản */}
              <div className="rounded-lg border border-white/20 bg-white/10 p-6">
                <h1 className="text-2xl font-bold text-white mb-2">{product?.name || 'Unknown Product'}</h1>
                <p className="text-lg text-white/70 mb-4">{product?.brand || 'Unknown Brand'}</p>
                
                <div className="space-y-2 text-sm">
                  {Object.entries(product?.specs || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-white/70 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Thông tin giá bên phải */}
            <div className="space-y-6">
              {/* Giá tổng quan */}
              <div className="rounded-lg border border-white/20 bg-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Giá sản phẩm</h2>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {product?.price || 'Liên hệ'}
                </div>
                <p className="text-sm text-white/60">
                  Giá từ {product?.productPrices?.length || 0} nhà cung cấp
                </p>
              </div>

              {/* Danh sách giá từ các supplier */}
              {product?.productPrices && product.productPrices.length > 0 && (
                <div className="rounded-lg border border-white/20 bg-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Giá từ các nhà cung cấp</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {product?.productPrices
                      .sort((a, b) => a.price - b.price)
                      .map((priceInfo, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              {priceInfo.supplier.name}
                            </div>
                            <div className="text-white/60 text-sm">
                              ID: {priceInfo.supplier.id}
                            </div>
                            <div className="text-white/50 text-xs">
                              Cập nhật: {new Date(priceInfo.updatedAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-lg">
                              {priceInfo.price.toLocaleString('vi-VN')} VND
                            </div>
                            {priceInfo.supplierLink && (
                              <a 
                                href={priceInfo.supplierLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 text-cyan-400 text-sm font-medium rounded-lg border border-cyan-400 bg-transparent hover:bg-cyan-400 hover:text-white transition-all duration-200"
                              >
                                Xem tại shop
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Nút hành động */}
              <div className="space-y-3">
                <button 
                  className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg ${
                    product?.inStock 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!product?.inStock}
                >
                  {product?.inStock ? '🛒 Add to Build' : '❌ Out of Stock'}
                </button>
                <button className="w-full border-2 border-orange-400 text-orange-400 bg-orange-400/10 px-6 py-4 rounded-lg font-bold text-lg hover:bg-orange-400 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  ⚖️ So sánh sản phẩm
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProductDetailPage
