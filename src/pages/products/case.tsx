import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface CaseItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    formFactor: string
    maxGPULength: string
    maxCPUCoolerHeight: string
    maxPSULength: string
    driveBays: string
    fans: string
    rgb: string
    color: string
    transparentSidePanel: boolean
    maxCPULength: string
    driveBays35: number
    driveBays25: number
    expansionSlots: number
    volume: string
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

function CasePage() {
  const navigate = useNavigate()
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormFactors, setSelectedFormFactors] = useState<string[]>([])
  const [selectedSidePanels, setSelectedSidePanels] = useState<string[]>([])
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTransparentSidePanel, setSelectedTransparentSidePanel] = useState<boolean | null>(null)
  const [selectedMaxCPULength, setSelectedMaxCPULength] = useState<string[]>([])
  const [selectedMaxCPUCoolerHeight, setSelectedMaxCPUCoolerHeight] = useState<string[]>([])
  const [selectedDriveBays35, setSelectedDriveBays35] = useState<string[]>([])
  const [selectedDriveBays25, setSelectedDriveBays25] = useState<string[]>([])
  const [selectedExpansionSlots, setSelectedExpansionSlots] = useState<string[]>([])
  const [selectedVolume, setSelectedVolume] = useState<string[]>([])
  const [selectedWeight, setSelectedWeight] = useState<string[]>([])
  
  // Popup states
  const [showFormFactorPopup, setShowFormFactorPopup] = useState(false)
  const [showSidePanelPopup, setShowSidePanelPopup] = useState(false)
  const [showManufacturerPopup, setShowManufacturerPopup] = useState(false)
  const [showColorPopup, setShowColorPopup] = useState(false)
  const [showMaxCPULengthPopup, setShowMaxCPULengthPopup] = useState(false)
  const [showMaxCPUCoolerHeightPopup, setShowMaxCPUCoolerHeightPopup] = useState(false)
  const [showDriveBays35Popup, setShowDriveBays35Popup] = useState(false)
  const [showDriveBays25Popup, setShowDriveBays25Popup] = useState(false)
  const [showExpansionSlotsPopup, setShowExpansionSlotsPopup] = useState(false)
  const [showVolumePopup, setShowVolumePopup] = useState(false)
  const [showWeightPopup, setShowWeightPopup] = useState(false)
  
  // Search terms for popups
  const [formFactorSearch, setFormFactorSearch] = useState('')
  const [sidePanelSearch, setSidePanelSearch] = useState('')
  const [manufacturerSearch, setManufacturerSearch] = useState('')
  const [colorSearch, setColorSearch] = useState('')
  const [maxCPULengthSearch, setMaxCPULengthSearch] = useState('')
  const [maxCPUCoolerHeightSearch, setMaxCPUCoolerHeightSearch] = useState('')
  const [driveBays35Search, setDriveBays35Search] = useState('')
  const [driveBays25Search, setDriveBays25Search] = useState('')
  const [expansionSlotsSearch, setExpansionSlotsSearch] = useState('')
  const [volumeSearch, setVolumeSearch] = useState('')
  const [weightSearch, setWeightSearch] = useState('')
  // API states
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch Cases from API (category_id = 7)
  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(7)

        const formatted: CaseItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')
          const formMatch = specsString.match(/(ATX|EATX|Micro ATX|Mini-ITX)[^,]*/i)
          const colorMatch = specsString.match(/(Black|White|Silver|RGB)/i)
          const gpuLenMatch = specsString.match(/(\d{3,4})\s*mm/i)
          const weightMatch = specsString.match(/(\d+\.?\d*)\s*kg/i)

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
          console.log(`Case: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown Case',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              formFactor: formMatch ? formMatch[0] : 'ATX Mid Tower',
              maxGPULength: gpuLenMatch ? `${gpuLenMatch[1]}mm` : 'Unknown',
              maxCPUCoolerHeight: 'Unknown',
              maxPSULength: 'Unknown',
              driveBays: 'Unknown',
              fans: 'Unknown',
              rgb: 'Unknown',
              color: colorMatch ? colorMatch[1] : 'Black',
              transparentSidePanel: true,
              maxCPULength: 'Unknown',
              driveBays35: 0,
              driveBays25: 0,
              expansionSlots: 7,
              volume: 'Unknown',
              weight: weightMatch ? `${weightMatch[1]}kg` : 'Unknown'
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

        setCases(formatted)
      } catch (err) {
        console.error('Error fetching Cases:', err)
        setCases([])
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  const allCases = cases

  // Filter logic
  const filteredCases = allCases.filter((caseItem) => {
    // Price filter - parse min price từ price range string
    if (caseItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = caseItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !caseItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !caseItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Form factor filter
    if (selectedFormFactors.length > 0 && !selectedFormFactors.includes(caseItem.specs.formFactor)) {
      return false
    }

    // Side panel filter
    if (selectedSidePanels.length > 0 && !selectedSidePanels.includes('Tempered Glass')) {
      return false
    }

    // Manufacturer filter
    if (selectedManufacturers.length > 0 && !selectedManufacturers.includes(caseItem.brand)) {
      return false
    }

    // Color filter
    if (selectedColors.length > 0 && !selectedColors.includes(caseItem.specs.color)) {
      return false
    }

    // Transparent side panel filter
    if (selectedTransparentSidePanel !== null && caseItem.specs.transparentSidePanel !== selectedTransparentSidePanel) {
      return false
    }

    // Max CPU length filter
    if (selectedMaxCPULength.length > 0 && !selectedMaxCPULength.includes(caseItem.specs.maxCPULength)) {
      return false
    }

    // Max CPU cooler height filter
    if (selectedMaxCPUCoolerHeight.length > 0 && !selectedMaxCPUCoolerHeight.includes(caseItem.specs.maxCPUCoolerHeight)) {
      return false
    }

    // 3.5" drive bays filter
    if (selectedDriveBays35.length > 0 && !selectedDriveBays35.includes(caseItem.specs.driveBays35.toString())) {
      return false
    }

    // 2.5" drive bays filter
    if (selectedDriveBays25.length > 0 && !selectedDriveBays25.includes(caseItem.specs.driveBays25.toString())) {
      return false
    }

    // Expansion slots filter
    if (selectedExpansionSlots.length > 0 && !selectedExpansionSlots.includes(caseItem.specs.expansionSlots.toString())) {
      return false
    }

    // Volume filter
    if (selectedVolume.length > 0 && !selectedVolume.includes(caseItem.specs.volume)) {
      return false
    }

    // Weight filter
    if (selectedWeight.length > 0 && !selectedWeight.includes(caseItem.specs.weight)) {
      return false
    }

    return true
  })

  const handleFormFactorChange = (factor: string) => {
    setSelectedFormFactors(prev => 
      prev.includes(factor) 
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    )
  }

  const handleSidePanelChange = (panel: string) => {
    setSelectedSidePanels(prev => 
      prev.includes(panel) 
        ? prev.filter(p => p !== panel)
        : [...prev, panel]
    )
  }

  const handleManufacturerChange = (manufacturer: string) => {
    setSelectedManufacturers(prev => 
      prev.includes(manufacturer) 
        ? prev.filter(m => m !== manufacturer)
        : [...prev, manufacturer]
    )
  }

  const handleColorChange = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  const handleTransparentSidePanelChange = (value: boolean) => {
    setSelectedTransparentSidePanel(prev => prev === value ? null : value)
  }

  const handleMaxCPULengthChange = (length: string) => {
    setSelectedMaxCPULength(prev => 
      prev.includes(length) 
        ? prev.filter(l => l !== length)
        : [...prev, length]
    )
  }

  const handleMaxCPUCoolerHeightChange = (height: string) => {
    setSelectedMaxCPUCoolerHeight(prev => 
      prev.includes(height) 
        ? prev.filter(h => h !== height)
        : [...prev, height]
    )
  }

  const handleDriveBays35Change = (bays: string) => {
    setSelectedDriveBays35(prev => 
      prev.includes(bays) 
        ? prev.filter(b => b !== bays)
        : [...prev, bays]
    )
  }

  const handleDriveBays25Change = (bays: string) => {
    setSelectedDriveBays25(prev => 
      prev.includes(bays) 
        ? prev.filter(b => b !== bays)
        : [...prev, bays]
    )
  }

  const handleExpansionSlotsChange = (slots: string) => {
    setSelectedExpansionSlots(prev => 
      prev.includes(slots) 
        ? prev.filter(s => s !== slots)
        : [...prev, slots]
    )
  }

  const handleVolumeChange = (volume: string) => {
    setSelectedVolume(prev => 
      prev.includes(volume) 
        ? prev.filter(v => v !== volume)
        : [...prev, volume]
    )
  }

  const handleWeightChange = (weight: string) => {
    setSelectedWeight(prev => 
      prev.includes(weight) 
        ? prev.filter(w => w !== weight)
        : [...prev, weight]
    )
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
              <span className="font-medium text-white">Case</span>
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
                  <h3 className="text-base font-semibold mb-3 text-white">Form Factor</h3>
                  <div className="space-y-2 text-sm">
                    {['ATX Desktop','ATX Full Tower','ATX Mid Tower','ATX Mini Tower','ATX Test Bench','EATX','EATX Full Tower','EATX Mid Tower'].map((factor) => (
                      <label key={factor} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedFormFactors.includes(factor)}
                          onChange={() => handleFormFactorChange(factor)}
                          className="rounded" 
                        />
                        <span>{factor}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowFormFactorPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Side Panel</h3>
                  <div className="space-y-2 text-sm">
                    {['Acrylic','Aluminum','Mesh','None','Solid','Steel','Tempered Glass','Tinted Acrylic'].map((panel) => (
                      <label key={panel} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedSidePanels.includes(panel)}
                          onChange={() => handleSidePanelChange(panel)}
                          className="rounded" 
                        />
                        <span>{panel}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowSidePanelPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Manufacturer</h3>
                  <div className="space-y-2 text-sm">
                    {['NZXT','Fractal Design','Corsair','Lian Li'].map((manufacturer) => (
                      <label key={manufacturer} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedManufacturers.includes(manufacturer)}
                          onChange={() => handleManufacturerChange(manufacturer)}
                          className="rounded" 
                        />
                        <span>{manufacturer}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowManufacturerPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Color</h3>
                  <div className="space-y-2 text-sm">
                    {['Black','White','Silver','RGB'].map((color) => (
                      <label key={color} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedColors.includes(color)}
                          onChange={() => handleColorChange(color)}
                          className="rounded" 
                        />
                        <span>{color}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowColorPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Transparent Side Panel</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedTransparentSidePanel === true}
                        onChange={() => handleTransparentSidePanelChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedTransparentSidePanel === false}
                        onChange={() => handleTransparentSidePanelChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Max CPU Length</h3>
                  <div className="space-y-2 text-sm">
                    {['155mm','160mm','170mm','180mm'].map((length) => (
                      <label key={length} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedMaxCPULength.includes(length)}
                          onChange={() => handleMaxCPULengthChange(length)}
                          className="rounded" 
                        />
                        <span>{length}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowMaxCPULengthPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Max CPU Cooler Height</h3>
                  <div className="space-y-2 text-sm">
                    {['155mm','170mm','185mm'].map((height) => (
                      <label key={height} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedMaxCPUCoolerHeight.includes(height)}
                          onChange={() => handleMaxCPUCoolerHeightChange(height)}
                          className="rounded" 
                        />
                        <span>{height}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowMaxCPUCoolerHeightPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">3.5 Drive Bays</h3>
                  <div className="space-y-2 text-sm">
                    {['0','2','6'].map((bays) => (
                      <label key={bays} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedDriveBays35.includes(bays)}
                          onChange={() => handleDriveBays35Change(bays)}
                          className="rounded" 
                        />
                        <span>{bays}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowDriveBays35Popup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">2.5 Drive Bays</h3>
                  <div className="space-y-2 text-sm">
                    {['2','4'].map((bays) => (
                      <label key={bays} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedDriveBays25.includes(bays)}
                          onChange={() => handleDriveBays25Change(bays)}
                          className="rounded" 
                        />
                        <span>{bays}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowDriveBays25Popup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Expansion Slots</h3>
                  <div className="space-y-2 text-sm">
                    {['7'].map((slots) => (
                      <label key={slots} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedExpansionSlots.includes(slots)}
                          onChange={() => handleExpansionSlotsChange(slots)}
                          className="rounded" 
                        />
                        <span>{slots}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowExpansionSlotsPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Volume</h3>
                  <div className="space-y-2 text-sm">
                    {['41.2L','45.5L','48.5L','55.2L'].map((volume) => (
                      <label key={volume} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedVolume.includes(volume)}
                          onChange={() => handleVolumeChange(volume)}
                          className="rounded" 
                        />
                        <span>{volume}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowVolumePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Weight</h3>
                  <div className="space-y-2 text-sm">
                    {['7.8kg','8.2kg','9.2kg','12.8kg'].map((weight) => (
                      <label key={weight} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedWeight.includes(weight)}
                          onChange={() => handleWeightChange(weight)}
                          className="rounded" 
                        />
                        <span>{weight}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowWeightPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu Case...</div>
                </div>
              )}

              {filteredCases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {cases.length === 0 ? 'Không có Case nào trong database' : 'Không tìm thấy Case nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {cases.length === 0 ? 'Vui lòng thêm Case vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {cases.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedFormFactors([])
                        setSelectedSidePanels([])
                        setSelectedManufacturers([])
                        setSelectedColors([])
                        setSelectedTransparentSidePanel(null)
                        setSelectedMaxCPULength([])
                        setSelectedMaxCPUCoolerHeight([])
                        setSelectedDriveBays35([])
                        setSelectedDriveBays25([])
                        setSelectedExpansionSlots([])
                        setSelectedVolume([])
                        setSelectedWeight([])
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
                  {filteredCases.map((caseItem) => (
                    <div key={caseItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/case/${caseItem.id}`)}>
                      <div className="p-4">
                        <img src={caseItem.image} alt={caseItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{caseItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {caseItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Form Factor:</span><span className="text-white">{caseItem.specs.formFactor}</span></div>
                          <div className="flex justify-between"><span>Side Panel:</span><span className="text-white">{caseItem.specs.transparentSidePanel ? 'Tempered Glass' : 'Solid'}</span></div>
                          <div className="flex justify-between"><span>Max GPU Length:</span><span className="text-white">{caseItem.specs.maxGPULength}</span></div>
                          <div className="flex justify-between"><span>Color:</span><span className="text-white">{caseItem.specs.color}</span></div>
                          <div className="flex justify-between"><span>Weight:</span><span className="text-white">{caseItem.specs.weight}</span></div>
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
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedCase.name}</h2>
                  <p className="text-lg text-white/70">{selectedCase.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
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
                    src={selectedCase.image}
                    alt={selectedCase.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedCase.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedCase.productPrices && selectedCase.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedCase.productPrices
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
                      {Object.entries(selectedCase.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-white/60 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCase.features.map((feature, index) => (
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
                        selectedCase.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedCase.inStock}
                    >
                      {selectedCase.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showFormFactorPopup}
        onClose={() => setShowFormFactorPopup(false)}
        title="Form Factor"
        searchTerm={formFactorSearch}
        onSearchChange={setFormFactorSearch}
        options={['ATX Desktop','ATX Full Tower','ATX Mid Tower','ATX Mini Tower','ATX Test Bench','EATX','EATX Full Tower','EATX Mid Tower','Micro ATX Desktop','Micro ATX Mid Tower','Micro ATX Mini Tower','Micro ATX Slim Tower','Mini-ITX Desktop','Mini-ITX Test Bench','Mini-ITX Tower']}
        selectedItems={selectedFormFactors}
        onItemChange={handleFormFactorChange}
      />

      <FilterPopup
        isOpen={showSidePanelPopup}
        onClose={() => setShowSidePanelPopup(false)}
        title="Side Panel"
        searchTerm={sidePanelSearch}
        onSearchChange={setSidePanelSearch}
        options={['Acrylic','Aluminum','Mesh','None','Solid','Steel','Tempered Glass','Tinted Acrylic']}
        selectedItems={selectedSidePanels}
        onItemChange={handleSidePanelChange}
      />

      <FilterPopup
        isOpen={showManufacturerPopup}
        onClose={() => setShowManufacturerPopup(false)}
        title="Manufacturer"
        searchTerm={manufacturerSearch}
        onSearchChange={setManufacturerSearch}
        options={['NZXT','Fractal Design','Corsair','Lian Li','Cooler Master','Thermaltake','Phanteks','be quiet!','Antec','Rosewill']}
        selectedItems={selectedManufacturers}
        onItemChange={handleManufacturerChange}
      />

      <FilterPopup
        isOpen={showColorPopup}
        onClose={() => setShowColorPopup(false)}
        title="Color"
        searchTerm={colorSearch}
        onSearchChange={setColorSearch}
        options={['Black','White','Silver','RGB','Red','Blue','Green','Yellow','Orange','Purple']}
        selectedItems={selectedColors}
        onItemChange={handleColorChange}
      />

      <FilterPopup
        isOpen={showMaxCPULengthPopup}
        onClose={() => setShowMaxCPULengthPopup(false)}
        title="Max CPU Length"
        searchTerm={maxCPULengthSearch}
        onSearchChange={setMaxCPULengthSearch}
        options={['155mm','160mm','170mm','180mm','190mm','200mm']}
        selectedItems={selectedMaxCPULength}
        onItemChange={handleMaxCPULengthChange}
      />

      <FilterPopup
        isOpen={showMaxCPUCoolerHeightPopup}
        onClose={() => setShowMaxCPUCoolerHeightPopup(false)}
        title="Max CPU Cooler Height"
        searchTerm={maxCPUCoolerHeightSearch}
        onSearchChange={setMaxCPUCoolerHeightSearch}
        options={['155mm','160mm','170mm','180mm','185mm','190mm','200mm']}
        selectedItems={selectedMaxCPUCoolerHeight}
        onItemChange={handleMaxCPUCoolerHeightChange}
      />

      <FilterPopup
        isOpen={showDriveBays35Popup}
        onClose={() => setShowDriveBays35Popup(false)}
        title="3.5 Drive Bays"
        searchTerm={driveBays35Search}
        onSearchChange={setDriveBays35Search}
        options={['0','1','2','3','4','5','6','7','8','9','10']}
        selectedItems={selectedDriveBays35}
        onItemChange={handleDriveBays35Change}
      />

      <FilterPopup
        isOpen={showDriveBays25Popup}
        onClose={() => setShowDriveBays25Popup(false)}
        title="2.5 Drive Bays"
        searchTerm={driveBays25Search}
        onSearchChange={setDriveBays25Search}
        options={['0','1','2','3','4','5','6','7','8','9','10']}
        selectedItems={selectedDriveBays25}
        onItemChange={handleDriveBays25Change}
      />

      <FilterPopup
        isOpen={showExpansionSlotsPopup}
        onClose={() => setShowExpansionSlotsPopup(false)}
        title="Expansion Slots"
        searchTerm={expansionSlotsSearch}
        onSearchChange={setExpansionSlotsSearch}
        options={['4','5','6','7','8','9','10']}
        selectedItems={selectedExpansionSlots}
        onItemChange={handleExpansionSlotsChange}
      />

      <FilterPopup
        isOpen={showVolumePopup}
        onClose={() => setShowVolumePopup(false)}
        title="Volume"
        searchTerm={volumeSearch}
        onSearchChange={setVolumeSearch}
        options={['20L','25L','30L','35L','40L','41.2L','45L','45.5L','48L','48.5L','50L','55L','55.2L','60L','65L','70L']}
        selectedItems={selectedVolume}
        onItemChange={handleVolumeChange}
      />

      <FilterPopup
        isOpen={showWeightPopup}
        onClose={() => setShowWeightPopup(false)}
        title="Weight"
        searchTerm={weightSearch}
        onSearchChange={setWeightSearch}
        options={['5kg','6kg','7kg','7.8kg','8kg','8.2kg','9kg','9.2kg','10kg','11kg','12kg','12.8kg','13kg','14kg','15kg']}
        selectedItems={selectedWeight}
        onItemChange={handleWeightChange}
      />
    </div>
  )
}

export default CasePage