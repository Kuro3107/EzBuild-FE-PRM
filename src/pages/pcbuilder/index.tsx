import { useCallback, useEffect, useMemo, useState } from 'react'
import '../../Homepage.css'
import '../compare/index.css'

interface ApiProduct {
  id?: number
  name?: string
  brand?: string
  model?: string
  specs?: string
  imageUrl1?: string
  imageUrl2?: string
  imageUrl3?: string
  imageUrl4?: string
  imageUrl5?: string
  category?: {
    id?: number
    name?: string
  }
  capacity?: string
  color?: string
  size?: string
  socket?: string
  tdpWatt?: number
  type?: string
  createdAt?: string
  productModels?: unknown[]
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

interface PCComponent {
  id: number
  name: string
  brand: string
  model: string
  specs: string
  image: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  category: string
  categoryId: number
  // Additional product info
  capacity?: string
  color?: string
  size?: string
  socket?: string
  tdpWatt?: number
  type?: string
  createdAt?: string
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
  selectedSupplier?: {
    id: number
    supplier: {
      id: number
      name: string
      website: string
    }
    price: number
    supplierLink: string
    updatedAt: string
  }
}

interface BuildComponent {
  category: string
  categoryId: number
  component: PCComponent | null
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

// PC Build categories in order
const buildCategories = [
  { id: 1, name: 'CPU', icon: '🖥️', required: true },
  { id: 4, name: 'Mainboard', icon: '🔧', required: true },
  { id: 3, name: 'RAM', icon: '💾', required: true },
  { id: 2, name: 'GPU', icon: '🎮', required: false },
  { id: 5, name: 'Storage', icon: '💿', required: true },
  { id: 6, name: 'PSU', icon: '⚡', required: true },
  { id: 7, name: 'Case', icon: '📦', required: true },
  { id: 8, name: 'Cooling', icon: '❄️', required: false },
  { id: 9, name: 'Monitor', icon: '🖥️', required: false },
  { id: 10, name: 'Keyboard', icon: '⌨️', required: false },
  { id: 11, name: 'Mouse', icon: '🖱️', required: false },
  { id: 12, name: 'Headset/Speaker', icon: '🎧', required: false }
]

function PCBuilderPage() {
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>(
    buildCategories.map(cat => ({
      category: cat.name,
      categoryId: cat.id,
      component: null
    }))
  )
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [products, setProducts] = useState<PCComponent[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<PCComponent | null>(null)
  const [loadedCategories, setLoadedCategories] = useState<Set<number>>(new Set())
  const [categoryProductCounts, setCategoryProductCounts] = useState<{ [key: number]: number }>({})
  const [productDetails, setProductDetails] = useState<{ [key: number]: PCComponent }>({})
  const [rawApiProducts, setRawApiProducts] = useState<ApiProduct[]>([])
  const [showPCSummary, setShowPCSummary] = useState(false)


  // Helper function to format detailed product info (with prices)
  const formatDetailedProducts = (categoryProducts: ApiProduct[], categoryId: number): PCComponent[] => {
    return (categoryProducts as ApiProduct[]).map((item) => {
              // Lấy giá từ productPrices (tính min-max range)
              const productPrices = item.productPrices as Array<{
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

              return {
                id: Number(item.id) || 0,
                name: String(item.name) || 'Unknown Product',
                brand: String(item.brand) || 'Unknown',
                model: String(item.model) || 'Unknown',
                specs: String(item.specs) || 'No specifications available',
        image: String(item.imageUrl1) || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop',
                price: priceRange,
                category: categoryMap[categoryId] || 'Unknown',
                categoryId: categoryId,
        // Additional product info
        capacity: item.capacity,
        color: item.color,
        size: item.size,
        socket: item.socket,
        tdpWatt: item.tdpWatt,
        type: item.type,
        createdAt: item.createdAt,
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
            })
  }

  // Load all products in one API call
  useEffect(() => {
    const loadAllProducts = async () => {
      setLoading(true)
      try {
        console.log('🚀 Loading all products in single API call...')
        
        // Single API call to get all products
        const response = await fetch(`${import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080'}/api/product`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const allApiProducts = await response.json()
        console.log(`📦 Loaded ${allApiProducts.length} products in 1 API call`)

        // Store raw API data for later use
        setRawApiProducts(allApiProducts)

        // Process and categorize products
        const allProducts: PCComponent[] = []
        const counts: { [key: number]: number } = {}
        
        // Initialize counts for all categories
        Object.keys(categoryMap).forEach(categoryId => {
          counts[Number(categoryId)] = 0
        })

        // Process each product and categorize
        allApiProducts.forEach((item: ApiProduct) => {
          const categoryId = item.category?.id
          if (categoryId && categoryMap[categoryId]) {
            const basicProduct = {
              id: Number(item.id) || 0,
              name: String(item.name) || 'Unknown Product',
              brand: String(item.brand) || 'Unknown',
              model: String(item.model) || 'Unknown',
              specs: String(item.specs) || 'No specifications available',
              image: String(item.imageUrl1) || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop',
              price: 'Đang tải...', // Placeholder price
              category: categoryMap[categoryId] || 'Unknown',
              categoryId: categoryId,
              productPrices: [], // Empty initially
              // Additional product info
              capacity: item.capacity,
              color: item.color,
              size: item.size,
              socket: item.socket,
              tdpWatt: item.tdpWatt,
              type: item.type,
              createdAt: item.createdAt
            }
            
            allProducts.push(basicProduct)
            counts[categoryId] = (counts[categoryId] || 0) + 1
          }
        })

        console.log('📊 Product counts by category:', counts)
        
        setProducts(allProducts)
        setCategoryProductCounts(counts)
        setLoadedCategories(new Set(Object.keys(categoryMap).map(Number)))
        
        console.log('✅ Successfully loaded and categorized all products')
      } catch (err) {
        console.error('❌ Error loading products:', err)
        setProducts([])
        setCategoryProductCounts({})
      } finally {
        setLoading(false)
      }
    }

    loadAllProducts()
  }, [])

  // Load detailed product info when user clicks on a product
  const loadProductDetails = useCallback(async (productId: number) => {
    if (productDetails[productId]) {
      return productDetails[productId] // Already loaded
    }

    try {
      // Find the product to get its category
      const product = products.find(p => p.id === productId)
      if (!product) return null

      console.log(`🔍 Loading details for product ${productId} in category ${product.categoryId}`)
      
      // Use the raw API data we already have - no need for another API call!
      const apiProduct = rawApiProducts.find((item: ApiProduct) => item.id === productId)
      
      if (apiProduct) {
        const detailedProduct = formatDetailedProducts([apiProduct], product.categoryId)[0]
        
        if (detailedProduct) {
          setProductDetails(prev => ({
            ...prev,
            [productId]: detailedProduct
          }))
          console.log(`✅ Loaded detailed info for product ${productId} from cached data`)
          return detailedProduct
        }
      }
    } catch (err) {
      console.error(`❌ Error loading details for product ${productId}:`, err)
    }
    
    return null
  }, [products, productDetails, rawApiProducts])

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    let filtered = products
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand.toLowerCase().includes(query) || 
        p.model.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [products, selectedCategory, searchQuery])

  // Calculate total price
  const totalPrice = useMemo(() => {
    return buildComponents.reduce((total, buildComp) => {
      if (buildComp.component?.price && 
          buildComp.component.price !== 'Liên hệ' && 
          buildComp.component.price !== 'Đang tải...') {
        // Parse min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
        const minPriceMatch = buildComp.component.price.match(/^([\d.,]+)/)
        if (minPriceMatch) {
          const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
          return total + minPrice
        }
      }
      return total
    }, 0)
  }, [buildComponents])

  // Calculate PC specifications summary
  const pcSpecsSummary = useMemo(() => {
    const specs = {
      totalTDP: 0,
      totalRAM: 0,
      totalStorage: 0,
      components: [] as Array<{
        category: string
        name: string
        specs: string
        tdp?: number
        capacity?: string
        socket?: string
        size?: string
        color?: string
        type?: string
      }>
    }

    buildComponents.forEach(buildComp => {
      if (buildComp.component) {
        const comp = buildComp.component
        const category = buildComp.category
        
        // Add to components list
        specs.components.push({
          category,
          name: comp.name,
          specs: comp.specs,
          tdp: comp.tdpWatt,
          capacity: comp.capacity,
          socket: comp.socket,
          size: comp.size,
          color: comp.color,
          type: comp.type
        })

        // Calculate totals
        if (comp.tdpWatt) {
          specs.totalTDP += comp.tdpWatt
        }
        
        if (comp.capacity && (category.includes('RAM') || category.includes('Storage'))) {
          const capacityMatch = comp.capacity.match(/(\d+)/)
          if (capacityMatch) {
            const capacity = parseInt(capacityMatch[1])
            if (comp.capacity.includes('GB')) {
              specs.totalRAM += capacity
            } else if (comp.capacity.includes('TB')) {
              specs.totalStorage += capacity * 1024 // Convert TB to GB
            } else {
              specs.totalStorage += capacity
            }
          }
        }
      }
    })

    return specs
  }, [buildComponents])

  // Check if build is complete
  const isBuildComplete = useMemo(() => {
    const requiredCategories = buildCategories.filter(cat => cat.required)
    return requiredCategories.every(cat => {
      const buildComp = buildComponents.find(bc => bc.categoryId === cat.id)
      return buildComp?.component
    })
  }, [buildComponents])


  // Handle component removal
  const handleRemoveComponent = (categoryId: number) => {
    setBuildComponents(prev => prev.map(buildComp => 
      buildComp.categoryId === categoryId 
        ? { ...buildComp, component: null }
        : buildComp
    ))
  }

  // Clear search when category changes
  useEffect(() => {
    setSearchQuery('')
  }, [selectedCategory])

  return (
    <div className="page bg-grid bg-radial">
      <div className="layout">
        <main className="main">
          <section className="hero">
            <h1 className="hero-title">PC Builder</h1>
            <p className="hero-subtitle">Chọn từng linh kiện để xây dựng PC hoàn chỉnh của bạn.</p>
          </section>

          <div style={{ padding: '24px' }}>
            {/* Category Tabs */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                Chọn loại linh kiện
              </h2>
              
              {/* Required Components */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>🔧</span>
                  Linh kiện bắt buộc
                </h3>
                <div className="pc-builder-category-tabs">
                  {buildCategories.filter(cat => cat.required).map((category) => {
                  const buildComp = buildComponents.find(bc => bc.categoryId === category.id)
                    const isSelected = selectedCategory === category.id
                    const hasComponent = !!buildComp?.component
                  
                  return (
                      <button
                      key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`pc-builder-category-card ${isSelected ? 'pc-builder-category-selected' : ''}`}
                      style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: isSelected 
                            ? 'rgba(59, 130, 246, 0.2)' 
                            : hasComponent 
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(255,255,255,0.05)',
                          border: isSelected 
                            ? '1px solid rgba(59, 130, 246, 0.5)' 
                            : hasComponent
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = hasComponent 
                              ? 'rgba(16, 185, 129, 0.3)'
                              : 'rgba(255,255,255,0.08)'
                          }
                      }}
                      onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = hasComponent 
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(255,255,255,0.05)'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '18px' }}>{category.icon}</span>
                          {categoryProductCounts[category.id] && (
                              <span style={{ 
                                fontSize: '10px', 
                              color: '#3b82f6', 
                              fontWeight: '600',
                              background: 'rgba(59, 130, 246, 0.1)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              minWidth: '16px',
                              textAlign: 'center'
                            }}>
                              {categoryProductCounts[category.id]}
                              </span>
                            )}
                          </div>
                        <span>{category.name}</span>
                        {hasComponent && (
                          <span style={{ 
                            background: '#10b981', 
                            color: 'white', 
                            fontSize: '8px', 
                            padding: '2px 4px', 
                            borderRadius: '3px',
                            fontWeight: '500'
                          }}>
                            ✓
                          </span>
                        )}
                        {loadedCategories.has(category.id) && !hasComponent && (
                          <span style={{ 
                            background: 'rgba(59, 130, 246, 0.3)', 
                            color: 'white', 
                            fontSize: '8px', 
                            padding: '2px 4px', 
                            borderRadius: '3px',
                            fontWeight: '500'
                          }}>
                            📦
                          </span>
                        )}
                      </button>
                    )
                  })}
                        </div>
              </div>

              {/* Optional Components */}
              <div>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  Linh kiện tùy chọn
                </h3>
                <div className="pc-builder-category-tabs">
                  {buildCategories.filter(cat => !cat.required).map((category) => {
                    const buildComp = buildComponents.find(bc => bc.categoryId === category.id)
                    const isSelected = selectedCategory === category.id
                    const hasComponent = !!buildComp?.component
                    
                    return (
                          <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`pc-builder-category-card ${isSelected ? 'pc-builder-category-selected' : ''}`}
                            style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 16px',
                          background: isSelected 
                            ? 'rgba(59, 130, 246, 0.2)' 
                            : hasComponent 
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(255,255,255,0.05)',
                          border: isSelected 
                            ? '1px solid rgba(59, 130, 246, 0.5)' 
                            : hasComponent
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '500',
                              cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = hasComponent 
                              ? 'rgba(16, 185, 129, 0.3)'
                              : 'rgba(255,255,255,0.08)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = hasComponent 
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'rgba(255,255,255,0.05)'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '18px' }}>{category.icon}</span>
                          {categoryProductCounts[category.id] && (
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#3b82f6', 
                              fontWeight: '600',
                              background: 'rgba(59, 130, 246, 0.1)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              minWidth: '16px',
                              textAlign: 'center'
                            }}>
                              {categoryProductCounts[category.id]}
                            </span>
                        )}
                      </div>
                        <span>{category.name}</span>
                        {hasComponent && (
                          <span style={{ 
                            background: '#10b981', 
                            color: 'white', 
                            fontSize: '8px', 
                            padding: '2px 4px', 
                            borderRadius: '3px',
                            fontWeight: '500'
                          }}>
                            ✓
                          </span>
                        )}
                        {loadedCategories.has(category.id) && !hasComponent && (
                          <span style={{ 
                            background: 'rgba(59, 130, 246, 0.3)', 
                            color: 'white', 
                            fontSize: '8px', 
                            padding: '2px 4px', 
                            borderRadius: '3px',
                            fontWeight: '500'
                          }}>
                            📦
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Search Bar - Only show when category is selected */}
            {selectedCategory && (
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder={`Tìm kiếm ${buildCategories.find(c => c.id === selectedCategory)?.name.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {/* Main Content Grid */}
            <div className="pc-builder-grid">
              {/* Product Selection Section */}
              <div>
                {selectedCategory ? (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '20px' 
                    }}>
                      <span style={{ fontSize: '24px' }}>
                        {buildCategories.find(c => c.id === selectedCategory)?.icon}
                    </span>
                      <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                        {buildCategories.find(c => c.id === selectedCategory)?.name}
                      </h3>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                        color: 'white',
                        fontSize: '12px',
                          cursor: 'pointer',
                          marginLeft: 'auto'
                      }}
                    >
                        ✕ Đóng
                    </button>
              </div>
                  
                  {loading ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.6)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                        <div style={{ fontSize: '16px', marginBottom: '4px' }}>Đang tải sản phẩm...</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          {buildCategories.find(c => c.id === selectedCategory)?.name}
                        </div>
                    </div>
                  ) : (
                      <div className="pc-builder-products-grid">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                            onClick={async () => {
                              const detailedProduct = await loadProductDetails(product.id)
                              setSelectedComponent(detailedProduct || product)
                          }}
                            className="pc-builder-product-card"
                          style={{
                              padding: '16px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <img 
                              src={product.image} 
                              alt={product.name}
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px' 
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <h4 style={{ 
                                  color: 'white', 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  margin: '0 0 4px 0',
                                  lineHeight: '1.3'
                                }}>
                                {product.name}
                              </h4>
                                <p style={{ 
                                  color: 'rgba(255,255,255,0.6)', 
                                  fontSize: '13px', 
                                  margin: '0 0 6px 0' 
                                }}>
                                  {product.brand}{product.model && product.model !== 'Unknown' ? ` - ${product.model}` : ''}
                                </p>
                                <p style={{ 
                                  color: product.price === 'Đang tải...' ? 'rgba(255,255,255,0.5)' : '#3b82f6', 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  margin: 0 
                                }}>
                                  {product.price === 'Đang tải...' ? 'Liên hệ' : product.price}
                                </p>
                              </div>
                            </div>
                            <div style={{
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              padding: '8px',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {/* Smart product info display */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {/* Category-specific info - moved to top */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {/* CPU specific */}
                                  {product.categoryId === 1 && (
                                    <>
                                      {product.socket && (
                                        <span style={{
                                          background: 'rgba(59, 130, 246, 0.2)',
                                          color: '#60a5fa',
                                          fontSize: '10px',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontWeight: '500'
                                        }}>
                                          {product.socket}
                                        </span>
                                      )}
                                      {product.tdpWatt && (
                                        <span style={{
                                          background: 'rgba(16, 185, 129, 0.2)',
                                          color: '#10b981',
                                          fontSize: '10px',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontWeight: '500'
                                        }}>
                                          {product.tdpWatt}W
                                        </span>
                                      )}
                                    </>
                                  )}
                                  
                                  {/* RAM specific */}
                                  {product.categoryId === 3 && product.capacity && (
                                    <span style={{
                                      background: 'rgba(168, 85, 247, 0.2)',
                                      color: '#a855f7',
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontWeight: '500'
                                    }}>
                                      {product.capacity}
                                    </span>
                                  )}
                                  
                                  {/* Storage specific */}
                                  {product.categoryId === 5 && product.capacity && (
                                    <span style={{
                                      background: 'rgba(245, 158, 11, 0.2)',
                                      color: '#f59e0b',
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontWeight: '500'
                                    }}>
                                      {product.capacity}
                                    </span>
                                  )}
                                  
                                  {/* Case specific */}
                                  {product.categoryId === 7 && product.size && (
                                    <span style={{
                                      background: 'rgba(239, 68, 68, 0.2)',
                                      color: '#ef4444',
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontWeight: '500'
                                    }}>
                                      {product.size}
                                    </span>
                                  )}
                                  
                                  {/* Color info for any product */}
                                  {product.color && (
                                    <span style={{
                                      background: 'rgba(107, 114, 128, 0.2)',
                                      color: '#9ca3af',
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontWeight: '500'
                                    }}>
                                      {product.color === 'Black' ? 'Đen' : 
                                       product.color === 'White' ? 'Trắng' :
                                       product.color === 'Red' ? 'Đỏ' :
                                       product.color === 'Blue' ? 'Xanh dương' :
                                       product.color === 'Green' ? 'Xanh lá' :
                                       product.color === 'Silver' ? 'Bạc' :
                                       product.color === 'Gray' ? 'Xám' :
                                       product.color}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Basic specs - moved below */}
                                {product.specs && product.specs !== 'No specifications available' && (
                                  <p style={{ 
                                    color: 'rgba(255,255,255,0.7)', 
                                    fontSize: '12px', 
                                    margin: 0,
                                    lineHeight: '1.4'
                                  }}>
                                    {product.specs}
                                  </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {filteredProducts.length === 0 && (
                          <div style={{ 
                            gridColumn: '1 / -1',
                            textAlign: 'center', 
                            padding: '60px', 
                            color: 'rgba(255,255,255,0.6)' 
                          }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Không tìm thấy sản phẩm nào</div>
                            <div style={{ fontSize: '14px' }}>Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px', 
                    color: 'rgba(255,255,255,0.6)' 
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🖥️</div>
                    <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
                      Chọn loại linh kiện để bắt đầu
                    </h3>
                    <p style={{ fontSize: '14px', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto' }}>
                      Click vào một trong các danh mục ở trên để xem danh sách sản phẩm tương ứng
                    </p>
                </div>
              )}
              </div>

              {/* Build Summary Section */}
              <div>
              <div className="pc-builder-build-summary" style={{
                position: 'sticky',
                top: '20px'
              }}>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                    Build của bạn
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  {buildComponents.map((buildComp) => {
                    if (!buildComp.component) return null
                    const category = buildCategories.find(c => c.id === buildComp.categoryId)
                    return (
                      <div key={buildComp.categoryId} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                          padding: '12px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '16px' }}>{category?.icon}</span>
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '500' }}>
                                {buildComp.category}
                        </span>
                          </div>
                            <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                              {buildComp.component.name}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                              {buildComp.component.brand} - {buildComp.component.model}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                            <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              {buildComp.component.price}
                            </div>
                            <button
                              onClick={() => handleRemoveComponent(buildComp.categoryId)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Xóa
                            </button>
                        </div>
                      </div>
                    )
                  })}
                    
                    {buildComponents.every(bc => !bc.component) && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '30px 20px', 
                        color: 'rgba(255,255,255,0.5)' 
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
                        <div style={{ fontSize: '13px' }}>Chưa có linh kiện nào</div>
                        <div style={{ fontSize: '11px', marginTop: '4px', color: 'rgba(255,255,255,0.4)' }}>
                          Chọn linh kiện từ danh sách bên trái
                        </div>
                      </div>
                    )}
                </div>
                
                  {buildComponents.some(bc => bc.component) && (
                    <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                        padding: '16px 0',
                  borderTop: '2px solid rgba(255,255,255,0.2)',
                  marginTop: '12px'
                }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
                    Tổng cộng:
                  </span>
                  <span style={{ color: '#3b82f6', fontSize: '20px', fontWeight: '700' }}>
                    {totalPrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                
                {/* PC Summary Button */}
                {isBuildComplete && (
                  <button
                    onClick={() => setShowPCSummary(true)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginTop: '16px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span>📊</span>
                    Xem thông số PC
                  </button>
                )}
                
                <button
                  style={{
                    width: '100%',
                    background: '#1e3a8a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'white',
                          fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '16px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3b82f6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1e3a8a'
                  }}
                >
                        💾 Lưu Build
                </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Supplier Prices Popup */}
      {selectedComponent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  {selectedComponent.name}
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', margin: 0 }}>
                  {selectedComponent.brand}{selectedComponent.model && selectedComponent.model !== 'Unknown' ? ` - ${selectedComponent.model}` : ''}
                </p>
                <p style={{ color: '#60a5fa', fontSize: '20px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                  {selectedComponent.price}
                </p>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Specifications */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
                Thông số kỹ thuật
              </h3>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Category-specific specifications - moved to top */}
                  {selectedComponent.categoryId === 1 && ( // CPU
                    <>
                      {selectedComponent.socket && (
                        <div style={{ 
                          color: 'rgba(255, 255, 255, 0.8)', 
                          fontSize: '14px', 
                          lineHeight: '1.6' 
                        }}>
                          <strong>Socket:</strong> {selectedComponent.socket}
                        </div>
                      )}
                      {selectedComponent.tdpWatt && (
                        <div style={{ 
                          color: 'rgba(255, 255, 255, 0.8)', 
                          fontSize: '14px', 
                          lineHeight: '1.6' 
                        }}>
                          <strong>Công suất tiêu thụ:</strong> {selectedComponent.tdpWatt}W
                        </div>
                      )}
                    </>
                  )}
                  
                  {selectedComponent.categoryId === 3 && selectedComponent.capacity && ( // RAM
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '14px', 
                      lineHeight: '1.6' 
                    }}>
                      <strong>Dung lượng:</strong> {selectedComponent.capacity}
                    </div>
                  )}
                  
                  {selectedComponent.categoryId === 5 && selectedComponent.capacity && ( // Storage
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '14px', 
                      lineHeight: '1.6' 
                    }}>
                      <strong>Dung lượng:</strong> {selectedComponent.capacity}
                    </div>
                  )}
                  
                  {selectedComponent.categoryId === 7 && selectedComponent.size && ( // Case
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '14px', 
                      lineHeight: '1.6' 
                    }}>
                      <strong>Kích thước:</strong> {selectedComponent.size}
                    </div>
                  )}
                  
                  {/* General specifications */}
                  {selectedComponent.color && (
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '14px', 
                      lineHeight: '1.6' 
                    }}>
                      <strong>Màu sắc:</strong> {selectedComponent.color === 'Black' ? 'Đen' : 
                                               selectedComponent.color === 'White' ? 'Trắng' :
                                               selectedComponent.color === 'Red' ? 'Đỏ' :
                                               selectedComponent.color === 'Blue' ? 'Xanh dương' :
                                               selectedComponent.color === 'Green' ? 'Xanh lá' :
                                               selectedComponent.color === 'Silver' ? 'Bạc' :
                                               selectedComponent.color === 'Gray' ? 'Xám' :
                                               selectedComponent.color}
                    </div>
                  )}
                  
                  {selectedComponent.type && (
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '14px', 
                      lineHeight: '1.6' 
                    }}>
                      <strong>Loại:</strong> {selectedComponent.type === 'Gaming' ? 'Gaming' :
                                            selectedComponent.type === 'Office' ? 'Văn phòng' :
                                            selectedComponent.type === 'Professional' ? 'Chuyên nghiệp' :
                                            selectedComponent.type === 'Budget' ? 'Tiết kiệm' :
                                            selectedComponent.type}
                    </div>
                  )}
                  
                  {/* Basic specs - moved below */}
                  {selectedComponent.specs && selectedComponent.specs !== 'No specifications available' && (
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: '14px', 
                      lineHeight: '1.6' 
                    }}>
                      <strong>Thông số cơ bản:</strong> {selectedComponent.specs}
                    </div>
                  )}
                  
                  {/* Show message if no specs available */}
                  {!selectedComponent.specs || selectedComponent.specs === 'No specifications available' ? 
                    (!selectedComponent.socket && !selectedComponent.tdpWatt && !selectedComponent.capacity && 
                     !selectedComponent.size && !selectedComponent.color && !selectedComponent.type) && (
                      <div style={{ 
                        color: 'rgba(255, 255, 255, 0.5)', 
                        fontSize: '14px', 
                        fontStyle: 'italic' 
                      }}>
                        Không có thông số kỹ thuật chi tiết
                      </div>
                    ) : null
                  }
                </div>
              </div>
            </div>

            {/* Hiển thị giá từ nhiều suppliers */}
            {selectedComponent.productPrices && selectedComponent.productPrices.length > 0 ? (
              <div>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
                  Giá từ các nhà cung cấp
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedComponent.productPrices
                    .sort((a, b) => a.price - b.price)
                    .map((priceInfo, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'white', fontWeight: '500', fontSize: '16px' }}>
                            {priceInfo.supplier.name}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                            ID: {priceInfo.supplier.id}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
                            {priceInfo.price.toLocaleString('vi-VN')} VND
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {priceInfo.supplierLink && (
                              <a 
                                href={priceInfo.supplierLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                  color: '#60a5fa',
                                  fontSize: '14px',
                                  textDecoration: 'none',
                                  padding: '4px 8px',
                                  border: '1px solid #60a5fa',
                                  borderRadius: '4px'
                                }}
                              >
                                Xem shop
                              </a>
                            )}
                            <button
                              onClick={() => {
                                // Lưu component với supplier được chọn
                                const componentWithSupplier = {
                                  ...selectedComponent,
                                  selectedSupplier: priceInfo,
                                  price: `${priceInfo.price.toLocaleString('vi-VN')} VND`
                                }
                                
                                // Cập nhật build components
                                setBuildComponents(prev => prev.map(buildComp => 
                                  buildComp.categoryId === componentWithSupplier.categoryId 
                                    ? { ...buildComp, component: componentWithSupplier }
                                    : buildComp
                                ))
                                
                                // Đóng popup và reset selection
                                setSelectedComponent(null)
                                setSelectedCategory(null)
                                setSearchQuery('')
                              }}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#059669'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#10b981'
                              }}
                            >
                              Chọn
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
                <div style={{ marginBottom: '20px' }}>
                  Không có thông tin giá từ nhà cung cấp
                </div>
                <button
                  onClick={() => {
                    // Lưu component không có supplier
                    const componentWithoutSupplier = {
                      ...selectedComponent,
                      price: 'Liên hệ'
                    }
                    
                    // Cập nhật build components
                    setBuildComponents(prev => prev.map(buildComp => 
                      buildComp.categoryId === componentWithoutSupplier.categoryId 
                        ? { ...buildComp, component: componentWithoutSupplier }
                        : buildComp
                    ))
                    
                    // Đóng popup và reset selection
                    setSelectedComponent(null)
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981'
                  }}
                >
                  Chọn sản phẩm này
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              marginTop: '24px', 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setSelectedComponent(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Hủy
              </button>
              {selectedComponent.productPrices && selectedComponent.productPrices.length > 0 && (
                <button
                  onClick={() => {
                    // Lưu component với giá min-max (không chọn supplier cụ thể)
                    const componentWithMinMaxPrice = {
                      ...selectedComponent
                    }
                    
                    // Cập nhật build components
                    setBuildComponents(prev => prev.map(buildComp => 
                      buildComp.categoryId === componentWithMinMaxPrice.categoryId 
                        ? { ...buildComp, component: componentWithMinMaxPrice }
                        : buildComp
                    ))
                    
                    // Đóng popup và reset selection
                    setSelectedComponent(null)
                    setSelectedCategory(null)
                    setSearchQuery('')
                  }}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                >
                  Chọn sản phẩm này
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PC Specifications Summary Modal */}
      {showPCSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  📊 Thông số PC của bạn
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
                  Tổng hợp chi tiết tất cả linh kiện đã chọn
                </p>
              </div>
              <button
                onClick={() => setShowPCSummary(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
                  {pcSpecsSummary.totalTDP}W
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Tổng công suất
                </div>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💾</div>
                <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>
                  {pcSpecsSummary.totalRAM}GB
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Tổng RAM
                </div>
              </div>

              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💿</div>
                <div style={{ color: '#a855f7', fontSize: '24px', fontWeight: 'bold' }}>
                  {pcSpecsSummary.totalStorage}GB
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Tổng lưu trữ
                </div>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>
                  {totalPrice.toLocaleString('vi-VN')} VND
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Tổng giá trị
                </div>
              </div>
            </div>

            {/* Component Details */}
            <div>
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Chi tiết linh kiện
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pcSpecsSummary.components.map((comp, index) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontSize: '20px' }}>
                            {buildCategories.find(cat => cat.name === comp.category)?.icon}
                          </span>
                          <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                            {comp.category}
                          </span>
                        </div>
                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {comp.name}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                          {comp.specs}
                        </div>
                      </div>
                    </div>

                    {/* Component-specific specs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {comp.socket && (
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}>
                          Socket: {comp.socket}
                        </span>
                      )}
                      {comp.tdp && (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}>
                          TDP: {comp.tdp}W
                        </span>
                      )}
                      {comp.capacity && (
                        <span style={{
                          background: 'rgba(168, 85, 247, 0.2)',
                          color: '#a855f7',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}>
                          Dung lượng: {comp.capacity}
                        </span>
                      )}
                      {comp.size && (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}>
                          Kích thước: {comp.size}
                        </span>
                      )}
                      {comp.color && (
                        <span style={{
                          background: 'rgba(107, 114, 128, 0.2)',
                          color: '#9ca3af',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}>
                          Màu: {comp.color === 'Black' ? 'Đen' : 
                                comp.color === 'White' ? 'Trắng' :
                                comp.color === 'Red' ? 'Đỏ' :
                                comp.color === 'Blue' ? 'Xanh dương' :
                                comp.color === 'Green' ? 'Xanh lá' :
                                comp.color === 'Silver' ? 'Bạc' :
                                comp.color === 'Gray' ? 'Xám' :
                                comp.color}
                        </span>
                      )}
                      {comp.type && (
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}>
                          Loại: {comp.type === 'Gaming' ? 'Gaming' :
                                comp.type === 'Office' ? 'Văn phòng' :
                                comp.type === 'Professional' ? 'Chuyên nghiệp' :
                                comp.type === 'Budget' ? 'Tiết kiệm' :
                                comp.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={() => setShowPCSummary(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save/export functionality
                  alert('Tính năng lưu build sẽ được thêm sau!')
                }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                💾 Lưu Build
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PCBuilderPage
