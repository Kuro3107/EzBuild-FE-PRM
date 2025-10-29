import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface PSUItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    wattage: string
    efficiency: string
    modular: string
    formFactor: string
    certification: string
    fanSize: string
    fanType: string
    connectors: string
    dimensions: string
    weight: string
    warranty: string
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

function PSUPage() {
  const navigate = useNavigate()
  const [selectedPSU, setSelectedPSU] = useState<PSUItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWattages, setSelectedWattages] = useState<string[]>([])
  const [selectedEfficiencies, setSelectedEfficiencies] = useState<string[]>([])
  const [selectedModulars, setSelectedModulars] = useState<string[]>([])
  const [selectedFormFactors, setSelectedFormFactors] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedFanSizes, setSelectedFanSizes] = useState<string[]>([])
  const [selectedFanTypes, setSelectedFanTypes] = useState<string[]>([])
  const [selectedRGB, setSelectedRGB] = useState<boolean | null>(null)
  
  // Popup states
  const [showWattagePopup, setShowWattagePopup] = useState(false)
  const [showEfficiencyPopup, setShowEfficiencyPopup] = useState(false)
  const [showModularPopup, setShowModularPopup] = useState(false)
  const [showFormFactorPopup, setShowFormFactorPopup] = useState(false)
  const [showCertificationPopup, setShowCertificationPopup] = useState(false)
  const [showBrandPopup, setShowBrandPopup] = useState(false)
  const [showFanSizePopup, setShowFanSizePopup] = useState(false)
  const [showFanTypePopup, setShowFanTypePopup] = useState(false)
  
  // Search terms for popups
  const [wattageSearch, setWattageSearch] = useState('')
  const [efficiencySearch, setEfficiencySearch] = useState('')
  const [modularSearch, setModularSearch] = useState('')
  const [formFactorSearch, setFormFactorSearch] = useState('')
  const [certificationSearch, setCertificationSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [fanSizeSearch, setFanSizeSearch] = useState('')
  const [fanTypeSearch, setFanTypeSearch] = useState('')
  // API states
  const [psus, setPsus] = useState<PSUItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch PSUs from API (category_id = 6)
  useEffect(() => {
    const fetchPSUs = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(6)

        const formatted: PSUItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')
          const wattMatch = specsString.match(/(\d{3,4})\s*W/i)
          const effMatch = specsString.match(/80\+\s*(Bronze|Silver|Gold|Platinum|Titanium)/i)
          const modularMatch = specsString.match(/(Non-Modular|Semi-Modular|Fully Modular)/i)
          const fanSizeMatch = specsString.match(/(120mm|135mm|140mm)/i)

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
          console.log(`PSU: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown PSU',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || item.imageUrl1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              wattage: wattMatch ? `${wattMatch[1]}W` : 'Unknown',
              efficiency: effMatch ? `80+ ${effMatch[1]}` : 'Unknown',
              modular: modularMatch ? modularMatch[1] : 'Unknown',
              formFactor: 'ATX',
              certification: effMatch ? `80+ ${effMatch[1]}` : 'Unknown',
              fanSize: fanSizeMatch ? fanSizeMatch[1] : '120mm',
              fanType: 'Unknown',
              connectors: 'Unknown',
              dimensions: 'Unknown',
              weight: 'Unknown',
              warranty: 'Unknown',
              rgb: false
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

        setPsus(formatted)
      } catch (err) {
        console.error('Error fetching PSUs:', err)
        setPsus([])
      } finally {
        setLoading(false)
      }
    }

    fetchPSUs()
  }, [])

  const allPSUs = psus

  // Filter logic
  const filteredPSUs = allPSUs.filter((psuItem) => {
    // Price filter - parse min price từ price range string
    if (psuItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = psuItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !psuItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !psuItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Wattage filter
    if (selectedWattages.length > 0 && !selectedWattages.includes(psuItem.specs.wattage)) {
      return false
    }

    // Efficiency filter
    if (selectedEfficiencies.length > 0 && !selectedEfficiencies.includes(psuItem.specs.efficiency)) {
      return false
    }

    // Modular filter
    if (selectedModulars.length > 0 && !selectedModulars.includes(psuItem.specs.modular)) {
      return false
    }

    // Form factor filter
    if (selectedFormFactors.length > 0 && !selectedFormFactors.includes(psuItem.specs.formFactor)) {
      return false
    }

    // Certification filter
    if (selectedCertifications.length > 0 && !selectedCertifications.includes(psuItem.specs.certification)) {
      return false
    }

    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(psuItem.brand)) {
      return false
    }

    // Fan size filter
    if (selectedFanSizes.length > 0 && !selectedFanSizes.includes(psuItem.specs.fanSize)) {
      return false
    }

    // Fan type filter
    if (selectedFanTypes.length > 0 && !selectedFanTypes.includes(psuItem.specs.fanType)) {
      return false
    }

    // RGB filter
    if (selectedRGB !== null && psuItem.specs.rgb !== selectedRGB) {
      return false
    }

    return true
  })

  const handleWattageChange = (wattage: string) => {
    setSelectedWattages(prev => 
      prev.includes(wattage) 
        ? prev.filter(w => w !== wattage)
        : [...prev, wattage]
    )
  }

  const handleEfficiencyChange = (efficiency: string) => {
    setSelectedEfficiencies(prev => 
      prev.includes(efficiency) 
        ? prev.filter(e => e !== efficiency)
        : [...prev, efficiency]
    )
  }

  const handleModularChange = (modular: string) => {
    setSelectedModulars(prev => 
      prev.includes(modular) 
        ? prev.filter(m => m !== modular)
        : [...prev, modular]
    )
  }

  const handleFormFactorChange = (formFactor: string) => {
    setSelectedFormFactors(prev => 
      prev.includes(formFactor) 
        ? prev.filter(f => f !== formFactor)
        : [...prev, formFactor]
    )
  }

  const handleCertificationChange = (certification: string) => {
    setSelectedCertifications(prev => 
      prev.includes(certification) 
        ? prev.filter(c => c !== certification)
        : [...prev, certification]
    )
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const handleFanSizeChange = (fanSize: string) => {
    setSelectedFanSizes(prev => 
      prev.includes(fanSize) 
        ? prev.filter(f => f !== fanSize)
        : [...prev, fanSize]
    )
  }

  const handleFanTypeChange = (fanType: string) => {
    setSelectedFanTypes(prev => 
      prev.includes(fanType) 
        ? prev.filter(f => f !== fanType)
        : [...prev, fanType]
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

        {/* Main */}
        <main className="main">
          {/* Breadcrumb + controls */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Products</span>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="font-medium text-white">Power Supply</span>
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
              <div className="rounded-lg border border-white/20 bg.white/10 p-4 space-y-6">
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
                  <h3 className="text-base font-semibold mb-3 text-white">Wattage</h3>
                  <div className="space-y-2 text-sm">
                    {['550W','650W','750W','850W','1000W','1200W'].map((wattage) => (
                      <label key={wattage} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedWattages.includes(wattage)}
                          onChange={() => handleWattageChange(wattage)}
                          className="rounded" 
                        />
                        <span>{wattage}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowWattagePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Efficiency</h3>
                  <div className="space-y-2 text-sm">
                    {['80+ Gold','80+ Platinum'].map((efficiency) => (
                      <label key={efficiency} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedEfficiencies.includes(efficiency)}
                          onChange={() => handleEfficiencyChange(efficiency)}
                          className="rounded" 
                        />
                        <span>{efficiency}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowEfficiencyPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Modular</h3>
                  <div className="space-y-2 text-sm">
                    {['Non-Modular','Semi-Modular','Fully Modular'].map((modular) => (
                      <label key={modular} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedModulars.includes(modular)}
                          onChange={() => handleModularChange(modular)}
                          className="rounded" 
                        />
                        <span>{modular}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowModularPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Form Factor</h3>
                  <div className="space-y-2 text-sm">
                    {['ATX'].map((formFactor) => (
                      <label key={formFactor} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedFormFactors.includes(formFactor)}
                          onChange={() => handleFormFactorChange(formFactor)}
                          className="rounded" 
                        />
                        <span>{formFactor}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowFormFactorPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Certification</h3>
                  <div className="space-y-2 text-sm">
                    {['80+ Gold','80+ Platinum'].map((certification) => (
                      <label key={certification} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedCertifications.includes(certification)}
                          onChange={() => handleCertificationChange(certification)}
                          className="rounded" 
                        />
                        <span>{certification}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowCertificationPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Brand</h3>
                  <div className="space-y-2 text-sm">
                    {['Corsair','EVGA','Seasonic','Thermaltake','Cooler Master','ASUS'].map((brand) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Fan Size</h3>
                  <div className="space-y-2 text-sm">
                    {['120mm','135mm','140mm'].map((fanSize) => (
                      <label key={fanSize} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedFanSizes.includes(fanSize)}
                          onChange={() => handleFanSizeChange(fanSize)}
                          className="rounded" 
                        />
                        <span>{fanSize}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowFanSizePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Fan Type</h3>
                  <div className="space-y-2 text-sm">
                    {['Sleeve Bearing','Fluid Dynamic Bearing'].map((fanType) => (
                      <label key={fanType} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedFanTypes.includes(fanType)}
                          onChange={() => handleFanTypeChange(fanType)}
                          className="rounded" 
                        />
                        <span>{fanType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowFanTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text white">RGB</h3>
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
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu PSU...</div>
                </div>
              )}

              {filteredPSUs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {psus.length === 0 ? 'Không có PSU nào trong database' : 'Không tìm thấy PSU nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {psus.length === 0 ? 'Vui lòng thêm PSU vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {psus.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedWattages([])
                        setSelectedEfficiencies([])
                        setSelectedModulars([])
                        setSelectedFormFactors([])
                        setSelectedCertifications([])
                        setSelectedBrands([])
                        setSelectedFanSizes([])
                        setSelectedFanTypes([])
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
                  {filteredPSUs.map((psuItem) => (
                    <div key={psuItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/psu/${psuItem.id}`)}>
                      <div className="p-4">
                        <img src={psuItem.image} alt={psuItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{psuItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {psuItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Wattage:</span><span className="text-white">{psuItem.specs.wattage}</span></div>
                          <div className="flex justify-between"><span>Efficiency:</span><span className="text-white">{psuItem.specs.efficiency}</span></div>
                          <div className="flex justify-between"><span>Modular:</span><span className="text-white">{psuItem.specs.modular}</span></div>
                          <div className="flex justify-between"><span>Form Factor:</span><span className="text-white">{psuItem.specs.formFactor}</span></div>
                          <div className="flex justify-between"><span>Fan Size:</span><span className="text-white">{psuItem.specs.fanSize}</span></div>
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
      {selectedPSU && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedPSU.name}</h2>
                  <p className="text-lg text-white/70">{selectedPSU.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedPSU(null)}
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
                    src={selectedPSU.image}
                    alt={selectedPSU.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedPSU.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedPSU.productPrices && selectedPSU.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedPSU.productPrices
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
                      {Object.entries(selectedPSU.specs).map(([key, value]) => (
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
                      {selectedPSU.features.map((feature, index) => (
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
                        selectedPSU.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedPSU.inStock}
                    >
                      {selectedPSU.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showWattagePopup}
        onClose={() => setShowWattagePopup(false)}
        title="Wattage"
        searchTerm={wattageSearch}
        onSearchChange={setWattageSearch}
        options={['300W','350W','400W','450W','500W','550W','600W','650W','700W','750W','800W','850W','900W','950W','1000W','1050W','1100W','1200W','1300W','1500W','1600W']}
        selectedItems={selectedWattages}
        onItemChange={handleWattageChange}
      />

      <FilterPopup
        isOpen={showEfficiencyPopup}
        onClose={() => setShowEfficiencyPopup(false)}
        title="Efficiency"
        searchTerm={efficiencySearch}
        onSearchChange={setEfficiencySearch}
        options={['80+','80+ Bronze','80+ Silver','80+ Gold','80+ Platinum','80+ Titanium']}
        selectedItems={selectedEfficiencies}
        onItemChange={handleEfficiencyChange}
      />

      <FilterPopup
        isOpen={showModularPopup}
        onClose={() => setShowModularPopup(false)}
        title="Modular"
        searchTerm={modularSearch}
        onSearchChange={setModularSearch}
        options={['Non-Modular','Semi-Modular','Fully Modular']}
        selectedItems={selectedModulars}
        onItemChange={handleModularChange}
      />

      <FilterPopup
        isOpen={showFormFactorPopup}
        onClose={() => setShowFormFactorPopup(false)}
        title="Form Factor"
        searchTerm={formFactorSearch}
        onSearchChange={setFormFactorSearch}
        options={['ATX','SFX','TFX','CFX','LFX','Flex ATX']}
        selectedItems={selectedFormFactors}
        onItemChange={handleFormFactorChange}
      />

      <FilterPopup
        isOpen={showCertificationPopup}
        onClose={() => setShowCertificationPopup(false)}
        title="Certification"
        searchTerm={certificationSearch}
        onSearchChange={setCertificationSearch}
        options={['80+','80+ Bronze','80+ Silver','80+ Gold','80+ Platinum','80+ Titanium']}
        selectedItems={selectedCertifications}
        onItemChange={handleCertificationChange}
      />

      <FilterPopup
        isOpen={showBrandPopup}
        onClose={() => setShowBrandPopup(false)}
        title="Brand"
        searchTerm={brandSearch}
        onSearchChange={setBrandSearch}
        options={['Corsair','EVGA','Seasonic','Thermaltake','Cooler Master','ASUS','MSI','Gigabyte','Antec','be quiet!','Fractal Design','Silverstone','Super Flower','XFX']}
        selectedItems={selectedBrands}
        onItemChange={handleBrandChange}
      />

      <FilterPopup
        isOpen={showFanSizePopup}
        onClose={() => setShowFanSizePopup(false)}
        title="Fan Size"
        searchTerm={fanSizeSearch}
        onSearchChange={setFanSizeSearch}
        options={['80mm','92mm','120mm','135mm','140mm']}
        selectedItems={selectedFanSizes}
        onItemChange={handleFanSizeChange}
      />

      <FilterPopup
        isOpen={showFanTypePopup}
        onClose={() => setShowFanTypePopup(false)}
        title="Fan Type"
        searchTerm={fanTypeSearch}
        onSearchChange={setFanTypeSearch}
        options={['Sleeve Bearing','Ball Bearing','Fluid Dynamic Bearing','Rifle Bearing','Hydro Dynamic Bearing']}
        selectedItems={selectedFanTypes}
        onItemChange={handleFanTypeChange}
      />
    </div>
  )
}

export default PSUPage
