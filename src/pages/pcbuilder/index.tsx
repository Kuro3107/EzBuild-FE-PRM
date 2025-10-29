import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../../services/api'
import Joyride, { STATUS, EVENTS } from 'react-joyride'
import type { CallBackProps } from 'react-joyride'
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
    id?: number
    supplier?: {
      id?: number
      name?: string
      website?: string
    }
    supplier_id?: number
    supplierId?: number
    price: number
    supplierLink?: string
    supplier_link?: string
    updatedAt?: string
    updated_at?: string
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
  hasSupplier?: boolean // Thêm thuộc tính để phân biệt có supplier hay không
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
  // Nhóm 1: 4 linh kiện bắt buộc trên
  { id: 1, name: 'CPU', icon: '🖥️', required: true, group: 'required-top' },
  { id: 4, name: 'Mainboard', icon: '🔧', required: true, group: 'required-top' },
  { id: 3, name: 'RAM', icon: '💾', required: true, group: 'required-top' },
  { id: 2, name: 'GPU', icon: '🎮', required: true, group: 'required-top' },
  // Nhóm 2: 4 linh kiện bắt buộc dưới
  { id: 5, name: 'Storage', icon: '💿', required: true, group: 'required-bottom' },
  { id: 6, name: 'PSU', icon: '⚡', required: true, group: 'required-bottom' },
  { id: 7, name: 'Case', icon: '📦', required: true, group: 'required-bottom' },
  { id: 8, name: 'Cooling', icon: '❄️', required: true, group: 'required-bottom' },
  // Linh kiện tùy chọn
  { id: 9, name: 'Monitor', icon: '🖥️', required: false, group: 'optional' },
  { id: 10, name: 'Keyboard', icon: '⌨️', required: false, group: 'optional' },
  { id: 11, name: 'Mouse', icon: '🖱️', required: false, group: 'optional' },
  { id: 12, name: 'Headset/Speaker', icon: '🎧', required: false, group: 'optional' }
]

