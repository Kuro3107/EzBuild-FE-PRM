import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface KeyboardItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    switchType: string
    layout: string
    connectivity: string
    keycaps: string
    backlight: string
    dimensions: string
    weight: string
    cable: string
    warranty: string
    rgb: boolean
    wireless: boolean
    gaming: boolean
    mechanical: boolean
  }
  features: string[]
  rating: number
  reviews: number
  inStock: boolean
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

function KeyboardPage() {
  const navigate = useNavigate()
  const [selectedKeyboard, setSelectedKeyboard] = useState<KeyboardItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSwitchTypes, setSelectedSwitchTypes] = useState<string[]>([])
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([])
  const [selectedConnectivities, setSelectedConnectivities] = useState<string[]>([])
  const [selectedKeycaps, setSelectedKeycaps] = useState<string[]>([])
  const [selectedBacklights, setSelectedBacklights] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRGB, setSelectedRGB] = useState<boolean | null>(null)
  const [selectedWireless, setSelectedWireless] = useState<boolean | null>(null)
  const [selectedGaming, setSelectedGaming] = useState<boolean | null>(null)
  const [selectedMechanical, setSelectedMechanical] = useState<boolean | null>(null)
  
  // Popup states
  const [showSwitchTypePopup, setShowSwitchTypePopup] = useState(false)
  const [showLayoutPopup, setShowLayoutPopup] = useState(false)
  const [showConnectivityPopup, setShowConnectivityPopup] = useState(false)
  const [showKeycapsPopup, setShowKeycapsPopup] = useState(false)
  const [showBacklightPopup, setShowBacklightPopup] = useState(false)
  const [showBrandPopup, setShowBrandPopup] = useState(false)
  
  // Search terms for popups
  const [switchTypeSearch, setSwitchTypeSearch] = useState('')
  const [layoutSearch, setLayoutSearch] = useState('')
  const [connectivitySearch, setConnectivitySearch] = useState('')
  const [keycapsSearch, setKeycapsSearch] = useState('')
  const [backlightSearch, setBacklightSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  // API states
  const [keyboards, setKeyboards] = useState<KeyboardItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch Keyboards from API (category_id = 10)
  useEffect(() => {
    const fetchKeyboards = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(10)

        const formatted: KeyboardItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')
          const switchMatch = specsString.match(/(Cherry|Gateron|Kailh|Razer|Logitech|SteelSeries|OPX|OmniPoint|ROG NX)[^,]*/i)
          const layoutMatch = specsString.match(/(Full Size|TKL|60%|65%|75%|96%)/i)
          const connMatch = specsString.match(/(Wired|Wireless|Bluetooth)/i)
          const backlightMatch = specsString.match(/(RGB|White|None)/i)

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
          
          // Debug log để kiểm tra dữ liệu
          console.log(`Keyboard: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown Keyboard',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              switchType: switchMatch ? switchMatch[0] : 'Mechanical',
              layout: layoutMatch ? layoutMatch[1] : 'Full Size',
              connectivity: connMatch ? connMatch[1] : 'Wired',
              keycaps: 'Unknown',
              backlight: backlightMatch ? backlightMatch[1] : 'None',
              dimensions: 'Unknown',
              weight: 'Unknown',
              cable: 'Unknown',
              warranty: 'Unknown',
              rgb: /RGB/i.test(backlightMatch?.[1] || ''),
              wireless: /Wireless|Bluetooth/i.test(connMatch?.[1] || ''),
              gaming: true,
              mechanical: true
            },
            features: ['Unknown'],
            rating: 4.0,
            reviews: 0,
            inStock: true,
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

        setKeyboards(formatted)
      } catch (err) {
        console.error('Error fetching Keyboards:', err)
        setKeyboards([])
      } finally {
        setLoading(false)
      }
    }

    fetchKeyboards()
  }, [])

  const allKeyboards = keyboards

  // Filter logic
  const filteredKeyboards = allKeyboards.filter((keyboardItem) => {
    // Price filter - parse min price từ price range string
    if (keyboardItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = keyboardItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !keyboardItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !keyboardItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Switch type filter
    if (selectedSwitchTypes.length > 0 && !selectedSwitchTypes.some(switchType => keyboardItem.specs.switchType.includes(switchType))) {
      return false
    }

    // Layout filter
    if (selectedLayouts.length > 0 && !selectedLayouts.includes(keyboardItem.specs.layout)) {
      return false
    }

    // Connectivity filter
    if (selectedConnectivities.length > 0 && !selectedConnectivities.includes(keyboardItem.specs.connectivity)) {
      return false
    }

    // Keycaps filter
    if (selectedKeycaps.length > 0 && !selectedKeycaps.some(keycap => keyboardItem.specs.keycaps.includes(keycap))) {
      return false
    }

    // Backlight filter
    if (selectedBacklights.length > 0 && !selectedBacklights.includes(keyboardItem.specs.backlight)) {
      return false
    }

    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(keyboardItem.brand)) {
      return false
    }

    // RGB filter
    if (selectedRGB !== null && keyboardItem.specs.rgb !== selectedRGB) {
      return false
    }

    // Wireless filter
    if (selectedWireless !== null && keyboardItem.specs.wireless !== selectedWireless) {
      return false
    }

    // Gaming filter
    if (selectedGaming !== null && keyboardItem.specs.gaming !== selectedGaming) {
      return false
    }

    // Mechanical filter
    if (selectedMechanical !== null && keyboardItem.specs.mechanical !== selectedMechanical) {
      return false
    }

    return true
  })

  const handleSwitchTypeChange = (switchType: string) => {
    setSelectedSwitchTypes(prev => 
      prev.includes(switchType) 
        ? prev.filter(s => s !== switchType)
        : [...prev, switchType]
    )
  }

  const handleLayoutChange = (layout: string) => {
    setSelectedLayouts(prev => 
      prev.includes(layout) 
        ? prev.filter(l => l !== layout)
        : [...prev, layout]
    )
  }

  const handleConnectivityChange = (connectivity: string) => {
    setSelectedConnectivities(prev => 
      prev.includes(connectivity) 
        ? prev.filter(c => c !== connectivity)
        : [...prev, connectivity]
    )
  }

  const handleKeycapsChange = (keycaps: string) => {
    setSelectedKeycaps(prev => 
      prev.includes(keycaps) 
        ? prev.filter(k => k !== keycaps)
        : [...prev, keycaps]
    )
  }

  const handleBacklightChange = (backlight: string) => {
    setSelectedBacklights(prev => 
      prev.includes(backlight) 
        ? prev.filter(b => b !== backlight)
        : [...prev, backlight]
    )
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const handleRGBChange = (value: boolean) => {
    setSelectedRGB(prev => prev === value ? null : value)
  }

  const handleWirelessChange = (value: boolean) => {
    setSelectedWireless(prev => prev === value ? null : value)
  }

  const handleGamingChange = (value: boolean) => {
    setSelectedGaming(prev => prev === value ? null : value)
  }

  const handleMechanicalChange = (value: boolean) => {
    setSelectedMechanical(prev => prev === value ? null : value)
  }

  // Popup component
  const FilterPopup = ({ 
    isOpen, 
    onClose, 
    title, 
    searchTerm, 
    onSearchChange, 
    options, 
    selectedItems, 
    onItemChange 
  }: {
    isOpen: boolean
    onClose: () => void
    title: string
    searchTerm: string
    onSearchChange: (value: string) => void
    options: string[]
    selectedItems: string[]
    onItemChange: (item: string) => void
  }) => {
    if (!isOpen) return null

    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="p-4 overflow-y-auto max-h-96">
            <div className="space-y-2">
              {filteredOptions.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(option)}
                    onChange={() => onItemChange(option)}
                    className="rounded"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page bg-grid bg-radial">
      <div className="layout">
        {/* Main */}
        <main className="main">
          {/* Breadcrumb + controls */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Products</span>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="font-medium text-white">Keyboard</span>
            </div>
            <div className="flex items-center gap-3">
              <select className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm border border-white/20">
                <option>Default</option>
              </select>
              <input 
                type="text" 
                placeholder="Search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm w-48 border border-white/20 placeholder-white/60" 
              />
            </div>
          </div>

          <div className="flex">
            {/* Filters */}
            <div className="w-80 hidden md:block pr-6">
              <div className="rounded-lg border border-white/20 bg-white/10 p-4 space-y-6">
                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Price Range</h3>
                  <PriceRangeSlider
                    value={priceRange}
                    onChange={setPriceRange}
                    min={500000}
                    max={50000000}
                    step={100000}
                    currency="VND"
                  />
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Switch Type</h3>
                  <div className="space-y-2 text-sm">
                    {['Cherry MX','Gateron','Kailh','Razer','Logitech','SteelSeries'].map((switchType) => (
                      <label key={switchType} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedSwitchTypes.includes(switchType)}
                          onChange={() => handleSwitchTypeChange(switchType)}
                          className="rounded" 
                        />
                        <span>{switchType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowSwitchTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Layout</h3>
                  <div className="space-y-2 text-sm">
                    {['Full Size','TKL','60%','65%','75%','96%'].map((layout) => (
                      <label key={layout} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedLayouts.includes(layout)}
                          onChange={() => handleLayoutChange(layout)}
                          className="rounded" 
                        />
                        <span>{layout}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowLayoutPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Connectivity</h3>
                  <div className="space-y-2 text-sm">
                    {['Wired','Wireless','Bluetooth'].map((connectivity) => (
                      <label key={connectivity} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedConnectivities.includes(connectivity)}
                          onChange={() => handleConnectivityChange(connectivity)}
                          className="rounded" 
                        />
                        <span>{connectivity}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowConnectivityPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Keycaps</h3>
                  <div className="space-y-2 text-sm">
                    {['ABS','PBT','Double-shot','Low-profile'].map((keycaps) => (
                      <label key={keycaps} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedKeycaps.includes(keycaps)}
                          onChange={() => handleKeycapsChange(keycaps)}
                          className="rounded" 
                        />
                        <span>{keycaps}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowKeycapsPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Backlight</h3>
                  <div className="space-y-2 text-sm">
                    {['None','White','RGB'].map((backlight) => (
                      <label key={backlight} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedBacklights.includes(backlight)}
                          onChange={() => handleBacklightChange(backlight)}
                          className="rounded" 
                        />
                        <span>{backlight}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowBacklightPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Brand</h3>
                  <div className="space-y-2 text-sm">
                    {['Corsair','Razer','Logitech','SteelSeries','Keychron','ASUS'].map((brand) => (
                      <label key={brand} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandChange(brand)}
                          className="rounded" 
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowBrandPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">RGB</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedRGB === true}
                        onChange={() => handleRGBChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedRGB === false}
                        onChange={() => handleRGBChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Wireless</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedWireless === true}
                        onChange={() => handleWirelessChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedWireless === false}
                        onChange={() => handleWirelessChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Gaming</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedGaming === true}
                        onChange={() => handleGamingChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedGaming === false}
                        onChange={() => handleGamingChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Mechanical</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedMechanical === true}
                        onChange={() => handleMechanicalChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedMechanical === false}
                        onChange={() => handleMechanicalChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu Keyboard...</div>
                </div>
              )}

              {filteredKeyboards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {keyboards.length === 0 ? 'Không có Keyboard nào trong database' : 'Không tìm thấy Keyboard nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {keyboards.length === 0 ? 'Vui lòng thêm Keyboard vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                </div>
              ) : (
                <div className="product-grid">
                  {filteredKeyboards.map((keyboardItem) => (
                    <div key={keyboardItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/keyboard/${keyboardItem.id}`)}>
                      <div className="p-4">
                        <img src={keyboardItem.image} alt={keyboardItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{keyboardItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {keyboardItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Switch:</span><span className="text-white">{keyboardItem.specs.switchType}</span></div>
                          <div className="flex justify-between"><span>Layout:</span><span className="text-white">{keyboardItem.specs.layout}</span></div>
                          <div className="flex justify-between"><span>Connectivity:</span><span className="text-white">{keyboardItem.specs.connectivity}</span></div>
                          <div className="flex justify-between"><span>Keycaps:</span><span className="text-white">{keyboardItem.specs.keycaps}</span></div>
                          <div className="flex justify-between"><span>Backlight:</span><span className="text-white">{keyboardItem.specs.backlight}</span></div>
                        </div>
                        <button className="w-full btn-primary">+ Add to build</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Product Detail Modal */}
      {selectedKeyboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedKeyboard.name}</h2>
                  <p className="text-lg text-white/70">{selectedKeyboard.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedKeyboard(null)}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <img
                    src={selectedKeyboard.image}
                    alt={selectedKeyboard.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedKeyboard.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedKeyboard.productPrices && selectedKeyboard.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedKeyboard.productPrices
                          .sort((a, b) => a.price - b.price)
                          .map((priceInfo, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex-1">
                                <div className="text-white font-medium">
                                  {priceInfo.supplier.name}
                                </div>
                                <div className="text-white/60 text-sm">
                                  ID: {priceInfo.supplier.id}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-green-400 font-bold">
                                  {priceInfo.price.toLocaleString('vi-VN')} VND
                                </div>
                                {priceInfo.supplierLink && (
                                  <a 
                                    href={priceInfo.supplierLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 text-sm hover:text-blue-300"
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
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Specifications</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedKeyboard.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-white/60 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-white">{value.toString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedKeyboard.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        selectedKeyboard.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedKeyboard.inStock}
                    >
                      {selectedKeyboard.inStock ? 'Add to Build' : 'Out of Stock'}
                    </button>
                    <button className="flex-1 border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Popups */}
      <FilterPopup
        isOpen={showSwitchTypePopup}
        onClose={() => setShowSwitchTypePopup(false)}
        title="Switch Type"
        searchTerm={switchTypeSearch}
        onSearchChange={setSwitchTypeSearch}
        options={['Cherry MX Red','Cherry MX Blue','Cherry MX Brown','Cherry MX Black','Cherry MX Silver','Gateron Red','Gateron Blue','Gateron Brown','Gateron Black','Kailh Red','Kailh Blue','Kailh Brown','Razer Green','Razer Yellow','Razer Orange','Logitech GL','SteelSeries QX2','OPX Optical','OmniPoint 2.0','ROG NX']}
        selectedItems={selectedSwitchTypes}
        onItemChange={handleSwitchTypeChange}
      />

      <FilterPopup
        isOpen={showLayoutPopup}
        onClose={() => setShowLayoutPopup(false)}
        title="Layout"
        searchTerm={layoutSearch}
        onSearchChange={setLayoutSearch}
        options={['Full Size','TKL','60%','65%','75%','80%','96%','1800','Compact','Ergonomic','Split']}
        selectedItems={selectedLayouts}
        onItemChange={handleLayoutChange}
      />

      <FilterPopup
        isOpen={showConnectivityPopup}
        onClose={() => setShowConnectivityPopup(false)}
        title="Connectivity"
        searchTerm={connectivitySearch}
        onSearchChange={setConnectivitySearch}
        options={['Wired','Wireless','Bluetooth','USB-C','USB-A','2.4GHz','RF','Dongle']}
        selectedItems={selectedConnectivities}
        onItemChange={handleConnectivityChange}
      />

      <FilterPopup
        isOpen={showKeycapsPopup}
        onClose={() => setShowKeycapsPopup(false)}
        title="Keycaps"
        searchTerm={keycapsSearch}
        onSearchChange={setKeycapsSearch}
        options={['ABS','PBT','Double-shot','Low-profile','High-profile','OEM','Cherry','SA','DSA','XDA','MDA','KAT','MT3']}
        selectedItems={selectedKeycaps}
        onItemChange={handleKeycapsChange}
      />

      <FilterPopup
        isOpen={showBacklightPopup}
        onClose={() => setShowBacklightPopup(false)}
        title="Backlight"
        searchTerm={backlightSearch}
        onSearchChange={setBacklightSearch}
        options={['None','White','Blue','Red','Green','RGB','Per-key RGB','Zone RGB','Static','Breathing','Wave','Rainbow']}
        selectedItems={selectedBacklights}
        onItemChange={handleBacklightChange}
      />

      <FilterPopup
        isOpen={showBrandPopup}
        onClose={() => setShowBrandPopup(false)}
        title="Brand"
        searchTerm={brandSearch}
        onSearchChange={setBrandSearch}
        options={['Corsair','Razer','Logitech','SteelSeries','Keychron','ASUS','HyperX','Cooler Master','Ducky','Varmilo','Leopold','Filco','Das Keyboard','Glorious','Drop','Akko','Royal Kludge']}
        selectedItems={selectedBrands}
        onItemChange={handleBrandChange}
      />
    </div>
  )
}

export default KeyboardPage
