import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface MouseItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    dpi: string
    sensorType: string
    connectivity: string
    buttons: string
    weight: string
    dimensions: string
    battery: string
    pollingRate: string
    acceleration: string
    warranty: string
    rgb: boolean
    gaming: boolean
    wireless: boolean
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

function MousePage() {
  const navigate = useNavigate()
  const [selectedMouse, setSelectedMouse] = useState<MouseItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDPIs, setSelectedDPIs] = useState<string[]>([])
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<string[]>([])
  const [selectedConnectivities, setSelectedConnectivities] = useState<string[]>([])
  const [selectedButtons, setSelectedButtons] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRGB, setSelectedRGB] = useState<boolean | null>(null)
  const [selectedGaming, setSelectedGaming] = useState<boolean | null>(null)
  const [selectedWireless, setSelectedWireless] = useState<boolean | null>(null)
  
  // Popup states
  const [showDPIPopup, setShowDPIPopup] = useState(false)
  const [showSensorTypePopup, setShowSensorTypePopup] = useState(false)
  const [showConnectivityPopup, setShowConnectivityPopup] = useState(false)
  const [showButtonsPopup, setShowButtonsPopup] = useState(false)
  const [showBrandPopup, setShowBrandPopup] = useState(false)
  
  // Search terms for popups
  const [dpiSearch, setDpiSearch] = useState('')
  const [sensorTypeSearch, setSensorTypeSearch] = useState('')
  const [connectivitySearch, setConnectivitySearch] = useState('')
  const [buttonsSearch, setButtonsSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')

  // API states
  const [mice, setMice] = useState<MouseItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch Mice from API (category_id = 11)
  useEffect(() => {
    const fetchMice = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(11)

        const formatted: MouseItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')
          const dpiMatch = specsString.match(/(\d{3,5},?\d{0,3})\s*DPI/i)
          const sensorMatch = specsString.match(/(Optical|Laser)/i)
          const connMatch = specsString.match(/(Wired|Wireless|Bluetooth)/i)
          const buttonsMatch = specsString.match(/(\d{1,2})\s*buttons?/i)
          const weightMatch = specsString.match(/(\d+\.?\d*)\s*g/i)

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
          console.log(`Mouse: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown Mouse',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              dpi: dpiMatch ? `${dpiMatch[1]} DPI` : 'Unknown',
              sensorType: sensorMatch ? sensorMatch[1] : 'Optical',
              connectivity: connMatch ? connMatch[1] : 'Wired',
              buttons: buttonsMatch ? buttonsMatch[1] : '5',
              weight: weightMatch ? `${weightMatch[1]}g` : 'Unknown',
              dimensions: 'Unknown',
              battery: 'Unknown',
              pollingRate: '1000Hz',
              acceleration: 'Unknown',
              warranty: 'Unknown',
              rgb: true,
              gaming: true,
              wireless: /Wireless|Bluetooth/i.test(connMatch?.[1] || '')
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

        setMice(formatted)
      } catch (err) {
        console.error('Error fetching Mice:', err)
        setMice([])
      } finally {
        setLoading(false)
      }
    }

    fetchMice()
  }, [])

  const allMice = mice

  // Filter logic
  const filteredMice = allMice.filter((mouseItem) => {
    // Price filter - parse min price từ price range string
    if (mouseItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = mouseItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !mouseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !mouseItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // DPI filter
    if (selectedDPIs.length > 0 && !selectedDPIs.includes(mouseItem.specs.dpi)) {
      return false
    }

    // Sensor type filter
    if (selectedSensorTypes.length > 0 && !selectedSensorTypes.includes(mouseItem.specs.sensorType)) {
      return false
    }

    // Connectivity filter
    if (selectedConnectivities.length > 0 && !selectedConnectivities.includes(mouseItem.specs.connectivity)) {
      return false
    }

    // Buttons filter
    if (selectedButtons.length > 0 && !selectedButtons.includes(mouseItem.specs.buttons)) {
      return false
    }

    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(mouseItem.brand)) {
      return false
    }

    // RGB filter
    if (selectedRGB !== null && mouseItem.specs.rgb !== selectedRGB) {
      return false
    }

    // Gaming filter
    if (selectedGaming !== null && mouseItem.specs.gaming !== selectedGaming) {
      return false
    }

    // Wireless filter
    if (selectedWireless !== null && mouseItem.specs.wireless !== selectedWireless) {
      return false
    }

    return true
  })

  const handleDPIChange = (dpi: string) => {
    setSelectedDPIs(prev => 
      prev.includes(dpi) 
        ? prev.filter(d => d !== dpi)
        : [...prev, dpi]
    )
  }

  const handleSensorTypeChange = (sensorType: string) => {
    setSelectedSensorTypes(prev => 
      prev.includes(sensorType) 
        ? prev.filter(s => s !== sensorType)
        : [...prev, sensorType]
    )
  }

  const handleConnectivityChange = (connectivity: string) => {
    setSelectedConnectivities(prev => 
      prev.includes(connectivity) 
        ? prev.filter(c => c !== connectivity)
        : [...prev, connectivity]
    )
  }

  const handleButtonsChange = (buttons: string) => {
    setSelectedButtons(prev => 
      prev.includes(buttons) 
        ? prev.filter(b => b !== buttons)
        : [...prev, buttons]
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

  const handleGamingChange = (value: boolean) => {
    setSelectedGaming(prev => prev === value ? null : value)
  }

  const handleWirelessChange = (value: boolean) => {
    setSelectedWireless(prev => prev === value ? null : value)
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
              <span className="font-medium text-white">Mouse</span>
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
                  <h3 className="text-base font-semibold mb-3 text-white">DPI</h3>
                  <div className="space-y-2 text-sm">
                    {['12,000 DPI','16,000 DPI','18,000 DPI','19,000 DPI','25,600 DPI','30,000 DPI'].map((dpi) => (
                      <label key={dpi} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedDPIs.includes(dpi)}
                          onChange={() => handleDPIChange(dpi)}
                          className="rounded" 
                        />
                        <span>{dpi}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowDPIPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Sensor Type</h3>
                  <div className="space-y-2 text-sm">
                    {['Optical'].map((sensorType) => (
                      <label key={sensorType} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedSensorTypes.includes(sensorType)}
                          onChange={() => handleSensorTypeChange(sensorType)}
                          className="rounded" 
                        />
                        <span>{sensorType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowSensorTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Connectivity</h3>
                  <div className="space-y-2 text-sm">
                    {['Wired','Wireless'].map((connectivity) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Buttons</h3>
                  <div className="space-y-2 text-sm">
                    {['5','6','7','8'].map((buttons) => (
                      <label key={buttons} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedButtons.includes(buttons)}
                          onChange={() => handleButtonsChange(buttons)}
                          className="rounded" 
                        />
                        <span>{buttons}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowButtonsPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Brand</h3>
                  <div className="space-y-2 text-sm">
                    {['Logitech','Razer','Corsair','SteelSeries','Microsoft','ASUS'].map((brand) => (
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
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu Mouse...</div>
                </div>
              )}

              {filteredMice.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {mice.length === 0 ? 'Không có Mouse nào trong database' : 'Không tìm thấy Mouse nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {mice.length === 0 ? 'Vui lòng thêm Mouse vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {mice.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedDPIs([])
                        setSelectedSensorTypes([])
                        setSelectedConnectivities([])
                        setSelectedButtons([])
                        setSelectedBrands([])
                        setSelectedRGB(null)
                        setSelectedGaming(null)
                        setSelectedWireless(null)
                        setPriceRange([500000, 50000000])
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <div className="product-grid">
                  {filteredMice.map((mouseItem) => (
                    <div key={mouseItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/mouse/${mouseItem.id}`)}>
                      <div className="p-4">
                        <img src={mouseItem.image} alt={mouseItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{mouseItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {mouseItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>DPI:</span><span className="text-white">{mouseItem.specs.dpi}</span></div>
                          <div className="flex justify-between"><span>Sensor:</span><span className="text-white">{mouseItem.specs.sensorType}</span></div>
                          <div className="flex justify-between"><span>Connectivity:</span><span className="text-white">{mouseItem.specs.connectivity}</span></div>
                          <div className="flex justify-between"><span>Buttons:</span><span className="text-white">{mouseItem.specs.buttons}</span></div>
                          <div className="flex justify-between"><span>Weight:</span><span className="text-white">{mouseItem.specs.weight}</span></div>
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
      {selectedMouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedMouse.name}</h2>
                  <p className="text-lg text-white/70">{selectedMouse.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedMouse(null)}
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
                    src={selectedMouse.image}
                    alt={selectedMouse.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedMouse.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedMouse.productPrices && selectedMouse.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedMouse.productPrices
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
                      {Object.entries(selectedMouse.specs).map(([key, value]) => (
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
                      {selectedMouse.features.map((feature, index) => (
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
                        selectedMouse.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedMouse.inStock}
                    >
                      {selectedMouse.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showDPIPopup}
        onClose={() => setShowDPIPopup(false)}
        title="DPI"
        searchTerm={dpiSearch}
        onSearchChange={setDpiSearch}
        options={['400 DPI','800 DPI','1000 DPI','1600 DPI','3200 DPI','6400 DPI','8000 DPI','12,000 DPI','16,000 DPI','18,000 DPI','19,000 DPI','25,600 DPI','30,000 DPI','32,000 DPI']}
        selectedItems={selectedDPIs}
        onItemChange={handleDPIChange}
      />

      <FilterPopup
        isOpen={showSensorTypePopup}
        onClose={() => setShowSensorTypePopup(false)}
        title="Sensor Type"
        searchTerm={sensorTypeSearch}
        onSearchChange={setSensorTypeSearch}
        options={['Optical','Laser','Trackball','Touchpad']}
        selectedItems={selectedSensorTypes}
        onItemChange={handleSensorTypeChange}
      />

      <FilterPopup
        isOpen={showConnectivityPopup}
        onClose={() => setShowConnectivityPopup(false)}
        title="Connectivity"
        searchTerm={connectivitySearch}
        onSearchChange={setConnectivitySearch}
        options={['Wired','Wireless','Bluetooth','USB-C','USB-A','2.4GHz','RF']}
        selectedItems={selectedConnectivities}
        onItemChange={handleConnectivityChange}
      />

      <FilterPopup
        isOpen={showButtonsPopup}
        onClose={() => setShowButtonsPopup(false)}
        title="Buttons"
        searchTerm={buttonsSearch}
        onSearchChange={setButtonsSearch}
        options={['2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20']}
        selectedItems={selectedButtons}
        onItemChange={handleButtonsChange}
      />

      <FilterPopup
        isOpen={showBrandPopup}
        onClose={() => setShowBrandPopup(false)}
        title="Brand"
        searchTerm={brandSearch}
        onSearchChange={setBrandSearch}
        options={['Logitech','Razer','Corsair','SteelSeries','Microsoft','ASUS','HyperX','BenQ','ROCCAT','Glorious','Finalmouse','Pulsar','Vaxee','Zowie']}
        selectedItems={selectedBrands}
        onItemChange={handleBrandChange}
      />
    </div>
  )
}

export default MousePage