function PCBuilderPage() {
  const navigate = useNavigate()
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
  const [suppliersMap, setSuppliersMap] = useState<Map<number, Record<string, unknown>>>(new Map())
  const [showPCSummary, setShowPCSummary] = useState(false)
  // Helper: build payload and save to database
  const handleSaveBuild = useCallback(async () => {
    const currentUser = ApiService.getCurrentUser()
    if (!currentUser?.id && !currentUser?.userId) {
      alert('Bạn cần đăng nhập để lưu build')
      try {
        navigate('/login', { state: { from: '/pcbuilder' } } as unknown as { state: { from: string } })
      } catch {
        // ignore navigation error
      }
      return
    }
    const mandatoryIds = [1,4,3,2,5,6,7,8]
    const selectedMandatory = buildComponents.filter(b => mandatoryIds.includes(b.categoryId) && b.component)
    if (selectedMandatory.length < mandatoryIds.length) {
      alert('Bạn cần chọn đủ 8 linh kiện bắt buộc trước khi lưu build')
      return
    }

    try {
      const name = prompt('Đặt tên cho build của bạn', 'My PC Build') || 'My PC Build'
      const computedTotalPrice = buildComponents.reduce((total, buildComp) => {
        const priceStr = buildComp.component?.price
        if (priceStr && priceStr !== 'Liên hệ' && priceStr !== 'Đang tải...') {
          const minPriceMatch = priceStr.match(/^[\d.,]+/)
          if (minPriceMatch) {
            const minPrice = parseInt(minPriceMatch[0].replace(/[.,]/g, ''))
            return total + minPrice
          }
        }
        return total
      }, 0)
      const items: Array<{ productPriceId: number; quantity: number }> = []
      for (const bc of selectedMandatory) {
        const pp = bc.component?.selectedSupplier || (bc.component?.productPrices && bc.component.productPrices[0])
        const id = pp?.id
        if (typeof id === 'number') {
          items.push({ productPriceId: id, quantity: 1 })
        }
      }

      await ApiService.createBuild({
        userId: String(currentUser?.id || currentUser?.userId || ''),
        name,
        totalPrice: computedTotalPrice,
        items
      })

      alert('Đã lưu build thành công!')
      navigate('/builds')
    } catch (e) {
      console.error('Save build error:', e)
      alert('Không thể lưu build. Vui lòng thử lại!')
    }
  }, [buildComponents, navigate])
  
  // Joyride tour states - Enhanced
  const [runTour, setRunTour] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const [tourMode, setTourMode] = useState<'guided' | 'interactive' | 'auto' | 'sequential'>('auto')
  const [selectedComponentsCount, setSelectedComponentsCount] = useState(0)
  const [tourPaused, setTourPaused] = useState(false)
  const [tourWaitingForCompletion, setTourWaitingForCompletion] = useState(false)
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  const [hasSeenTour, setHasSeenTour] = useState(false)
  const [tourProgress, setTourProgress] = useState(0)
  const [showTourWelcome, setShowTourWelcome] = useState(true)
  
  // Sequential tour states for component-by-component guidance
  const [currentComponentTour, setCurrentComponentTour] = useState<number | null>(null)
  const [completedComponentTours, setCompletedComponentTours] = useState<Set<number>>(new Set())
  const [sequentialTourActive, setSequentialTourActive] = useState(false)

  // Component order for sequential tour (left to right, top to bottom)
  const componentOrder = useMemo(() => [
    { id: 1, name: 'CPU', icon: '🖥️', group: 'required-top', position: 1 },
    { id: 4, name: 'Mainboard', icon: '🔧', group: 'required-top', position: 2 },
    { id: 3, name: 'RAM', icon: '💾', group: 'required-top', position: 3 },
    { id: 2, name: 'GPU', icon: '🎮', group: 'required-top', position: 4 },
    { id: 5, name: 'Storage', icon: '💿', group: 'required-bottom', position: 5 },
    { id: 6, name: 'PSU', icon: '⚡', group: 'required-bottom', position: 6 },
    { id: 7, name: 'Case', icon: '📦', group: 'required-bottom', position: 7 },
    { id: 8, name: 'Cooling', icon: '❄️', group: 'required-bottom', position: 8 }
  ], [])

  // Generate tour steps for specific component
  const generateComponentTourSteps = useCallback((componentId: number) => {
    const component = componentOrder.find(c => c.id === componentId)
    if (!component) return []

    const componentInfo = {
      1: { title: 'CPU - Bộ xử lý', desc: 'Bộ não của PC, quyết định hiệu suất tổng thể', tips: ['Chọn socket phù hợp với mainboard', 'Xem xét TDP và khả năng tản nhiệt', 'Cân nhắc số core và thread cho nhu cầu sử dụng'] },
      4: { title: 'Mainboard - Bo mạch chủ', desc: 'Kết nối tất cả linh kiện với nhau', tips: ['Tương thích socket với CPU', 'Hỗ trợ RAM type và tốc độ', 'Đủ slot PCIe cho GPU và storage'] },
      3: { title: 'RAM - Bộ nhớ', desc: 'Lưu trữ dữ liệu tạm thời, tăng tốc độ xử lý', tips: ['Dung lượng 16GB+ cho gaming', 'Tốc độ DDR4/DDR5 phù hợp', 'Chọn 2 thanh cho dual channel'] },
      2: { title: 'GPU - Card đồ họa', desc: 'Xử lý hình ảnh và video, quan trọng cho gaming', tips: ['Phù hợp với nhu cầu gaming/editing', 'Tương thích với PSU wattage', 'Kiểm tra kích thước case'] },
      5: { title: 'Storage - Ổ lưu trữ', desc: 'Lưu trữ hệ điều hành và dữ liệu', tips: ['SSD NVMe cho tốc độ cao', 'Dung lượng 500GB+ cho hệ thống', 'Cân nhắc thêm HDD cho dữ liệu'] },
      6: { title: 'PSU - Nguồn điện', desc: 'Cung cấp điện cho toàn bộ hệ thống', tips: ['Công suất đủ cho tất cả linh kiện', 'Chọn 80+ Gold/Bronze', 'Modular để dễ quản lý dây'] },
      7: { title: 'Case - Vỏ máy', desc: 'Bảo vệ và làm mát các linh kiện', tips: ['Kích thước phù hợp với mainboard', 'Khả năng tản nhiệt tốt', 'Đủ không gian cho GPU dài'] },
      8: { title: 'Cooling - Tản nhiệt', desc: 'Làm mát CPU và hệ thống', tips: ['Tương thích với socket CPU', 'Đủ khả năng tản nhiệt cho TDP', 'Cân nhắc AIO cho hiệu suất cao'] }
    }

    const info = componentInfo[componentId as keyof typeof componentInfo]
    const currentPosition = component.position
    const totalComponents = componentOrder.length

    return [
      {
        target: `.pc-builder-category-card[data-category-id="${componentId}"]`,
        content: (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '16px',
              padding: '12px',
              background: `linear-gradient(135deg, ${getComponentColor(componentId)}, ${getComponentColor(componentId, true)})`,
              borderRadius: '8px',
              color: 'white'
            }}>
              <div style={{ fontSize: '28px' }}>{component.icon}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  Bước {currentPosition}: {info.title}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  {info.desc}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginBottom: '12px'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                  💡 <strong>Mẹo chọn {component.name}:</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                  {info.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                  📍 Tiến độ: {currentPosition}/{totalComponents} linh kiện
                </p>
              </div>
            </div>
          </div>
        ),
        placement: 'top' as const,
        disableOverlayClose: true,
      }
    ]
  }, [componentOrder])

  // Helper function to get component colors
  const getComponentColor = (componentId: number, darker: boolean = false) => {
    const colors = {
      1: darker ? '#1d4ed8' : '#3b82f6', // CPU - Blue
      4: darker ? '#059669' : '#10b981', // Mainboard - Green  
      3: darker ? '#7c2d12' : '#f59e0b', // RAM - Orange
      2: darker ? '#be185d' : '#ec4899', // GPU - Pink
      5: darker ? '#c2410c' : '#f97316', // Storage - Orange
      6: darker ? '#b91c1c' : '#ef4444', // PSU - Red
      7: darker ? '#374151' : '#6b7280', // Case - Gray
      8: darker ? '#0d9488' : '#14b8a6'  // Cooling - Teal
    }
    return colors[componentId as keyof typeof colors] || '#3b82f6'
  }

  // Auto-start tour for first-time users
  useEffect(() => {
    // Apply build from Customer builds if exists
    try {
      const raw = localStorage.getItem('ezbuild-selected-build')
      if (raw) {
        const parsed = JSON.parse(raw) as { id?: number; name?: string; items?: Array<{ productPriceId?: number; quantity?: number; productName?: string; category_id?: number; product_id?: number; price?: number }> }
        console.log('Applying saved build:', parsed)

        if (parsed.items && parsed.items.length) {
          // Fetch product details for each item to build full PCComponent
          ;(async () => {
            const itemComponents = await Promise.all(
              parsed.items!.map(async (it) => {
                try {
                  const prodId = it.product_id
                  const prod = prodId ? await ApiService.getProductById(prodId) : undefined
                  const anyProd = (prod || {}) as Record<string, unknown>
                  const category = (anyProd.category as Record<string, unknown>) || {}
                  const categoryId = Number(category.id || it.category_id || 0)
                  const name = String(anyProd.name || it.productName || `Sản phẩm #${it.productPriceId || ''}`)
                  const priceNum = typeof it.price === 'number' ? it.price : 0
                  const priceStr = priceNum > 0 ? `${priceNum.toLocaleString('vi-VN')} VND` : 'Liên hệ'
                  const imageUrl = String(anyProd.imageUrl1 || '')
                  const component: PCComponent = {
                    id: Number(anyProd.id || 0),
                    name,
                    brand: String(anyProd.brand || ''),
                    model: String(anyProd.model || ''),
                    specs: String(anyProd.specs || ''),
                    image: imageUrl,
                    price: priceStr,
                    category: String(category.name || ''),
                    categoryId: categoryId || 0,
                    productPrices: []
                  }
                  return { categoryId, component }
                } catch {
                  return { categoryId: it.category_id || 0, component: undefined as unknown as PCComponent }
                }
              })
            )

            setBuildComponents((prev) => {
              const next = [...prev]
              itemComponents.forEach(({ categoryId, component }) => {
                if (!categoryId || !component) return
                const idx = next.findIndex(s => s.categoryId === categoryId)
                if (idx >= 0) {
                  next[idx] = { ...next[idx], component }
                }
              })
              return next
            })
          })()
        }
        localStorage.removeItem('ezbuild-selected-build')
      }
    } catch {
      // ignore parse errors
    }

    const hasSeenTourBefore = localStorage.getItem('ezbuild-tour-completed')
    const isFirstVisit = !hasSeenTourBefore
    
    if (isFirstVisit) {
      // Delay tour start to allow page to fully load
      const timer = setTimeout(() => {
        setTourMode('auto')
        setRunTour(true)
        setShowTourWelcome(true)
      }, 1500)
      
      return () => clearTimeout(timer)
    } else {
      setHasSeenTour(true)
      setShowTourWelcome(false)
    }
  }, [])

  // Calculate total price (moved up to be used in tour steps)
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

  // Calculate PC specifications and compatibility
  const pcSpecs = useMemo(() => {
    const specs = {
      totalTDP: 0,
      totalRAM: 0,
      totalStorage: 0,
      cpuSocket: '',
      ramType: '',
      ramSpeed: 0,
      gpuPower: 0,
      psuWattage: 0,
      caseSize: '',
      coolingTDP: 0,
      compatibilityIssues: [] as string[],
      recommendations: [] as string[]
    }

    buildComponents.forEach(buildComp => {
      if (!buildComp.component) return

      const component = buildComp.component
      const categoryId = buildComp.categoryId

      // CPU specs
      if (categoryId === 1) {
        specs.totalTDP += component.tdpWatt || 0
        specs.cpuSocket = component.socket || ''
      }

      // RAM specs
      if (categoryId === 3) {
        const ramCapacity = parseInt(component.capacity?.replace(/[^\d]/g, '') || '0')
        specs.totalRAM += ramCapacity
        specs.ramType = component.type || 'DDR4'
        specs.ramSpeed = parseInt(component.specs?.match(/(\d+)MHz/)?.[1] || '3200')
      }

      // Storage specs
      if (categoryId === 5) {
        const storageCapacity = parseInt(component.capacity?.replace(/[^\d]/g, '') || '0')
        specs.totalStorage += storageCapacity
      }

      // GPU specs
      if (categoryId === 2) {
        specs.gpuPower = component.tdpWatt || 0
        specs.totalTDP += specs.gpuPower
      }

      // PSU specs
      if (categoryId === 6) {
        specs.psuWattage = parseInt(component.specs?.match(/(\d+)W/)?.[1] || '0')
      }

      // Case specs
      if (categoryId === 7) {
        specs.caseSize = component.size || ''
      }

      // Cooling specs
      if (categoryId === 8) {
        specs.coolingTDP = component.tdpWatt || 0
      }
    })

    // Check compatibility and generate recommendations
    if (specs.psuWattage > 0 && specs.totalTDP > 0) {
      const recommendedPSU = Math.round(specs.totalTDP * 1.5) // 50% headroom
      if (specs.psuWattage < recommendedPSU) {
        specs.compatibilityIssues.push(`PSU ${specs.psuWattage}W có thể không đủ cho hệ thống ${specs.totalTDP}W. Khuyến nghị: ${recommendedPSU}W+`)
      }
    }

    if (specs.coolingTDP > 0 && specs.totalTDP > 0) {
      const cpuTDP = buildComponents.find(bc => bc.categoryId === 1)?.component?.tdpWatt || 0
      if (specs.coolingTDP < cpuTDP) {
        specs.compatibilityIssues.push(`Cooling ${specs.coolingTDP}W không đủ cho CPU ${cpuTDP}W. Khuyến nghị: ${cpuTDP}W+`)
      }
    }

    if (specs.totalRAM < 16) {
      specs.recommendations.push('RAM 16GB+ được khuyến nghị cho gaming và multitasking')
    }

    if (specs.totalStorage < 500) {
      specs.recommendations.push('Storage 500GB+ được khuyến nghị cho hệ điều hành và ứng dụng')
    }

    return specs
  }, [buildComponents])

  // Enhanced Tour steps configuration - Professional Interactive mode
  const interactiveTourSteps = [
    {
      target: '.tour-welcome',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px' }}>🚀</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Chào mừng đến với EzBuild!</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Trình xây dựng PC chuyên nghiệp</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '8px', fontSize: '15px', lineHeight: '1.5' }}>
              <strong>🎯 Hướng dẫn tương tác thông minh:</strong> Tôi sẽ dẫn dắt bạn từng bước một cách chuyên nghiệp!
            </p>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                ✨ <strong>Đặc điểm nổi bật:</strong>
              </p>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                <li>Chọn linh kiện trong khi được hướng dẫn</li>
                <li>Thông tin giá cả và tương thích thông minh</li>
                <li>Gợi ý sản phẩm phù hợp với ngân sách</li>
              </ul>
            </div>
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
              Hãy bắt đầu hành trình xây dựng PC hoàn hảo của bạn! 💻
            </p>
          </div>
        </div>
      ),
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '.tour-categories',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '28px' }}>🔧</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Bước 1: Chọn Linh Kiện</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Bắt đầu với CPU - Bộ não của PC</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '12px', fontSize: '15px', lineHeight: '1.5' }}>
              <strong>🎯 Chiến lược xây dựng PC:</strong> CPU là nền tảng, quyết định hiệu suất tổng thể!
            </p>
            
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                📋 <strong>Quy trình được đề xuất:</strong>
              </p>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                <li><strong>CPU</strong> → Chọn socket phù hợp</li>
                <li><strong>Mainboard</strong> → Tương thích với CPU</li>
                <li><strong>RAM</strong> → Dung lượng và tốc độ</li>
                <li><strong>Storage</strong> → SSD cho tốc độ</li>
              </ol>
            </div>
            
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
              padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                💡 <strong>Mẹo chuyên nghiệp:</strong> Click "CPU" để xem sản phẩm và chọn ngay trong tour này!
            </p>
            </div>
          </div>
        </div>
      ),
      placement: 'top' as const,
      disableOverlayClose: true,
    },
    {
      target: '.tour-products',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '28px' }}>📦</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Bước 2: Chọn Sản Phẩm</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Danh sách CPU chuyên nghiệp</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '12px', fontSize: '15px', lineHeight: '1.5' }}>
              <strong>🎯 Lựa chọn thông minh:</strong> Mỗi sản phẩm đều có thông tin chi tiết về giá cả và thông số!
            </p>
            
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                📊 <strong>Thông tin sản phẩm:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                <li><strong>Giá cả:</strong> Hiển thị khoảng giá từ nhiều nhà cung cấp</li>
                <li><strong>Socket:</strong> Tương thích với mainboard</li>
                <li><strong>TDP:</strong> Công suất tiêu thụ điện</li>
                <li><strong>Specs:</strong> Thông số kỹ thuật chi tiết</li>
              </ul>
            </div>
            
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '10px', 
            borderRadius: '6px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '12px'
          }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                ✨ <strong>Tương tác tự do:</strong> Sau bước này, bạn có thể chọn bất kỳ linh kiện nào!
            </p>
          </div>
            
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
              Hãy click vào CPU đầu tiên để bắt đầu xây dựng PC! 🚀
            </p>
          </div>
        </div>
      ),
      placement: 'top' as const,
      disableOverlayClose: false,
    },
    {
      target: '.tour-build-summary',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px' }}>🎉</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Build Hoàn Thành!</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Chúc mừng bạn đã tạo thành công PC</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
              padding: '16px', 
            borderRadius: '8px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>📊 Tiến độ Build:</span>
                <span style={{ fontSize: '16px', color: '#10b981', fontWeight: '700' }}>8/8 linh kiện</span>
              </div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                height: '8px', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #10b981, #34d399)', 
                  height: '100%', 
                  width: '100%',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '16px', color: '#10b981', fontWeight: '700', textAlign: 'center' }}>
                💰 Tổng giá trị: <strong>{totalPrice.toLocaleString('vi-VN')} VND</strong>
            </p>
          </div>
          
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                🚀 <strong>Bước tiếp theo:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
            <li>Xem thông số PC hoàn chỉnh</li>
                <li>Thêm linh kiện tùy chọn (Monitor, Keyboard...)</li>
            <li>Lưu build để tham khảo sau</li>
                <li>Chia sẻ build với bạn bè</li>
          </ul>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
              Bạn đã thành thạo PC Builder! Hãy click "Xem thông số PC" để hoàn thành! 🎯
            </p>
          </div>
        </div>
      ),
      placement: 'left' as const,
      disableOverlayClose: false,
    }
  ]

  // Tour steps configuration - Final steps (compatibility and checkout)
  const finalTourSteps = useMemo(() => [
    {
      target: '.tour-build-summary',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px' }}>🎉</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Build Hoàn Thành!</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Tất cả 8 linh kiện đã được chọn</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>📊 Tiến độ Build:</span>
                <span style={{ fontSize: '16px', color: '#10b981', fontWeight: '700' }}>8/8 linh kiện</span>
              </div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)', 
                height: '8px', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #10b981, #34d399)', 
                  height: '100%', 
                  width: '100%',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '16px', color: '#10b981', fontWeight: '700', textAlign: 'center' }}>
                💰 Tổng giá trị: <strong>{totalPrice.toLocaleString('vi-VN')} VND</strong>
              </p>
            </div>
            
            <p style={{ marginBottom: '12px', fontSize: '15px', lineHeight: '1.5' }}>
              <strong>🎯 Bước tiếp theo:</strong> Hãy kiểm tra tương thích và tiến hành thanh toán!
            </p>
          </div>
        </div>
      ),
      placement: 'left' as const,
      disableOverlayClose: false,
    },
    {
      target: '.tour-compatibility',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '28px' }}>🔍</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Kiểm Tra Tương Thích</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Đảm bảo tất cả linh kiện hoạt động tốt cùng nhau</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                🔧 <strong>Kiểm tra tương thích:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                <li>Socket CPU với Mainboard</li>
                <li>RAM type và tốc độ</li>
                <li>PSU đủ công suất</li>
                <li>Kích thước GPU với Case</li>
                <li>Tương thích Cooling với CPU</li>
              </ul>
            </div>
            
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                ✅ Click "Kiểm tra tương thích" để xem chi tiết!
              </p>
            </div>
          </div>
        </div>
      ),
      placement: 'top' as const,
      disableOverlayClose: false,
    },
    {
      target: '.tour-checkout',
      content: (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, #ec4899, #be185d)',
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ fontSize: '28px' }}>💳</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Thanh Toán</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Hoàn tất đơn hàng và nhận PC của bạn</p>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                💰 <strong>Tổng đơn hàng:</strong>
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#10b981', fontWeight: '700' }}>
                {totalPrice.toLocaleString('vi-VN')} VND
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                * Giá có thể thay đổi theo thời gian thực
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                🚀 <strong>Dịch vụ kèm theo:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                <li>Lắp ráp miễn phí</li>
                <li>Bảo hành từng linh kiện</li>
                <li>Hỗ trợ kỹ thuật 24/7</li>
                <li>Giao hàng tận nơi</li>
              </ul>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
              🎉 Chúc mừng! Bạn đã hoàn thành xây dựng PC hoàn hảo! 
            </p>
          </div>
        </div>
      ),
      placement: 'top' as const,
      disableOverlayClose: false,
    }
  ], [totalPrice])

  // Tour steps configuration - Build completion
  const buildCompleteTourSteps = useMemo(() => [
    {
      target: '.tour-build-summary',
      content: (
        <div>
          <h3 style={{ color: '#10b981', marginBottom: '12px' }}>🎉 Bước 1: Build của bạn đã hoàn thành!</h3>
          <p style={{ marginBottom: '8px' }}>Tuyệt vời! Bạn đã chọn đủ <strong>6/6</strong> linh kiện bắt buộc.</p>
          
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
              💰 Tổng giá trị: <strong>{totalPrice.toLocaleString('vi-VN')} VND</strong>
            </p>
          </div>
          
          <p style={{ marginBottom: '8px' }}>Trong phần "Build của bạn" này, bạn có thể:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px', fontSize: '13px' }}>
            <li>✅ Xem tất cả linh kiện đã chọn</li>
            <li>💰 Theo dõi tổng giá trị build</li>
            <li>🗑️ Xóa linh kiện không phù hợp</li>
            <li>📊 Xem thông số PC hoàn chỉnh</li>
          </ul>
          <p style={{ fontSize: '14px', color: '#666' }}>Hãy xem bước tiếp theo để xem thông số PC!</p>
        </div>
      ),
      placement: 'left' as const,
      disableOverlayClose: false,
    },
    {
      target: '.tour-pc-summary',
      content: (
        <div>
          <h3 style={{ color: '#3b82f6', marginBottom: '12px' }}>📊 Bước 2: Xem thông số PC hoàn chỉnh</h3>
          <p style={{ marginBottom: '8px' }}>Bây giờ hãy click nút <strong>"Xem thông số PC"</strong> ở dưới!</p>
          
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '12px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
              📊 Thông số bạn sẽ thấy:
            </p>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px' }}>
              <li>⚡ Tổng công suất tiêu thụ (TDP)</li>
              <li>💾 Tổng dung lượng RAM</li>
              <li>💿 Tổng dung lượng Storage</li>
              <li>🔧 Chi tiết từng linh kiện</li>
            </ul>
          </div>
          
          <p style={{ marginBottom: '8px' }}>Đây là bước cuối cùng để hoàn thành hướng dẫn!</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Sau khi xem xong, bạn sẽ thành thạo PC Builder! 🚀</p>
        </div>
      ),
      placement: 'top' as const,
      disableOverlayClose: false,
    }
  ], [totalPrice])

  // Add a third step for PC Summary button guidance
  const addPCSummaryStep = useCallback(() => {
    if (buildCompleteTourSteps.length < 3) {
      buildCompleteTourSteps.push({
        target: '.tour-pc-summary',
        content: (
          <div>
            <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>🎯 Bước 3: Hoàn thành hướng dẫn!</h3>
            <p style={{ marginBottom: '8px' }}>Bạn đã hoàn thành tất cả các bước hướng dẫn!</p>
            
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>
                🎉 Chúc mừng! Bạn đã thành thạo PC Builder!
              </p>
            </div>
            
            <p style={{ marginBottom: '8px' }}>Bây giờ bạn có thể:</p>
            <ul style={{ paddingLeft: '20px', marginBottom: '8px', fontSize: '13px' }}>
              <li>🔧 Xây dựng PC mới bất cứ lúc nào</li>
              <li>📊 Xem thông số chi tiết của build</li>
              <li>💰 So sánh giá từ các nhà cung cấp</li>
              <li>💾 Lưu build để tham khảo sau</li>
            </ul>
            <p style={{ fontSize: '14px', color: '#666' }}>Hãy khám phá thêm các tính năng khác của PC Builder! 🚀</p>
          </div>
        ),
        placement: 'top' as const,
        disableOverlayClose: false,
      })
    }
  }, [buildCompleteTourSteps])

  // Calculate selected components count and handle sequential tour
  useEffect(() => {
    const requiredCategories = buildCategories.filter(cat => cat.required)
    const count = requiredCategories.filter(cat => {
      const buildComp = buildComponents.find(bc => bc.categoryId === cat.id)
      return buildComp?.component
    }).length
    
    setSelectedComponentsCount(count)
    
    // Sequential tour logic - auto advance to next component
    if (sequentialTourActive && currentComponentTour) {
      const currentComp = buildComponents.find(bc => bc.categoryId === currentComponentTour)
      if (currentComp?.component) {
        // Component selected, mark as completed and move to next
        const newCompleted = new Set([...completedComponentTours, currentComponentTour])
        setCompletedComponentTours(newCompleted)
        
        // Find next component in order
        const nextComponent = componentOrder.find(comp => 
          comp.position === componentOrder.find(c => c.id === currentComponentTour)!.position + 1
        )
        
        if (nextComponent) {
          // Move to next component
          setTimeout(() => {
            setCurrentComponentTour(nextComponent.id)
            setSelectedCategory(nextComponent.id)
            setRunTour(true)
            setTourStepIndex(0)
          }, 1000)
        } else {
          // All components completed, show final steps
          setSequentialTourActive(false)
          setCurrentComponentTour(null)
          setTimeout(() => {
            setTourMode('guided')
            setRunTour(true)
            setTourStepIndex(0)
          }, 1000)
        }
      }
    }
    
    // Auto-advance tour when build is complete
    if (count === 8 && tourWaitingForCompletion) {
      // Show completion popup first
      setShowCompletionPopup(true)
      
      // Then show step 3 (build summary) after popup
      setTimeout(() => {
        addPCSummaryStep() // Add the third step if needed
        setRunTour(true)
        setTourStepIndex(2) // Go to step 3 (build summary)
        setTourWaitingForCompletion(false)
      }, 3000) // Wait 3 seconds to let user see the completion popup
    }
  }, [buildComponents, runTour, tourMode, tourWaitingForCompletion, addPCSummaryStep, sequentialTourActive, currentComponentTour, componentOrder, completedComponentTours])

  // Handle tour callbacks
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data
    
    // Update tour progress
    const progress = Math.round(((index + 1) / getCurrentTourSteps().length) * 100)
    setTourProgress(progress)
    
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Save tour completion state
      localStorage.setItem('ezbuild-tour-completed', 'true')
      localStorage.setItem('ezbuild-tour-completion-date', new Date().toISOString())
      
      setRunTour(false)
      setTourStepIndex(0)
      setTourMode('guided')
      setTourPaused(false)
      setTourWaitingForCompletion(false)
      setShowTourWelcome(false)
      
      // Show completion notification for first-time users
      if (!hasSeenTour && status === STATUS.FINISHED) {
        console.log('🎉 Tour completed successfully!')
      }
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const newIndex = data.index + (action === 'prev' ? -1 : 1)
      setTourStepIndex(newIndex)
      
      // Enhanced step transitions
      if (newIndex === 2 && action === 'next' && (tourMode === 'interactive' || tourMode === 'auto')) {
        // Pause tour for user interaction
        setRunTour(false)
        setTourPaused(true)
        setTourWaitingForCompletion(true)
        
        console.log('💡 Tour paused - you can now select components freely!')
      }
      
      // Auto-advance logic for auto mode
      if (tourMode === 'auto' && action === 'next' && newIndex === 0) {
        // Auto-select CPU category for demo
        setTimeout(() => {
          setSelectedCategory(1) // CPU
        }, 500)
      }
    }
  }

  // Handle product selection during tour
  const handleProductClick = useCallback(async (product: PCComponent) => {
    if (runTour && tourMode === 'interactive') {
      // Pause tour when user clicks on product
      setTourPaused(true)
    }
    
    // Load product details inline to avoid dependency issues
    if (productDetails[product.id]) {
      setSelectedComponent(productDetails[product.id])
    } else {
      try {
        const apiProduct = rawApiProducts.find((item: ApiProduct) => item.id === product.id)
        if (apiProduct) {
          const detailedProduct = formatDetailedProducts([apiProduct], product.categoryId, suppliersMap)[0]
          if (detailedProduct) {
            setProductDetails(prev => ({
              ...prev,
              [product.id]: detailedProduct
            }))
            setSelectedComponent(detailedProduct)
          }
        }
      } catch (err) {
        console.error(`Error loading details for product ${product.id}:`, err)
        setSelectedComponent(product)
      }
    }
  }, [runTour, tourMode, productDetails, rawApiProducts, suppliersMap])

  // Resume tour when product selection popup is closed
  const handleComponentPopupClose = useCallback(() => {
    setSelectedComponent(null)
    if (runTour && tourMode === 'interactive' && tourPaused) {
      // Resume tour after a short delay
      setTimeout(() => {
        setTourPaused(false)
      }, 500)
    }
  }, [runTour, tourMode, tourPaused])

  // Start interactive tour function
  const startInteractiveTour = () => {
    setTourMode('interactive')
    setRunTour(true)
    setTourStepIndex(0)
  }

  // Get current tour steps based on mode and completion status
  const getCurrentTourSteps = () => {
    if (tourMode === 'sequential' && currentComponentTour) {
      return generateComponentTourSteps(currentComponentTour)
    } else if (tourMode === 'guided' && selectedComponentsCount === 8) {
      return finalTourSteps
    } else if (tourMode === 'interactive') {
      return interactiveTourSteps
    }
    return interactiveTourSteps
  }

  // Helper function to format detailed product info (with prices)
  const formatDetailedProducts = (categoryProducts: ApiProduct[], categoryId: number, suppliers?: Map<number, Record<string, unknown>>): PCComponent[] => {
    return (categoryProducts as ApiProduct[]).map((item) => {
              // Lấy giá từ productPrices (tính min-max range)
              const productPrices = (item.productPrices as Array<Record<string, unknown>>) || []
              
              // Debug: Log sample product with prices - kiểm tra TẤT CẢ các fields
              if (item.name?.includes('Ryzen 9')) {
                console.log('🔍 Sample product data:', item.name)
                console.log('🔍 productPrices:', productPrices)
                console.log('🔍 Full item data:', JSON.stringify(item, null, 2))
                if (productPrices.length > 0) {
                  console.log('🔍 First price data:', productPrices[0])
                  console.log('🔍 First price keys:', Object.keys(productPrices[0]))
                  console.log('🔍 First price full:', JSON.stringify(productPrices[0], null, 2))
                  
                  // Kiểm tra TẤT CẢ các khả năng của supplier ID
                  const pp = productPrices[0] as Record<string, unknown>
                  console.log('🔍 Checking all possible supplier fields:')
                  console.log('  - pp.supplier:', pp.supplier)
                  console.log('  - pp.supplier_id:', pp.supplier_id)
                  console.log('  - pp.supplierId:', pp.supplierId)
                  console.log('  - pp.supplierId:', pp['supplierId'])
                  console.log('  - pp["supplier_id"]:', pp['supplier_id'])
                  console.log('  - pp["supplierId"]:', pp['supplierId'])
                  console.log('  - All keys:', Object.keys(pp))
                  console.log('  - HasOwnProperty supplier_id:', Object.prototype.hasOwnProperty.call(pp, 'supplier_id'))
                  console.log('  - HasOwnProperty supplierId:', Object.prototype.hasOwnProperty.call(pp, 'supplierId'))
                }
              }
              
              // Tính min-max price range
              const priceRange = 'Liên hệ'
              const hasSupplier = productPrices.length > 0

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
                hasSupplier: hasSupplier,
        // Additional product info
        capacity: item.capacity,
        color: item.color,
        size: item.size,
        socket: item.socket,
        tdpWatt: item.tdpWatt,
        type: item.type,
        createdAt: item.createdAt,
                productPrices: productPrices.map(pp => {
                  // Lấy supplier ID từ nhiều nguồn khác nhau
                  const supplierObj = pp.supplier as Record<string, unknown> | undefined
                  
                  // Kiểm tra TẤT CẢ các khả năng của supplier ID
                  let supplierId = 0
                  
                  // Thử các field names khác nhau - kiểm tra kỹ từng trường hợp
                  if (pp.supplier_id !== undefined && pp.supplier_id !== null) {
                    supplierId = Number(pp.supplier_id)
                  } else if (pp.supplierId !== undefined && pp.supplierId !== null) {
                    supplierId = Number(pp.supplierId)
                  } else if (pp['supplier_id'] !== undefined && pp['supplier_id'] !== null) {
                    supplierId = Number(pp['supplier_id'])
                  } else if (pp['supplierId'] !== undefined && pp['supplierId'] !== null) {
                    supplierId = Number(pp['supplierId'])
                  } else if (supplierObj) {
                    // Nếu có supplier object, lấy ID từ object đó
                    if (supplierObj.id !== undefined && supplierObj.id !== null) {
                      supplierId = Number(supplierObj.id)
                    } else if (supplierObj.supplierId !== undefined && supplierObj.supplierId !== null) {
                      supplierId = Number(supplierObj.supplierId)
                    } else if (supplierObj.Id !== undefined && supplierObj.Id !== null) {
                      supplierId = Number(supplierObj.Id)
                    } else if (supplierObj.SupplierId !== undefined && supplierObj.SupplierId !== null) {
                      supplierId = Number(supplierObj.SupplierId)
                    }
                  }
                  
                  // Lấy thông tin supplier từ map (nếu có supplier_id)
                  let supplierData: Record<string, unknown> | null = null
                  if (suppliers && supplierId > 0) {
                    supplierData = suppliers.get(supplierId) || null
                  }
                  
                  // Ưu tiên: Nếu supplier object có đầy đủ thông tin, dùng trực tiếp
                  // Sau đó lấy từ map, cuối cùng từ các field khác
                  let finalSupplierName = 'Unknown Supplier'
                  let finalSupplierWebsite = ''
                  
                  if (supplierObj) {
                    // Nếu supplier object đã có đầy đủ thông tin
                    const nameFromObj = supplierObj.name as string || supplierObj.Name as string || ''
                    const websiteFromObj = supplierObj.website as string || supplierObj.Website as string || ''
                    
                    if (nameFromObj) {
                      finalSupplierName = nameFromObj
                      finalSupplierWebsite = websiteFromObj
                    }
                  }
                  
                  // Nếu chưa có, lấy từ map
                  if (finalSupplierName === 'Unknown Supplier' && supplierData) {
                    finalSupplierName = supplierData.name as string || supplierData.Name as string || finalSupplierName
                    finalSupplierWebsite = supplierData.website as string || supplierData.Website as string || finalSupplierWebsite
                  }
                  
                  // Cuối cùng, fallback sang các field khác
                  if (finalSupplierName === 'Unknown Supplier') {
                    finalSupplierName = 
                      pp.supplier_name as string || 
                      pp.supplierName as string || 
                      'Unknown Supplier'
                  }
                  
                  const supplierName = finalSupplierName
                  const supplierWebsite = finalSupplierWebsite
                  
                  // Debug supplier data for Ryzen 9
                  if (item.name?.includes('Ryzen 9') && pp) {
                    console.log('🔍 Processing price:', pp)
                    console.log('🔍 All keys in price:', Object.keys(pp))
                    console.log('🔍 supplier_id:', pp.supplier_id)
                    console.log('🔍 supplierId:', pp.supplierId)
                    console.log('🔍 pp["supplier_id"]:', pp['supplier_id'])
                    console.log('🔍 pp["supplierId"]:', pp['supplierId'])
                    console.log('🔍 supplierObj:', supplierObj)
                    console.log('🔍 supplierId (final):', supplierId)
                    console.log('🔍 Found in map:', !!supplierData)
                    console.log('🔍 supplierData:', supplierData)
                    if (supplierData) {
                      console.log('🔍 supplierData keys:', Object.keys(supplierData))
                      console.log('🔍 supplierData.name:', supplierData.name)
                      console.log('🔍 supplierData.Name:', supplierData.Name)
                    }
                    console.log('🔍 supplierName:', supplierName)
                    if (suppliers) {
                      console.log('🔍 Available supplier IDs in map:', Array.from(suppliers.keys()))
                    }
                  }
                  
                  return {
                    id: Number(pp.id) || 0,
                    supplier: {
                      id: supplierId,
                      name: String(supplierName),
                      website: String(supplierWebsite)
                    },
                    price: Number(pp.price) || 0,
                    supplierLink: String(pp.supplierLink || pp.supplier_link || ''),
                    updatedAt: String(pp.updatedAt || pp.updated_at || '')
                  }
                })
              }
            })
  }

  // Load all products in one API call
  useEffect(() => {
    const loadAllProducts = async () => {
      setLoading(true)
      try {
        console.log('🚀 Loading all products in single API call...')
        
        // Kiểm tra cache trước
        const cacheKey = 'enriched_products_cache'
        const cachedData = localStorage.getItem(cacheKey)
        const cacheAge = 5 * 60 * 1000 // 5 phút
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData)
            const isExpired = Date.now() - parsed.timestamp > cacheAge
            
            if (!isExpired && parsed.products && parsed.suppliers) {
              console.log('⚡ Using cached data for faster loading...')
              setRawApiProducts(parsed.products)
              
              // Tạo suppliers map từ cache
              const suppliers = new Map<number, Record<string, unknown>>()
              parsed.suppliers.forEach((supplier: Record<string, unknown>) => {
                const id = Number(supplier.id)
                if (id > 0) {
                  suppliers.set(id, supplier)
                }
              })
              setSuppliersMap(suppliers)
              
              // Process products từ cache
              const allProducts: PCComponent[] = []
              const counts: { [key: number]: number } = {}
              
              // Initialize counts for all categories
              Object.keys(categoryMap).forEach(categoryId => {
                counts[Number(categoryId)] = 0
              })

              // Process each product and categorize
              parsed.products.forEach((item: Record<string, unknown>) => {
                const categoryId = Number(item.category_id || (item.category as { id?: number })?.id || 0)
                if (categoryId > 0 && categoryMap[categoryId]) {
                  const product = formatDetailedProducts([item], categoryId, suppliers)[0]
                  if (product) {
                    allProducts.push(product)
                    counts[categoryId] = (counts[categoryId] || 0) + 1
                  }
                }
              })

              setProducts(allProducts)
              setLoading(false)
              console.log('✅ Successfully loaded from cache')
              return
            } else {
              console.log('🔄 Cache expired, fetching fresh data...')
            }
          } catch (err) {
            console.warn('⚠️ Failed to parse cache, fetching fresh data:', err)
          }
        }
        
        // Fetch products and suppliers in parallel
        const [allApiProducts, allSuppliers] = await Promise.all([
          Promise.race([
            ApiService.getAllProducts(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Products API timeout')), 25000)
            )
          ]) as Promise<Record<string, unknown>[]>,
          Promise.race([
            ApiService.getAllSuppliers(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Suppliers API timeout')), 15000)
            )
          ]) as Promise<Record<string, unknown>[]>
        ])
        
        console.log(`📦 Loaded ${allApiProducts.length} products in 1 API call`)
        console.log(`🏢 Loaded ${allSuppliers.length} suppliers`)
        
        // Debug: Kiểm tra cấu trúc productPrice từ API
        if (allApiProducts.length > 0) {
          const sampleProduct = allApiProducts.find((p: Record<string, unknown>) => 
            String(p.name || '').includes('Ryzen 9')
          ) as Record<string, unknown> | undefined
          
          if (sampleProduct) {
            console.log('📦 Sample product from API:', {
              name: sampleProduct.name,
              id: sampleProduct.id,
              productPrices: sampleProduct.productPrices,
              productPricesLength: (sampleProduct.productPrices as unknown[])?.length || 0
            })
            
            const prices = sampleProduct.productPrices as Array<Record<string, unknown>> | undefined
            if (prices && prices.length > 0) {
              console.log('📦 First productPrice from API:', prices[0])
              console.log('📦 ProductPrice keys:', Object.keys(prices[0]))
              console.log('📦 ProductPrice FULL JSON:', JSON.stringify(prices[0], null, 2))
              
              // Kiểm tra tất cả các khả năng
              const pp = prices[0]
              console.log('📦 Check all fields:')
              console.log('  - pp.id:', pp.id)
              console.log('  - pp.price:', pp.price)
              console.log('  - pp.supplier:', pp.supplier)
              console.log('  - pp.supplier_id:', pp.supplier_id)
              console.log('  - pp.supplierId:', pp.supplierId)
              console.log('  - pp.SupplierId:', pp.SupplierId)
              console.log('  - pp["supplier_id"]:', pp['supplier_id'])
              console.log('  - pp["supplierId"]:', pp['supplierId'])
              
              // Kiểm tra nested supplier
              if (pp.supplier) {
                const supp = pp.supplier as Record<string, unknown>
                console.log('  - supplier object:', supp)
                console.log('  - supplier.id:', supp.id)
                console.log('  - supplier.name:', supp.name)
              }
            }
          }
        }

        // Create suppliers map for quick lookup
        const suppliers = new Map<number, Record<string, unknown>>()
        allSuppliers.forEach((supplier: Record<string, unknown>) => {
          const id = Number(supplier.id)
          if (id > 0) {
            suppliers.set(id, supplier)
          }
        })
        setSuppliersMap(suppliers)
        
        // Tạo mapping từ supplier endpoint để có thể map price với supplier
        // Vì productPrices chỉ có price, cần fetch từ /api/supplier/{id}/products
        console.log('🔧 Building supplier-product-price mapping...')
        
        const supplierProductMap = new Map<number, Map<number, Record<string, unknown>>>()
        
        // Tối ưu: Chỉ fetch từ một vài suppliers chính để test trước
        // Sau đó có thể mở rộng nếu cần
        try {
          // Dùng TẤT CẢ suppliers để build mapping chính xác theo yêu cầu
          const selectedSuppliers = allSuppliers
          console.log(`🚀 Fetching from ALL ${selectedSuppliers.length} suppliers to build product->supplier map...`)
          
          const supplierProductPromises = selectedSuppliers.map(async (supplier: Record<string, unknown>) => {
            const supplierId = Number(supplier.id)
            if (supplierId > 0) {
              try {
                // Thêm timeout cho mỗi supplier request
                const supplierProducts = await Promise.race([
                  ApiService.getSupplierProducts(supplierId),
                  new Promise<Record<string, unknown>[]>((_, reject) => 
                    setTimeout(() => reject(new Error(`Supplier ${supplierId} timeout`)), 7000)
                  )
                ])
                return { supplierId, products: supplierProducts }
              } catch (err) {
                console.warn(`⚠️ Failed to fetch products for supplier ${supplierId}:`, err)
                return { supplierId, products: [] }
              }
            }
            return { supplierId: 0, products: [] }
          })
          
          const supplierProductsResults = await Promise.all(supplierProductPromises)
          
          // Tạo map: productId -> Map<supplierId, priceInfo>
          supplierProductsResults.forEach(({ supplierId, products }) => {
            if (Array.isArray(products)) {
              products.forEach((sp: Record<string, unknown>) => {
                // API trả về: { productId, productName, price, supplierLink }
                const productId = Number(sp.productId || sp.product_id || sp.id || 0)
                if (productId > 0) {
                  if (!supplierProductMap.has(productId)) {
                    supplierProductMap.set(productId, new Map())
                  }
                  const productMap = supplierProductMap.get(productId)!
                  productMap.set(supplierId, {
                    price: sp.price,
                    supplierLink: sp.supplierLink || sp.supplier_link || '',
                    supplierId: supplierId,
                    productName: sp.productName || sp.name || ''
                  })
                  
                  // Debug log cho supplier đầu tiên
                  if (supplierId === 1 && supplierProductMap.size <= 3) {
                    console.log(`🔗 Mapped: Product ${productId} -> Supplier ${supplierId}, Price: ${sp.price}`)
                  }
                }
              })
            }
          })
          
          // Debug: Log một vài mappings
          if (supplierProductMap.size > 0) {
            const firstProductId = Array.from(supplierProductMap.keys())[0]
            const firstProductMap = supplierProductMap.get(firstProductId)
            console.log(`📊 Sample mapping - Product ${firstProductId}:`, 
              firstProductMap ? Array.from(firstProductMap.entries()) : 'No mapping')
          }
          
          console.log(`✅ Built mapping for ${supplierProductMap.size} products with supplier info`)
        } catch (err) {
          console.error('❌ Error building supplier-product mapping:', err)
        }
        
        // Enrich productPrices từ mapping supplier (thay thế list theo supplier endpoint)
        const enrichedProducts = allApiProducts.map((product: Record<string, unknown>) => {
          const productId = Number(product.id || 0)
          
          if (productId > 0) {
            const priceSupplierMap = supplierProductMap.get(productId)
            if (priceSupplierMap && priceSupplierMap.size > 0) {
              const rebuiltPrices = Array.from(priceSupplierMap.entries()).map(([supplierId, info]) => ({
                id: 0,
                price: Number(info.price || 0),
                supplier_id: supplierId,
                supplierId: supplierId,
                supplierLink: info.supplierLink || '',
                updatedAt: ''
              }))
              return { ...product, productPrices: rebuiltPrices }
            }
          }
          return product
        })
        
        // Log kết quả enrichment
        const enrichedCount = enrichedProducts.filter(p => {
          const prices = p.productPrices as Array<Record<string, unknown>> | undefined
          return prices && prices.some(pp => pp.supplier_id || pp.supplierId)
        }).length
        
        console.log(`✅ Enriched ${enrichedCount}/${allApiProducts.length} products with supplier info`)
        
        // Log sample supplier data
        console.log('🏢 Sample suppliers:', Array.from(suppliers.entries()).slice(0, 3))

        // Store raw API data for later use (dùng enriched products nếu có)
        setRawApiProducts(enrichedProducts.length > 0 ? enrichedProducts : allApiProducts)
        
        // Cache enriched data để không cần fetch lại
        const cacheKey2 = 'enriched_products_cache'
        const cacheData = {
          products: enrichedProducts.length > 0 ? enrichedProducts : allApiProducts,
          suppliers: allSuppliers,
          timestamp: Date.now()
        }
        localStorage.setItem(cacheKey2, JSON.stringify(cacheData))
        console.log('💾 Cached enriched data for faster subsequent loads')

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
              hasSupplier: false, // Sẽ được cập nhật khi load chi tiết
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

  // Load detailed product info when category is selected
  useEffect(() => {
    if (selectedCategory && rawApiProducts.length > 0) {
      const categoryProducts = rawApiProducts.filter((item: ApiProduct) => item.category?.id === selectedCategory)
      if (categoryProducts.length > 0) {
        const detailedProducts = formatDetailedProducts(categoryProducts, selectedCategory, suppliersMap)
        
        // Update products with detailed info
        setProducts(prev => prev.map(product => {
          if (product.categoryId === selectedCategory) {
            const detailedProduct = detailedProducts.find(dp => dp.id === product.id)
            if (detailedProduct) {
              return {
                ...product,
                price: detailedProduct.price,
                hasSupplier: detailedProduct.hasSupplier,
                productPrices: detailedProduct.productPrices
              }
            }
          }
          return product
        }))
      }
    }
  }, [selectedCategory, rawApiProducts, suppliersMap])

  return (
    <div className="page homepage-container">
      <div className="layout">
        <main className="main">
          <section className="hero">
            <div className="tour-welcome" style={{ position: 'relative' }}>
              <h1 className="hero-title">PC Builder</h1>
              <p className="hero-subtitle">Chọn từng linh kiện để xây dựng PC hoàn chỉnh của bạn.</p>
              

              {/* Tour Start Buttons */}

              <div className="tour-start-button" style={{ 
                marginTop: (runTour || tourWaitingForCompletion) ? '16px' : '20px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={startInteractiveTour}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <span>🎯</span>
                  Hướng dẫn tương tác
                </button>
                
                <button
                  onClick={() => setSelectedCategory(1)} // Auto-select CPU
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span>🖥️</span>
                  Chọn CPU ngay
                </button>
              </div>
            </div>
          </section>

          <div style={{ padding: '24px' }}>
            {/* Category Tabs */}
            <div className="tour-categories" style={{ marginBottom: '24px' }}>
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
                
                {/* Top Row - 4 linh kiện trên */}
                <div className="pc-builder-category-tabs" style={{ marginBottom: '12px' }}>
                  {buildCategories.filter(cat => cat.group === 'required-top').map((category) => {
                    const buildComp = buildComponents.find(bc => bc.categoryId === category.id)
                    const isSelected = selectedCategory === category.id
                    const hasComponent = !!buildComp?.component
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`pc-builder-category-card ${isSelected ? 'pc-builder-category-selected' : ''}`}
                        data-category-id={category.id}
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
                
                {/* Bottom Row - 4 linh kiện dưới */}
                <div className="pc-builder-category-tabs">
                  {buildCategories.filter(cat => cat.group === 'required-bottom').map((category) => {
                  const buildComp = buildComponents.find(bc => bc.categoryId === category.id)
                    const isSelected = selectedCategory === category.id
                    const hasComponent = !!buildComp?.component
                  
                  return (
                      <button
                      key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`pc-builder-category-card ${isSelected ? 'pc-builder-category-selected' : ''}`}
                        data-category-id={category.id}
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
                  {buildCategories.filter(cat => cat.group === 'optional').map((category) => {
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
              <div className="tour-search" style={{ marginBottom: '24px' }}>
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
                      <div className="tour-products pc-builder-products-grid">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                            onClick={() => handleProductClick(product)}
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
                                  color: product.price === 'Đang tải...' ? 'rgba(255,255,255,0.5)' : 
                                       product.price === 'Liên hệ' && product.hasSupplier ? '#10b981' : 
                                       product.price === 'Liên hệ' ? 'rgba(255,255,255,0.5)' : '#3b82f6', 
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
              <div className="tour-build-summary pc-builder-build-summary" style={{
                position: 'sticky',
                top: '5px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    Build của bạn
                </h3>
                  
                  {/* Build Progress Bar */}
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '500' }}>
                        📦 Tiến độ Build
                      </span>
                      <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
                        {buildComponents.filter(bc => bc.component).length}/8 linh kiện
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(buildComponents.filter(bc => bc.component).length / 8) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                </div>
                
                
                <div style={{ marginBottom: '16px' }}>
                  {buildComponents.map((buildComp) => {
                    if (!buildComp.component) return null
                    const category = buildCategories.find(c => c.id === buildComp.categoryId)
                    return (
                      <div key={buildComp.categoryId} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
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
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px' }}>
                              {buildComp.component.brand} - {buildComp.component.model}
                            </div>
                            
                            {/* Component-specific recommendations - Simplified */}
                            {(() => {
                              const component = buildComp.component
                              const categoryId = buildComp.categoryId
                              let keyRecommendation = ''
                              
                              // CPU recommendations
                              if (categoryId === 1 && component.tdpWatt && component.tdpWatt > 100) {
                                keyRecommendation = 'CPU hiệu suất cao - cần cooling mạnh'
                              }
                              // RAM recommendations
                              else if (categoryId === 3) {
                                const ramCapacity = parseInt(component.capacity?.replace(/[^\d]/g, '') || '0')
                                if (ramCapacity < 16) {
                                  keyRecommendation = 'RAM 16GB+ khuyến nghị cho gaming'
                                }
                              }
                              // GPU recommendations
                              else if (categoryId === 2 && component.tdpWatt && component.tdpWatt > 200) {
                                keyRecommendation = 'GPU mạnh - cần PSU công suất cao'
                              }
                              // PSU recommendations
                              else if (categoryId === 6) {
                                const psuWattage = parseInt(component.specs?.match(/(\d+)W/)?.[1] || '0')
                                if (psuWattage > 0 && pcSpecs.totalTDP > 0) {
                                  const efficiency = Math.round((psuWattage / (pcSpecs.totalTDP * 1.5)) * 100)
                                  if (efficiency < 80) {
                                    keyRecommendation = 'PSU có thể thiếu - cân nhắc nâng cấp'
                                  }
                                }
                              }
                              // Storage recommendations
                              else if (categoryId === 5) {
                                const storageCapacity = parseInt(component.capacity?.replace(/[^\d]/g, '') || '0')
                                if (storageCapacity < 500) {
                                  keyRecommendation = 'Storage nhỏ - cân nhắc thêm ổ lớn hơn'
                                }
                              }
                              
                              return keyRecommendation ? (
                                <div style={{
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  marginTop: '4px'
                                }}>
                                  <div style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: '10px',
                                    lineHeight: '1.3'
                                  }}>
                                    💡 {keyRecommendation}
                                  </div>
                                </div>
                              ) : null
                            })()}
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                            <div style={{ 
                              color: buildComp.component.price === 'Đang tải...' ? 'rgba(255,255,255,0.5)' : 
                                     buildComp.component.price === 'Liên hệ' && buildComp.component.hasSupplier ? '#10b981' : 
                                     buildComp.component.price === 'Liên hệ' ? 'rgba(255,255,255,0.5)' : '#3b82f6', 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              marginBottom: '4px' 
                            }}>
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
                {/* Build Status Summary */}
                <div style={{
                  background: pcSpecs.compatibilityIssues.length === 0 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)',
                  border: pcSpecs.compatibilityIssues.length === 0 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      color: pcSpecs.compatibilityIssues.length === 0 ? '#10b981' : '#ef4444'
                    }}>
                      {pcSpecs.compatibilityIssues.length === 0 ? '✅' : '⚠️'}
                    </div>
                    <div>
                      <h4 style={{
                        color: pcSpecs.compatibilityIssues.length === 0 ? '#10b981' : '#ef4444',
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {pcSpecs.compatibilityIssues.length === 0 
                          ? 'Build Tương Thích' 
                          : 'Cần Kiểm Tra Tương Thích'}
                      </h4>
                      <p style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '12px',
                        margin: 0
                      }}>
                        {buildComponents.filter(bc => bc.component).length}/8 linh kiện đã chọn
                      </p>
                    </div>
                  </div>
                  
                  {pcSpecs.compatibilityIssues.length === 0 && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <p style={{
                        color: '#10b981',
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: '0 0 8px 0'
                      }}>
                        🎉 Build của bạn đã sẵn sàng!
                      </p>
                      <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '12px',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        Tất cả linh kiện tương thích tốt với nhau. Bạn có thể tiến hành thanh toán!
                      </p>
                    </div>
                  )}
                </div>

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
                    className="tour-pc-summary"
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
                  className="tour-compatibility"
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
                  onClick={() => {
                    try {
                      const selected = buildComponents.filter(b => !!b.component)
                      const components = selected.map(b => {
                        const priceStr = b.component?.price || ''
                        const match = priceStr.match(/^[\d.,]+/)
                        const priceValue = match ? parseInt(match[0].replace(/[.,]/g, '')) : 0
                        return {
                          categoryId: b.categoryId,
                          name: b.component?.name,
                          model: b.component?.model,
                          priceValue
                        }
                      })
                      const payload = { components }
                      localStorage.setItem('ezbuild-checkout', JSON.stringify(payload))
                    } catch {
                      // ignore persistence errors
                    }
                    navigate('/checkout')
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3b82f6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1e3a8a'
                  }}
                >
                        💳 Đặt hàng
                </button>
                
                <button
                  className="tour-checkout"
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
                    marginTop: '8px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#3b82f6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1e3a8a'
                  }}
                  onClick={handleSaveBuild}
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
                onClick={handleComponentPopupClose}
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
                                handleComponentPopupClose()
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
                    handleComponentPopupClose()
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
                    handleComponentPopupClose()
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
                onClick={handleSaveBuild}
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

      {/* Build Completion Popup */}
      {showCompletionPopup && (
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
          zIndex: 10001,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            position: 'relative',
            animation: 'slideInScale 0.5s ease-out'
          }}>
            {/* Success Animation */}
            <div style={{
              fontSize: '80px',
              marginBottom: '20px',
              animation: 'bounce 1s ease-in-out'
            }}>
              🎉
            </div>
            
            <h2 style={{
              color: '#10b981',
              fontSize: '28px',
              fontWeight: 'bold',
              margin: '0 0 16px 0'
            }}>
              Build Hoàn Thành!
            </h2>
            
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              margin: '0 0 24px 0',
              lineHeight: '1.5'
            }}>
              Chúc mừng! Bạn đã chọn đủ <strong style={{ color: '#10b981' }}>6/6</strong> linh kiện bắt buộc.
            </p>
            
            {/* Build Summary */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                color: '#10b981',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                💰 {totalPrice.toLocaleString('vi-VN')} VND
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px'
              }}>
                Tổng giá trị Build
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowCompletionPopup(false)
                  setRunTour(true)
                  setTourStepIndex(2)
                  setTourWaitingForCompletion(false)
                }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                📋 Tiếp tục hướng dẫn
              </button>
              
              <button
                onClick={() => {
                  setShowCompletionPopup(false)
                  setTourWaitingForCompletion(false)
                  setRunTour(false)
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                }}
              >
                Tự do khám phá
              </button>
            </div>
            
            {/* Auto close countdown */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              3
            </div>
          </div>
        </div>
      )}

      {/* Floating Guide Panel */}
      {(runTour || tourWaitingForCompletion) && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '320px',
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          zIndex: 9999,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '24px' }}>
              {tourWaitingForCompletion ? '⏳' : '🎯'}
            </span>
            <div>
              <h3 style={{
                color: '#3b82f6',
                fontSize: '16px',
                fontWeight: '600',
                margin: 0
              }}>
                {tourWaitingForCompletion ? 'Đang chờ hoàn thành...' : 'Hướng dẫn tương tác'}
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '12px',
                margin: 0
              }}>
                {tourWaitingForCompletion ? 'Chọn đủ 6 linh kiện để tiếp tục' : 'Đang hướng dẫn từng bước'}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{
                color: '#10b981',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Tiến độ Build
              </span>
              <span style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {selectedComponentsCount}/8
              </span>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                width: `${(selectedComponentsCount / 6) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.5s ease',
                borderRadius: '4px'
              }} />
            </div>

            {/* Component Status */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              {buildCategories.filter(cat => cat.required).map(category => {
                const buildComp = buildComponents.find(bc => bc.categoryId === category.id)
                const hasComponent = !!buildComp?.component
                return (
                  <div key={category.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    background: hasComponent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    border: hasComponent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{ fontSize: '14px' }}>{category.icon}</span>
                    <span style={{
                      color: hasComponent ? '#10b981' : 'rgba(255,255,255,0.6)',
                      fontSize: '12px',
                      fontWeight: hasComponent ? '600' : '400'
                    }}>
                      {category.name}
                    </span>
                    {hasComponent && (
                      <span style={{
                        color: '#10b981',
                        fontSize: '10px'
                      }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Step Info */}
          {runTour && !tourWaitingForCompletion && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '6px'
              }}>
                Bước hiện tại: {tourStepIndex + 1}/{tourMode === 'guided' ? buildCompleteTourSteps.length : interactiveTourSteps.length}
              </div>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                marginBottom: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${tourProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {tourMode === 'interactive' ? (
                  <>
                    {tourStepIndex === 0 && 'Chọn loại linh kiện CPU'}
                    {tourStepIndex === 1 && 'Chọn sản phẩm CPU cụ thể'}
                    {tourStepIndex === 2 && 'Theo dõi Build của bạn'}
                  </>
                ) : (
                  <>
                    {tourStepIndex === 0 && 'Build của bạn đã hoàn thành!'}
                    {tourStepIndex === 1 && 'Xem thông số PC hoàn chỉnh'}
                    {tourStepIndex === 2 && 'Hoàn thành hướng dẫn!'}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {tourWaitingForCompletion ? (
              <>
                <button
                  onClick={() => {
                    setRunTour(true)
                    setTourStepIndex(2)
                    setTourWaitingForCompletion(false)
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  📋 Xem hướng dẫn Build
                </button>
                <button
                  onClick={() => {
                    setTourWaitingForCompletion(false)
                    setRunTour(false)
                    setTourMode('guided')
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Tắt hướng dẫn
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setRunTour(false)
                  setTourWaitingForCompletion(false)
                  setTourMode('guided')
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Tắt hướng dẫn
              </button>
            )}
          </div>
        </div>
      )}

      {/* Professional Welcome Modal for First-Time Users */}
      {showTourWelcome && !hasSeenTour && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => {
                setShowTourWelcome(false)
                localStorage.setItem('ezbuild-tour-completed', 'true')
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '16px',
                animation: 'bounce 2s infinite'
              }}>
                🚀
              </div>
              <h1 style={{
                color: '#3b82f6',
                fontSize: '28px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Chào mừng đến với EzBuild!
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '16px',
                margin: 0
              }}>
                Trình xây dựng PC chuyên nghiệp và thông minh
              </p>
            </div>

            {/* Features */}
            <div style={{
              marginBottom: '24px'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                textAlign: 'center'
              }}>
                ✨ Tính năng nổi bật
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                {[
                  { icon: '🎯', title: 'Hướng dẫn thông minh', desc: 'Tự động dẫn dắt từng bước' },
                  { icon: '💰', title: 'So sánh giá cả', desc: 'Từ nhiều nhà cung cấp' },
                  { icon: '🔧', title: 'Kiểm tra tương thích', desc: 'Đảm bảo linh kiện phù hợp' },
                  { icon: '📊', title: 'Thông số chi tiết', desc: 'Hiển thị đầy đủ thông tin' }
                ].map((feature, index) => (
                  <div key={index} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{feature.icon}</div>
                    <h4 style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      margin: '0 0 4px 0'
                    }}>
                      {feature.title}
                    </h4>
                    <p style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '12px',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowTourWelcome(false)
                  setTourMode('sequential')
                  setSequentialTourActive(true)
                  setCurrentComponentTour(1) // Start with CPU
                  setSelectedCategory(1)
                  setRunTour(true)
                  setTourStepIndex(0)
                }}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                🎯 Hướng dẫn từng linh kiện
              </button>
              <button
                onClick={() => {
                  setShowTourWelcome(false)
                  localStorage.setItem('ezbuild-tour-completed', 'true')
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                }}
              >
                🚀 Khám phá tự do
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Joyride Tour Component */}
      <Joyride
        steps={getCurrentTourSteps()}
        run={runTour && !tourPaused && !tourWaitingForCompletion}
        stepIndex={tourStepIndex}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        disableOverlayClose={tourMode === 'interactive' && !tourPaused}
        disableScrolling={false}
        scrollOffset={100}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            backgroundColor: '#1f2937',
            textColor: '#ffffff',
            arrowColor: '#1f2937',
            overlayColor: 'rgba(0, 0, 0, 0.8)',
            spotlightShadow: '0 0 15px rgba(59, 130, 246, 0.5)',
            width: 400,
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 12,
            fontSize: 16,
            padding: 20,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltipTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#3b82f6',
            marginBottom: 12,
          },
          tooltipContent: {
            fontSize: 14,
            lineHeight: 1.6,
            color: '#ffffff',
          },
          tooltipFooter: {
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: '600',
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
          },
          buttonBack: {
            marginRight: 10,
            color: '#9ca3af',
            fontSize: 14,
          },
          buttonSkip: {
            color: '#9ca3af',
            fontSize: 14,
          },
          buttonClose: {
            display: 'none',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
          spotlight: {
            borderRadius: 12,
          },
          beacon: {
            accentColor: '#3b82f6',
          },
        }}
        locale={{
          back: 'Quay lại',
          close: 'Đóng',
          last: 'Hoàn thành',
          next: 'Tiếp theo',
          skip: 'Bỏ qua',
        }}
      />
    </div>
  )
}

export default PCBuilderPage
