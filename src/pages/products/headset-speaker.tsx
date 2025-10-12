import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface HeadsetSpeakerItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    type: string
    connectivity: string
    frequencyResponse: string
    impedance: string
    sensitivity: string
    microphone: boolean
    wireless: boolean
    rgb: boolean
    drivers: string
    noiseCancellation: boolean
    batteryLife: string
    weight: string
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

function HeadsetSpeakerPage() {
  const navigate = useNavigate()
  const [selectedHeadsetSpeaker, setSelectedHeadsetSpeaker] = useState<HeadsetSpeakerItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedConnectivities, setSelectedConnectivities] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedWireless, setSelectedWireless] = useState<boolean | null>(null)
  const [selectedMicrophone, setSelectedMicrophone] = useState<boolean | null>(null)
  const [selectedRGB, setSelectedRGB] = useState<boolean | null>(null)
  const [selectedNoiseCancellation, setSelectedNoiseCancellation] = useState<boolean | null>(null)
  
  // Popup states
  const [showTypePopup, setShowTypePopup] = useState(false)
  const [showConnectivityPopup, setShowConnectivityPopup] = useState(false)
  const [showBrandPopup, setShowBrandPopup] = useState(false)
  
  // Search terms for popups
  const [typeSearch, setTypeSearch] = useState('')
  const [connectivitySearch, setConnectivitySearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  
  // API states
  const [headsetSpeakers, setHeadsetSpeakers] = useState<HeadsetSpeakerItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch Headset/Speakers from API (category_id = 12)
  useEffect(() => {
    const fetchHeadsetSpeakers = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(12)

        const formatted: HeadsetSpeakerItem[] = (products || []).map((item: Record<string, unknown>) => {
          const typeField = item.type
          const connectivityField = item.connectivity
          const driversField = item.drivers
          const impedanceField = item.impedance
          const sensitivityField = item.sensitivity
          const frequencyResponseField = item.frequency_response ?? item.frequencyResponse
          const batteryLifeField = item.battery_life ?? item.batteryLife
          const weightField = item.weight

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
          console.log(`HeadsetSpeaker: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown Headset/Speaker',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || item.imageUrl1 || 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop'),
            specs: {
              type: typeField ? String(typeField).toUpperCase() : 'Unknown',
              connectivity: connectivityField ? String(connectivityField).toUpperCase() : 'Unknown',
              frequencyResponse: frequencyResponseField ? String(frequencyResponseField) : 'Unknown',
              impedance: impedanceField ? String(impedanceField) : 'Unknown',
              sensitivity: sensitivityField ? String(sensitivityField) : 'Unknown',
              microphone: Boolean(item.microphone ?? false),
              wireless: Boolean(item.wireless ?? false),
              rgb: Boolean(item.rgb ?? false),
              drivers: driversField ? String(driversField) : 'Unknown',
              noiseCancellation: Boolean(item.noise_cancellation ?? item.noiseCancellation ?? false),
              batteryLife: batteryLifeField ? String(batteryLifeField) : 'Unknown',
              weight: weightField ? String(weightField) : 'Unknown'
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

        setHeadsetSpeakers(formatted)
      } catch (err) {
        console.error('Error fetching Headset/Speakers:', err)
        setHeadsetSpeakers([])
      } finally {
        setLoading(false)
      }
    }

    fetchHeadsetSpeakers()
  }, [])

  // Dữ liệu từ API
  const allHeadsetSpeakers = headsetSpeakers

  // Filter logic
  const filteredHeadsetSpeakers = allHeadsetSpeakers.filter((headsetSpeakerItem) => {
    // Price filter - parse min price từ price range string
    if (headsetSpeakerItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = headsetSpeakerItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !headsetSpeakerItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !headsetSpeakerItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(headsetSpeakerItem.specs.type)) {
      return false
    }

    // Connectivity filter
    if (selectedConnectivities.length > 0 && !selectedConnectivities.includes(headsetSpeakerItem.specs.connectivity)) {
      return false
    }

    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(headsetSpeakerItem.brand)) {
      return false
    }

    // Wireless filter
    if (selectedWireless !== null && headsetSpeakerItem.specs.wireless !== selectedWireless) {
      return false
    }

    // Microphone filter
    if (selectedMicrophone !== null && headsetSpeakerItem.specs.microphone !== selectedMicrophone) {
      return false
    }

    // RGB filter
    if (selectedRGB !== null && headsetSpeakerItem.specs.rgb !== selectedRGB) {
      return false
    }

    // Noise cancellation filter
    if (selectedNoiseCancellation !== null && headsetSpeakerItem.specs.noiseCancellation !== selectedNoiseCancellation) {
      return false
    }

    return true
  })

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleConnectivityChange = (connectivity: string) => {
    setSelectedConnectivities(prev => 
      prev.includes(connectivity) 
        ? prev.filter(c => c !== connectivity)
        : [...prev, connectivity]
    )
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const handleWirelessChange = (value: boolean) => {
    setSelectedWireless(prev => prev === value ? null : value)
  }

  const handleMicrophoneChange = (value: boolean) => {
    setSelectedMicrophone(prev => prev === value ? null : value)
  }

  const handleRGBChange = (value: boolean) => {
    setSelectedRGB(prev => prev === value ? null : value)
  }

  const handleNoiseCancellationChange = (value: boolean) => {
    setSelectedNoiseCancellation(prev => prev === value ? null : value)
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
              <span className="font-medium text-white">Headset/Speaker</span>
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
                  <h3 className="text-base font-semibold mb-3 text-white">Type</h3>
                  <div className="space-y-2 text-sm">
                    {['HEADPHONE','HEADSET','SPEAKER','EARPHONE'].map((type) => (
                      <label key={type} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeChange(type)}
                          className="rounded" 
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Connectivity</h3>
                  <div className="space-y-2 text-sm">
                    {['WIRED','WIRELESS','BLUETOOTH','USB','3.5MM'].map((connectivity) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Brand</h3>
                  <div className="space-y-2 text-sm">
                    {['Logitech','SteelSeries','Corsair','Razer','HyperX'].map((brand) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Microphone</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedMicrophone === true}
                        onChange={() => handleMicrophoneChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedMicrophone === false}
                        onChange={() => handleMicrophoneChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">RGB Lighting</h3>
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
                  <h3 className="text-base font-semibold mb-3 text-white">Noise Cancellation</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedNoiseCancellation === true}
                        onChange={() => handleNoiseCancellationChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedNoiseCancellation === false}
                        onChange={() => handleNoiseCancellationChange(false)}
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
                  <div className="text-lg text-white/70">Đang tải dữ liệu Headset/Speaker...</div>
                </div>
              )}

              {filteredHeadsetSpeakers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {headsetSpeakers.length === 0 ? 'Không có Headset/Speaker nào trong database' : 'Không tìm thấy Headset/Speaker nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {headsetSpeakers.length === 0 ? 'Vui lòng thêm Headset/Speaker vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {headsetSpeakers.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedTypes([])
                        setSelectedConnectivities([])
                        setSelectedBrands([])
                        setSelectedWireless(null)
                        setSelectedMicrophone(null)
                        setSelectedRGB(null)
                        setSelectedNoiseCancellation(null)
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
                  {filteredHeadsetSpeakers.map((headsetSpeakerItem) => (
                    <div key={headsetSpeakerItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/headset-speaker/${headsetSpeakerItem.id}`)}>
                      <div className="p-4">
                        <img src={headsetSpeakerItem.image} alt={headsetSpeakerItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{headsetSpeakerItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {headsetSpeakerItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Type:</span><span className="text-white">{headsetSpeakerItem.specs.type}</span></div>
                          <div className="flex justify-between"><span>Connectivity:</span><span className="text-white">{headsetSpeakerItem.specs.connectivity}</span></div>
                          <div className="flex justify-between"><span>Wireless:</span><span className="text-white">{headsetSpeakerItem.specs.wireless ? 'Yes' : 'No'}</span></div>
                          <div className="flex justify-between"><span>Microphone:</span><span className="text-white">{headsetSpeakerItem.specs.microphone ? 'Yes' : 'No'}</span></div>
                          <div className="flex justify-between"><span>Drivers:</span><span className="text-white">{headsetSpeakerItem.specs.drivers}</span></div>
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
      {selectedHeadsetSpeaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedHeadsetSpeaker.name}</h2>
                  <p className="text-lg text-white/70">{selectedHeadsetSpeaker.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedHeadsetSpeaker(null)}
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
                    src={selectedHeadsetSpeaker.image}
                    alt={selectedHeadsetSpeaker.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedHeadsetSpeaker.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedHeadsetSpeaker.productPrices && selectedHeadsetSpeaker.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedHeadsetSpeaker.productPrices
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
                      {Object.entries(selectedHeadsetSpeaker.specs).map(([key, value]) => (
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
                      {selectedHeadsetSpeaker.features.map((feature, index) => (
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
                        selectedHeadsetSpeaker.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedHeadsetSpeaker.inStock}
                    >
                      {selectedHeadsetSpeaker.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showTypePopup}
        onClose={() => setShowTypePopup(false)}
        title="Type"
        searchTerm={typeSearch}
        onSearchChange={setTypeSearch}
        options={['HEADPHONE','HEADSET','SPEAKER','EARPHONE','GAMING_HEADSET','STUDIO_MONITOR','BLUETOOTH_SPEAKER','WIRED_SPEAKER']}
        selectedItems={selectedTypes}
        onItemChange={handleTypeChange}
      />

      <FilterPopup
        isOpen={showConnectivityPopup}
        onClose={() => setShowConnectivityPopup(false)}
        title="Connectivity"
        searchTerm={connectivitySearch}
        onSearchChange={setConnectivitySearch}
        options={['WIRED','WIRELESS','BLUETOOTH','USB','3.5MM','USB-C','OPTICAL','RCA','XLR']}
        selectedItems={selectedConnectivities}
        onItemChange={handleConnectivityChange}
      />

      <FilterPopup
        isOpen={showBrandPopup}
        onClose={() => setShowBrandPopup(false)}
        title="Brand"
        searchTerm={brandSearch}
        onSearchChange={setBrandSearch}
        options={['Logitech','SteelSeries','Corsair','Razer','HyperX','Audio-Technica','Sennheiser','Beyerdynamic','AKG','Shure','Sony','Bose','JBL','Creative','ASUS','MSI','Gigabyte']}
        selectedItems={selectedBrands}
        onItemChange={handleBrandChange}
      />
    </div>
  )
}

export default HeadsetSpeakerPage
