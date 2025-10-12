import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import '../../Homepage.css'
import './index.css'
import { ApiService } from '../../services/api'

interface ProductRow {
  label: string
  value: string
}

interface ApiProduct {
  id?: number
  name?: string
  brand?: string
  model?: string
  specs?: string
  image_url1?: string
  category_id?: number
  productPrices?: Array<{ price: number }>
}

interface CompareProduct {
  id: number
  name: string
  brand: string
  model: string
  specs: string
  image: string
  price: number
  category: string
  categoryId: number
}

// Category mapping moved outside component
const categoryMap: { [key: number]: string } = {
  1: 'CPU',
  2: 'GPU',
  3: 'RAM',
  4: 'Mainboard',
  5: 'Storage',
  6: 'PSU',
  7: 'Case',
  8: 'Cooling',
  9: 'Monitor',
  10: 'Keyboard',
  11: 'Mouse',
  12: 'Headset/Speaker'
}

// Memoized product item component for better performance
const ProductItem = memo(({ 
  product, 
  isSelected, 
  onSelect 
}: { 
  product: CompareProduct; 
  isSelected: boolean; 
  onSelect: (id: number) => void;
}) => (
  <button
    onClick={() => onSelect(product.id)}
    className={isSelected ? 'is-active' : ''}
  >
    <div className="text-left">
      <div className="font-medium">{product.name}</div>
      <div className="text-xs text-white/60">{product.brand} - {product.category}</div>
      {product.price > 0 && (
        <div className="text-xs text-green-400 mt-1">
          {product.price.toLocaleString('vi-VN')} VND
        </div>
      )}
    </div>
  </button>
))

ProductItem.displayName = 'ProductItem'

