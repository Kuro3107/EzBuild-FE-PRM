import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface GPUItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    series: string
    memory: string
    memoryType: string
    baseClock: string
    boostClock: string
    powerConsumption: string
    interface: string
    displayPorts: string
    hdmiPorts: string
    length: string
    width: string
    height: string
    cooling: string
    rgb: boolean
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

function GPUPage() {
  const navigate = useNavigate()
  const [selectedGPU, setSelectedGPU] = useState<GPUItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string[]>([])
  const [selectedMemory, setSelectedMemory] = useState<string[]>([])
  const [selectedMemoryTypes, setSelectedMemoryTypes] = useState<string[]>([])
  const [selectedBaseClocks, setSelectedBaseClocks] = useState<string[]>([])
  const [selectedBoostClocks, setSelectedBoostClocks] = useState<string[]>([])
  const [selectedPowerConsumption, setSelectedPowerConsumption] = useState<string[]>([])
  const [selectedInterface, setSelectedInterface] = useState<string[]>([])
  const [selectedCooling, setSelectedCooling] = useState<string[]>([])
  const [selectedRGB, setSelectedRGB] = useState<boolean | null>(null)
  
  // API states
  const [gpus, setGpus] = useState<GPUItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Popup states
  const [showBrandPopup, setShowBrandPopup] = useState(false)
  const [showSeriesPopup, setShowSeriesPopup] = useState(false)
  const [showMemoryPopup, setShowMemoryPopup] = useState(false)
  const [showMemoryTypePopup, setShowMemoryTypePopup] = useState(false)
  const [showBaseClockPopup, setShowBaseClockPopup] = useState(false)
  const [showBoostClockPopup, setShowBoostClockPopup] = useState(false)
  const [showPowerConsumptionPopup, setShowPowerConsumptionPopup] = useState(false)
  const [showInterfacePopup, setShowInterfacePopup] = useState(false)
  const [showCoolingPopup, setShowCoolingPopup] = useState(false)
  
  // Search terms for popups
  const [brandSearch, setBrandSearch] = useState('')
  const [seriesSearch, setSeriesSearch] = useState('')
  const [memorySearch, setMemorySearch] = useState('')
  const [memoryTypeSearch, setMemoryTypeSearch] = useState('')
  const [baseClockSearch, setBaseClockSearch] = useState('')
  const [boostClockSearch, setBoostClockSearch] = useState('')
  const [powerConsumptionSearch, setPowerConsumptionSearch] = useState('')
  const [interfaceSearch, setInterfaceSearch] = useState('')
  const [coolingSearch, setCoolingSearch] = useState('')

  // Kiểu dữ liệu trả về từ backend cho GPU
  interface GPUApiProduct {
    id?: number
    name?: string
    brand?: string
    model?: string
    specs?: string
    tdp_watt?: number
    image_url1?: string
    display_ports?: string
    hdmi_ports?: string
    size?: string | number
    width?: string | number
    height?: string | number
    cooling?: string
    rgb?: boolean
    category_id?: number
    productPrices?: Array<{ price: number }>
  }

  // Fetch GPUs from API (category_id = 2)
  useEffect(() => {
    const fetchGPUs = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(2)

        const formatted: GPUItem[] = (products || []).map((item: GPUApiProduct) => {
          const specsString = String(item.specs || '')
          const baseClockMatch = specsString.match(/base\s*(\d+\.?\d*)\s*(MHz|GHz)/i) || specsString.match(/(\d+\.?\d*)\s*(MHz|GHz)\s*base/i)
          const boostClockMatch = specsString.match(/boost\s*(\d+\.?\d*)\s*(MHz|GHz)/i)
          const memoryMatch = specsString.match(/(\d+)\s*GB/i)
          const memoryTypeMatch = specsString.match(/GDDR\dX?|HBM2e?|HBM/i)
          const interfaceMatch = specsString.match(/PCIe\s*[\d.]*\s*x\s*\d+/i) || specsString.match(/PCIe\s*x\s*\d+/i)

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
          console.log(`GPU: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown GPU',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              // Dùng cột model làm series nếu có
              series: String(item.model || 'Unknown'),
              memory: memoryMatch ? `${memoryMatch[1]}GB`.toUpperCase() : 'Unknown',
              memoryType: memoryTypeMatch ? memoryTypeMatch[0].toUpperCase() : 'Unknown',
              baseClock: baseClockMatch ? `${baseClockMatch[1]} ${baseClockMatch[2].toUpperCase()}` : 'Unknown',
              boostClock: boostClockMatch ? `${boostClockMatch[1]} ${boostClockMatch[2].toUpperCase()}` : 'Unknown',
              powerConsumption: `${Number(item.tdp_watt) || 0}W`,
              interface: interfaceMatch ? interfaceMatch[0].replace(/\s+/g, ' ').toUpperCase() : 'PCIe X16',
              displayPorts: String(item.display_ports || 'Unknown'),
              hdmiPorts: String(item.hdmi_ports || 'Unknown'),
              length: String(item.size || 'Unknown'),
              width: String(item.width || 'Unknown'),
              height: String(item.height || 'Unknown'),
              cooling: String(item.cooling || 'Unknown'),
              rgb: Boolean(item.rgb ?? true)
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

        setGpus(formatted)
      } catch (err) {
        console.error('Error fetching GPUs:', err)
        setGpus([])
      } finally {
        setLoading(false)
      }
    }

    fetchGPUs()
  }, [])

  // Dữ liệu sử dụng từ API
  const allGPUs = gpus

  // Filter logic
  const filteredGPUs = allGPUs.filter((gpuItem) => {
    // Price filter - parse min price từ price range string
    if (gpuItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = gpuItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !gpuItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !gpuItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(gpuItem.brand)) {
      return false
    }

    // Series filter
    if (selectedSeries.length > 0 && !selectedSeries.includes(gpuItem.specs.series)) {
      return false
    }

    // Memory filter
    if (selectedMemory.length > 0 && !selectedMemory.includes(gpuItem.specs.memory)) {
      return false
    }

    // Memory type filter
    if (selectedMemoryTypes.length > 0 && !selectedMemoryTypes.includes(gpuItem.specs.memoryType)) {
      return false
    }

    // Base clock filter
    if (selectedBaseClocks.length > 0 && !selectedBaseClocks.includes(gpuItem.specs.baseClock)) {
      return false
    }

    // Boost clock filter
    if (selectedBoostClocks.length > 0 && !selectedBoostClocks.includes(gpuItem.specs.boostClock)) {
      return false
    }

    // Power consumption filter
    if (selectedPowerConsumption.length > 0 && !selectedPowerConsumption.includes(gpuItem.specs.powerConsumption)) {
      return false
    }

    // Interface filter
    if (selectedInterface.length > 0 && !selectedInterface.includes(gpuItem.specs.interface)) {
      return false
    }

    // Cooling filter
    if (selectedCooling.length > 0 && !selectedCooling.includes(gpuItem.specs.cooling)) {
      return false
    }

    // RGB filter
    if (selectedRGB !== null && gpuItem.specs.rgb !== selectedRGB) {
      return false
    }

    return true
  })

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const handleSeriesChange = (series: string) => {
    setSelectedSeries(prev => 
      prev.includes(series) 
        ? prev.filter(s => s !== series)
        : [...prev, series]
    )
  }

  const handleMemoryChange = (memory: string) => {
    setSelectedMemory(prev => 
      prev.includes(memory) 
        ? prev.filter(m => m !== memory)
        : [...prev, memory]
    )
  }

  const handleMemoryTypeChange = (memoryType: string) => {
    setSelectedMemoryTypes(prev => 
      prev.includes(memoryType) 
        ? prev.filter(m => m !== memoryType)
        : [...prev, memoryType]
    )
  }

  const handleBaseClockChange = (clock: string) => {
    setSelectedBaseClocks(prev => 
      prev.includes(clock) 
        ? prev.filter(c => c !== clock)
        : [...prev, clock]
    )
  }

  const handleBoostClockChange = (clock: string) => {
    setSelectedBoostClocks(prev => 
      prev.includes(clock) 
        ? prev.filter(c => c !== clock)
        : [...prev, clock]
    )
  }

  const handlePowerConsumptionChange = (power: string) => {
    setSelectedPowerConsumption(prev => 
      prev.includes(power) 
        ? prev.filter(p => p !== power)
        : [...prev, power]
    )
  }

  const handleInterfaceChange = (interfaceType: string) => {
    setSelectedInterface(prev => 
      prev.includes(interfaceType) 
        ? prev.filter(i => i !== interfaceType)
        : [...prev, interfaceType]
    )
  }

  const handleCoolingChange = (cooling: string) => {
    setSelectedCooling(prev => 
      prev.includes(cooling) 
        ? prev.filter(c => c !== cooling)
        : [...prev, cooling]
    )
  }

  const handleRGBChange = (value: boolean) => {
    setSelectedRGB(prev => prev === value ? null : value)
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
    <div className="page homepage-container">
      <div className="layout">
        <main className="main">
          {/* Breadcrumb + controls */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Products</span>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="font-medium text-white">GPU</span>
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
                  <h3 className="text-base font-semibold mb-3 text-white">Brand</h3>
                  <div className="space-y-2 text-sm">
                    {['NVIDIA','AMD'].map((brand) => (
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
                  <h3 className="text-base font-semibold mb-3">Series</h3>
                  <div className="space-y-2 text-sm">
                    {['RTX 40 Series','RX 7000 Series'].map((series) => (
                      <label key={series} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedSeries.includes(series)}
                          onChange={() => handleSeriesChange(series)}
                          className="rounded" 
                        />
                        <span>{series}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowSeriesPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Memory</h3>
                  <div className="space-y-2 text-sm">
                    {['12GB','16GB','24GB'].map((memory) => (
                      <label key={memory} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedMemory.includes(memory)}
                          onChange={() => handleMemoryChange(memory)}
                          className="rounded" 
                        />
                        <span>{memory}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowMemoryPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Memory Type</h3>
                  <div className="space-y-2 text-sm">
                    {['GDDR6','GDDR6X'].map((memoryType) => (
                      <label key={memoryType} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedMemoryTypes.includes(memoryType)}
                          onChange={() => handleMemoryTypeChange(memoryType)}
                          className="rounded" 
                        />
                        <span>{memoryType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowMemoryTypePopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Base Clock</h3>
                  <div className="space-y-2 text-sm">
                    {['1800 MHz','1900 MHz','1920 MHz','2210 MHz','2230 MHz','2470 MHz'].map((clock) => (
                      <label key={clock} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedBaseClocks.includes(clock)}
                          onChange={() => handleBaseClockChange(clock)}
                          className="rounded" 
                        />
                        <span>{clock}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowBaseClockPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Boost Clock</h3>
                  <div className="space-y-2 text-sm">
                    {['2430 MHz','2475 MHz','2500 MHz','2505 MHz','2520 MHz','2755 MHz'].map((clock) => (
                      <label key={clock} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedBoostClocks.includes(clock)}
                          onChange={() => handleBoostClockChange(clock)}
                          className="rounded" 
                        />
                        <span>{clock}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowBoostClockPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Power Consumption</h3>
                  <div className="space-y-2 text-sm">
                    {['190W','200W','263W','320W','355W','450W'].map((power) => (
                      <label key={power} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedPowerConsumption.includes(power)}
                          onChange={() => handlePowerConsumptionChange(power)}
                          className="rounded" 
                        />
                        <span>{power}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowPowerConsumptionPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Interface</h3>
                  <div className="space-y-2 text-sm">
                    {['PCIe 4.0 x16'].map((interfaceType) => (
                      <label key={interfaceType} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedInterface.includes(interfaceType)}
                          onChange={() => handleInterfaceChange(interfaceType)}
                          className="rounded" 
                        />
                        <span>{interfaceType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowInterfacePopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">Cooling</h3>
                  <div className="space-y-2 text-sm">
                    {['Dual Fan','Triple Fan'].map((cooling) => (
                      <label key={cooling} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedCooling.includes(cooling)}
                          onChange={() => handleCoolingChange(cooling)}
                          className="rounded" 
                        />
                        <span>{cooling}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowCoolingPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">RGB</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedRGB === true}
                        onChange={() => handleRGBChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
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
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu GPU...</div>
                </div>
              )}

              {filteredGPUs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {gpus.length === 0 ? 'Không có GPU nào trong database' : 'Không tìm thấy GPU nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {gpus.length === 0 ? 'Vui lòng thêm GPU vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {gpus.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedBrands([])
                        setSelectedSeries([])
                        setSelectedMemory([])
                        setSelectedMemoryTypes([])
                        setSelectedBaseClocks([])
                        setSelectedBoostClocks([])
                        setSelectedPowerConsumption([])
                        setSelectedInterface([])
                        setSelectedCooling([])
                        setSelectedRGB(null)
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
                  {filteredGPUs.map((gpuItem) => (
                    <div key={gpuItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/gpu/${gpuItem.id}`)}>
                      <div className="p-4">
                        <img src={gpuItem.image} alt={gpuItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{gpuItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {gpuItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Series:</span><span className="text-white">{gpuItem.specs.series}</span></div>
                          <div className="flex justify-between"><span>Memory:</span><span className="text-white">{gpuItem.specs.memory}</span></div>
                          <div className="flex justify-between"><span>Base Clock:</span><span className="text-white">{gpuItem.specs.baseClock}</span></div>
                          <div className="flex justify-between"><span>Boost Clock:</span><span className="text-white">{gpuItem.specs.boostClock}</span></div>
                          <div className="flex justify-between"><span>Power:</span><span className="text-white">{gpuItem.specs.powerConsumption}</span></div>
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
      {selectedGPU && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedGPU.name}</h2>
                  <p className="text-lg text-white/70">{selectedGPU.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedGPU(null)}
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
                    src={selectedGPU.image}
                    alt={selectedGPU.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedGPU.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedGPU.productPrices && selectedGPU.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedGPU.productPrices
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
                      {Object.entries(selectedGPU.specs).map(([key, value]) => (
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
                      {selectedGPU.features.map((feature, index) => (
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
                        selectedGPU.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedGPU.inStock}
                    >
                      {selectedGPU.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showBrandPopup}
        onClose={() => setShowBrandPopup(false)}
        title="Brand"
        searchTerm={brandSearch}
        onSearchChange={setBrandSearch}
        options={['NVIDIA','AMD','ASUS','MSI','Gigabyte','EVGA','Sapphire','PowerColor','XFX']}
        selectedItems={selectedBrands}
        onItemChange={handleBrandChange}
      />

      <FilterPopup
        isOpen={showSeriesPopup}
        onClose={() => setShowSeriesPopup(false)}
        title="Series"
        searchTerm={seriesSearch}
        onSearchChange={setSeriesSearch}
        options={['RTX 40 Series','RTX 30 Series','RTX 20 Series','GTX 16 Series','RX 7000 Series','RX 6000 Series','RX 5000 Series']}
        selectedItems={selectedSeries}
        onItemChange={handleSeriesChange}
      />

      <FilterPopup
        isOpen={showMemoryPopup}
        onClose={() => setShowMemoryPopup(false)}
        title="Memory"
        searchTerm={memorySearch}
        onSearchChange={setMemorySearch}
        options={['4GB','6GB','8GB','10GB','12GB','16GB','20GB','24GB']}
        selectedItems={selectedMemory}
        onItemChange={handleMemoryChange}
      />

      <FilterPopup
        isOpen={showMemoryTypePopup}
        onClose={() => setShowMemoryTypePopup(false)}
        title="Memory Type"
        searchTerm={memoryTypeSearch}
        onSearchChange={setMemoryTypeSearch}
        options={['GDDR5','GDDR6','GDDR6X','HBM2','HBM2e']}
        selectedItems={selectedMemoryTypes}
        onItemChange={handleMemoryTypeChange}
      />

      <FilterPopup
        isOpen={showBaseClockPopup}
        onClose={() => setShowBaseClockPopup(false)}
        title="Base Clock"
        searchTerm={baseClockSearch}
        onSearchChange={setBaseClockSearch}
        options={['1200 MHz','1300 MHz','1400 MHz','1500 MHz','1600 MHz','1700 MHz','1800 MHz','1900 MHz','2000 MHz','2100 MHz','2200 MHz','2300 MHz','2400 MHz','2500 MHz']}
        selectedItems={selectedBaseClocks}
        onItemChange={handleBaseClockChange}
      />

      <FilterPopup
        isOpen={showBoostClockPopup}
        onClose={() => setShowBoostClockPopup(false)}
        title="Boost Clock"
        searchTerm={boostClockSearch}
        onSearchChange={setBoostClockSearch}
        options={['1500 MHz','1600 MHz','1700 MHz','1800 MHz','1900 MHz','2000 MHz','2100 MHz','2200 MHz','2300 MHz','2400 MHz','2500 MHz','2600 MHz','2700 MHz','2800 MHz']}
        selectedItems={selectedBoostClocks}
        onItemChange={handleBoostClockChange}
      />

      <FilterPopup
        isOpen={showPowerConsumptionPopup}
        onClose={() => setShowPowerConsumptionPopup(false)}
        title="Power Consumption"
        searchTerm={powerConsumptionSearch}
        onSearchChange={setPowerConsumptionSearch}
        options={['75W','100W','120W','150W','175W','200W','225W','250W','275W','300W','320W','350W','375W','400W','450W','500W']}
        selectedItems={selectedPowerConsumption}
        onItemChange={handlePowerConsumptionChange}
      />

      <FilterPopup
        isOpen={showInterfacePopup}
        onClose={() => setShowInterfacePopup(false)}
        title="Interface"
        searchTerm={interfaceSearch}
        onSearchChange={setInterfaceSearch}
        options={['PCIe 3.0 x16','PCIe 4.0 x16','PCIe 5.0 x16']}
        selectedItems={selectedInterface}
        onItemChange={handleInterfaceChange}
      />

      <FilterPopup
        isOpen={showCoolingPopup}
        onClose={() => setShowCoolingPopup(false)}
        title="Cooling"
        searchTerm={coolingSearch}
        onSearchChange={setCoolingSearch}
        options={['Single Fan','Dual Fan','Triple Fan','Liquid Cooling','Blower Style']}
        selectedItems={selectedCooling}
        onItemChange={handleCoolingChange}
      />
    </div>
  )
}

export default GPUPage