function ComparePage() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [products, setProducts] = useState<CompareProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const productsBtnRef = useRef<HTMLAnchorElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // Memoized function to convert API product to CompareProduct
  const convertApiProductToCompareProduct = useCallback((item: ApiProduct, categoryId: number): CompareProduct => {
    const productPrices = item.productPrices as Array<{ price: number }>
    const minPrice = Array.isArray(productPrices) && productPrices.length > 0
      ? Math.min(...productPrices.map(p => p.price))
      : 0

    return {
      id: Number(item.id) || 0,
      name: String(item.name) || 'Unknown Product',
      brand: String(item.brand) || 'Unknown',
      model: String(item.model) || 'Unknown',
      specs: String(item.specs) || 'No specifications available',
      image: String(item.image_url1) || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop',
      price: minPrice,
      category: categoryMap[categoryId] || 'Unknown',
      categoryId: categoryId
    }
  }, [])

  // Ultra-fast fetch with caching and lazy loading
  const fetchAllProducts = useCallback(async () => {
    // Check localStorage cache first
    const cacheKey = 'compare_products_cache'
    const cachedData = localStorage.getItem(cacheKey)
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`)
    
    // Use cache if less than 5 minutes old
    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp)
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        console.log('🚀 Using cached products data (ultra fast!)')
        const cachedProducts = JSON.parse(cachedData) as CompareProduct[]
        setProducts(cachedProducts)
        setDataLoaded(true)
        setIsInitialLoad(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('⚡ Fetching fresh products data...')
      const startTime = performance.now()
      
      // Single API call to get all products at once
      const allApiProducts = await ApiService.getAllProducts()
      
      // Convert all products to CompareProduct format
      const allProducts: CompareProduct[] = allApiProducts.map((item: Record<string, unknown>) => {
        const apiItem = item as ApiProduct
        const categoryId = Number(apiItem.category_id) || 0
        return convertApiProductToCompareProduct(apiItem, categoryId)
      })
      
      const endTime = performance.now()
      console.log(`⚡ Loaded ${allProducts.length} products in ${(endTime - startTime).toFixed(2)}ms`)
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(allProducts))
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())
      
      setProducts(allProducts)
      setDataLoaded(true)
    } catch (err) {
      console.error('Error fetching products for compare:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu sản phẩm')
      setProducts([])
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }, [convertApiProductToCompareProduct])

  // LAZY LOADING: Only fetch data when user starts searching
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value)
    
    // Load data only when user starts typing (lazy loading)
    if (!dataLoaded && value.trim().length > 0) {
      console.log('🚀 User started searching, loading data now...')
      fetchAllProducts()
    }
  }, [dataLoaded, fetchAllProducts])

  // Preload data in background after 2 seconds (non-blocking)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dataLoaded) {
        console.log('🔄 Preloading data in background...')
        fetchAllProducts()
      }
    }, 2000) // 2 seconds delay

    return () => clearTimeout(timer)
  }, [dataLoaded, fetchAllProducts])

  // Ultra-fast debounced search query (reduced to 150ms for snappier feel)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 150) // Reduced to 150ms for faster response

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!isProductsOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        productsBtnRef.current &&
        !productsBtnRef.current.contains(target)
      ) {
        setIsProductsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProductsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isProductsOpen])

  // Ultra-optimized filtering with early termination and chunking
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return [] // Chỉ hiển thị kết quả khi có search query
    
    // Early termination for very short queries
    if (q.length < 2) return []
    
    // Pre-compile regex for better performance
    const searchRegex = new RegExp(q, 'i')
    const results: CompareProduct[] = []
    
    // Process in chunks for better performance
    const chunkSize = 100
    for (let i = 0; i < products.length && results.length < 50; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize)
      const chunkResults = chunk.filter(p => 
        searchRegex.test(p.name) || 
        searchRegex.test(p.brand) || 
        searchRegex.test(p.model) ||
        searchRegex.test(p.category)
      )
      results.push(...chunkResults)
      
      // Early termination if we have enough results
      if (results.length >= 50) break
    }
    
    return results.slice(0, 50) // Limit results to 50 for better performance
  }, [debouncedQuery, products])

  const selected = useMemo(() => filtered.find(p => p.id === selectedId) || filtered[0] || null, [filtered, selectedId])

  // Memoized callback for product selection
  const handleProductSelect = useCallback((id: number) => {
    setSelectedId(id)
  }, [])

  const rows: ProductRow[] = useMemo(() => {
    if (!selected) return []
    
    const basicInfo = [
      { label: 'Name', value: selected.name },
      { label: 'Brand', value: selected.brand },
      { label: 'Model', value: selected.model },
      { label: 'Category', value: selected.category },
      { label: 'Price', value: selected.price > 0 ? `${selected.price.toLocaleString('vi-VN')} VND` : 'Liên hệ' }
    ]
    
    // Parse specs if available
    const specsInfo: ProductRow[] = []
    if (selected.specs && selected.specs !== 'No specifications available') {
      const specsLines = selected.specs.split('\n').filter(line => line.trim())
      specsLines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          specsInfo.push({ label: key, value })
        }
      })
    }
    
    return [...basicInfo, ...specsInfo]
  }, [selected])

  return (
    <div className="page bg-grid bg-radial">
      <div className="layout">
        <main className="main">
          <section className="hero">
            <h1 className="hero-title">So sánh sản phẩm</h1>
            <p className="hero-subtitle">Tìm kiếm và so sánh thông tin chi tiết các sản phẩm từ database.</p>
            <div className="hero-actions">
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={dataLoaded ? "Tìm kiếm sản phẩm..." : "Nhập để bắt đầu tìm kiếm..."}
                className="compare-search"
              />
              {!dataLoaded && (
                <div className="text-xs text-white/50 mt-2">
                  Dữ liệu sẽ được tải khi bạn bắt đầu tìm kiếm
                </div>
              )}
            </div>
          </section>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <div className="text-lg text-white/70">
                  {isInitialLoad ? 'Đang tải dữ liệu sản phẩm...' : 'Đang tìm kiếm...'}
                </div>
                <div className="text-sm text-white/50 mt-2">
                  {isInitialLoad 
                    ? 'Lần đầu sử dụng sẽ mất vài giây' 
                    : `Tìm kiếm trong ${products.length} sản phẩm`
                  }
                </div>
                {isInitialLoad && (
                  <div className="mt-4 bg-blue-900/20 rounded-lg p-3 text-sm text-blue-300">
                    💡 Lần sau sẽ nhanh hơn nhờ cache!
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-400 font-medium">Lỗi tải dữ liệu</h3>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={fetchAllProducts}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                >
                  Thử lại
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('compare_products_cache')
                    localStorage.removeItem('compare_products_cache_timestamp')
                    fetchAllProducts()
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                >
                  Xóa cache & tải lại
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && (
            <>
              {query.trim() === '' ? (
                <div className="text-center py-16">
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Bắt đầu tìm kiếm sản phẩm</h3>
                  <p className="text-white/60 mb-4">Nhập tên sản phẩm, thương hiệu hoặc danh mục để bắt đầu so sánh</p>
                  <div className="text-sm text-white/40 mb-4">
                    <p>Ví dụ: "Intel Core i5", "NVIDIA RTX", "ASUS", "CPU", "GPU"...</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 inline-block">
                    <div className="text-sm text-white/60">
                      {dataLoaded ? (
                        <>
                          <span className="text-blue-400 font-medium">{products.length}</span> sản phẩm có sẵn để so sánh
                          <div className="text-xs text-green-400 mt-1">✅ Dữ liệu đã sẵn sàng</div>
                        </>
                      ) : (
                        <>
                          <span className="text-yellow-400 font-medium">~1000+</span> sản phẩm sẵn sàng
                          <div className="text-xs text-yellow-400 mt-1">⏳ Nhập để tải dữ liệu</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="section-title flex items-center justify-between">
                    <div>
                      Kết quả tìm kiếm: "{query}" ({filtered.length} sản phẩm)
                    </div>
                    {query !== debouncedQuery && (
                      <div className="flex items-center text-sm text-white/50">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                        Đang tìm kiếm...
                      </div>
                    )}
                  </div>
                  <div className="compare-grid">
                    <div>
                      <div className="compare-list">
                        {filtered.length > 50 && (
                          <div className="px-3 py-2 bg-blue-900/20 border-b border-white/10 text-xs text-blue-300">
                            Hiển thị 50/{filtered.length} kết quả đầu tiên. Hãy tìm kiếm cụ thể hơn để thu hẹp kết quả.
                          </div>
                        )}
                        {filtered.map(p => (
                          <ProductItem
                            key={p.id}
                            product={p}
                            isSelected={selected?.id === p.id}
                            onSelect={handleProductSelect}
                          />
                        ))}
                        {filtered.length === 0 && (
                          <div className="px-3 py-8 text-center">
                            <svg className="w-12 h-12 mx-auto text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="text-sm text-white/60 mb-2">Không tìm thấy sản phẩm nào phù hợp</div>
                            <div className="text-xs text-white/40">Thử tìm kiếm với từ khóa khác</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="compare-table">
                        {selected && (
                          <div className="p-4 border-b border-white/20">
                            <div className="flex items-center gap-4">
                              <img 
                                src={selected.image} 
                                alt={selected.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div>
                                <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
                                <p className="text-sm text-white/60">{selected.brand} - {selected.category}</p>
                                {selected.price > 0 && (
                                  <p className="text-sm font-medium text-blue-400">{selected.price.toLocaleString('vi-VN')} VND</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        <table>
                          <thead>
                            <tr>
                              <th className="compare-field">Thông tin</th>
                              <th>Giá trị</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr key={r.label}>
                                <td className="capitalize font-medium">{r.label}</td>
                                <td>{r.value}</td>
                              </tr>
                            ))}
                            {!selected && (
                              <tr>
                                <td className="px-3 py-6 text-white/60" colSpan={2}>Chọn sản phẩm để xem chi tiết</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {isProductsOpen && (
          <div
            ref={popoverRef}
            className="fixed left-64 top-24 z-50 w-[900px] rounded-xl border border-white/20 bg-gray-900/95 backdrop-blur shadow-2xl p-4"
          >
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    'Case', 'CPU', 'Mainboard', 'GPU', 'RAM', 'Storage', 'Power Supply', 'CPU Cooler', 'Case Fan', 'Monitor', 'Mouse', 'Keyboard',
                  ].map((label) => (
                    <Link
                      key={label}
                      to={`/products/${label.toLowerCase().replace(' ', label === 'Power Supply' ? 'psu' : label === 'CPU Cooler' ? 'cpu-cooler' : '')}`.replace('/products/psu', '/products/psu').replace('/products/case fan', '/products/case-fan').replace('/products/power supply', '/products/psu')}
                      className="text-left rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2 text-sm text-white transition-colors block"
                      onClick={() => setIsProductsOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="w-48">
                <div className="grid grid-cols-1 gap-3">
                  {['Headphones', 'Webcam', 'Microphone', 'Speakers'].map((label) => (
                    <Link
                      key={label}
                      to={`/products/${label.toLowerCase()}`}
                      className="text-left rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2 text-sm text-white transition-colors block"
                      onClick={() => setIsProductsOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-white/60">Other Products: OS, Sound Card, Network, VR, Capture...</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComparePage
