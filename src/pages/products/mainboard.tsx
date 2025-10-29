import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface MainboardItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    socketType: string
    formFactor: string
    chipset: string
    memoryType: string
    maxMemory: string
    memorySlots: number
    pcieSlots: number
    sataPorts: number
    m2Slots: number
    wifi: boolean
    bluetooth: boolean
    usbPorts: string
    audio: string
    lan: string
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

function MainboardPage() {
  const navigate = useNavigate()
  const [selectedMainboard, setSelectedMainboard] = useState<MainboardItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSocketTypes, setSelectedSocketTypes] = useState<string[]>([])
  const [selectedFormFactors, setSelectedFormFactors] = useState<string[]>([])
  const [selectedChipsets, setSelectedChipsets] = useState<string[]>([])
  const [selectedMemoryTypes, setSelectedMemoryTypes] = useState<string[]>([])
  const [selectedMemorySlots, setSelectedMemorySlots] = useState<string[]>([])
  const [selectedPCIESlots, setSelectedPCIESlots] = useState<string[]>([])
  const [selectedWifi, setSelectedWifi] = useState<boolean | null>(null)
  const [selectedBluetooth, setSelectedBluetooth] = useState<boolean | null>(null)
  const [selectedM2Slots, setSelectedM2Slots] = useState<string[]>([])
  const [selectedSataPorts, setSelectedSataPorts] = useState<string[]>([])
  
  // API states
  const [mainboards, setMainboards] = useState<MainboardItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Popup states
  const [showSocketTypePopup, setShowSocketTypePopup] = useState(false)
  const [showFormFactorPopup, setShowFormFactorPopup] = useState(false)
  const [showChipsetPopup, setShowChipsetPopup] = useState(false)
  const [showMemoryTypePopup, setShowMemoryTypePopup] = useState(false)
  const [showMemorySlotsPopup, setShowMemorySlotsPopup] = useState(false)
  const [showPCIESlotsPopup, setShowPCIESlotsPopup] = useState(false)
  const [showM2SlotsPopup, setShowM2SlotsPopup] = useState(false)
  const [showSataPortsPopup, setShowSataPortsPopup] = useState(false)
  
  // Search terms for popups
  const [socketTypeSearch, setSocketTypeSearch] = useState('')
  const [formFactorSearch, setFormFactorSearch] = useState('')
  const [chipsetSearch, setChipsetSearch] = useState('')
  const [memoryTypeSearch, setMemoryTypeSearch] = useState('')
  const [memorySlotsSearch, setMemorySlotsSearch] = useState('')
  const [pcieSlotsSearch, setPcieSlotsSearch] = useState('')
  const [m2SlotsSearch, setM2SlotsSearch] = useState('')
  const [sataPortsSearch, setSataPortsSearch] = useState('')

  // Fetch mainboards from API (category_id = 3)
  useEffect(() => {
    const fetchMainboards = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(3)

        const formatted: MainboardItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')
          const socketMatch = specsString.match(/(LGA\s*\d{3,4}|AM[45])/i)
          const formFactorMatch = specsString.match(/(E?ATX|XL ATX|Micro ATX|Mini ITX|ITX)/i)
          const chipsetMatch = specsString.match(/(Z\d{3}|B\d{3}|H\d{3}|X\d{3}|B\d{3}|A\d{3})/i)
          const memTypeMatch = specsString.match(/DDR\d(?:-\d+)?/i)
          const maxMemMatch = specsString.match(/(\d+\s*GB)\s*max/i)
          const slotsMatch = specsString.match(/(\d+)\s*slots?/i)
          const m2Match = specsString.match(/M\.2\s*(\d+)/i)
          const sataMatch = specsString.match(/SATA\s*(\d+)/i)

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
          console.log(`Mainboard: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name || item.model) || 'Unknown Mainboard',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || item.imageUrl1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              socketType: socketMatch ? socketMatch[1].toUpperCase() : 'Unknown',
              formFactor: formFactorMatch ? formFactorMatch[1] : 'ATX',
              chipset: chipsetMatch ? chipsetMatch[1] : 'Unknown',
              memoryType: memTypeMatch ? memTypeMatch[0].toUpperCase() : 'Unknown',
              maxMemory: maxMemMatch ? maxMemMatch[1].toUpperCase() : 'Unknown',
              memorySlots: slotsMatch ? parseInt(slotsMatch[1]) : 4,
              pcieSlots: 2,
              sataPorts: sataMatch ? parseInt(sataMatch[1]) : 4,
              m2Slots: m2Match ? parseInt(m2Match[1]) : 2,
              wifi: true,
              bluetooth: true,
              usbPorts: 'Unknown',
              audio: 'Unknown',
              lan: 'Unknown'
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

        setMainboards(formatted)
      } catch (err) {
        console.error('Error fetching Mainboards:', err)
        setMainboards([])
      } finally {
        setLoading(false)
      }
    }

    fetchMainboards()
  }, [])

  // Dữ liệu dùng từ API
  const allMainboards = mainboards

  // Filter logic
  const filteredMainboards = allMainboards.filter((mainboardItem) => {
    // Price filter - parse min price từ price range string
    if (mainboardItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = mainboardItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !mainboardItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !mainboardItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Socket type filter
    if (selectedSocketTypes.length > 0 && !selectedSocketTypes.includes(mainboardItem.specs.socketType)) {
      return false
    }

    // Form factor filter
    if (selectedFormFactors.length > 0 && !selectedFormFactors.includes(mainboardItem.specs.formFactor)) {
      return false
    }

    // Chipset filter
    if (selectedChipsets.length > 0 && !selectedChipsets.includes(mainboardItem.specs.chipset)) {
      return false
    }

    // Memory type filter
    if (selectedMemoryTypes.length > 0 && !selectedMemoryTypes.includes(mainboardItem.specs.memoryType)) {
      return false
    }

    // Memory slots filter
    if (selectedMemorySlots.length > 0 && !selectedMemorySlots.includes(mainboardItem.specs.memorySlots.toString())) {
      return false
    }

    // PCIe slots filter
    if (selectedPCIESlots.length > 0 && !selectedPCIESlots.includes(mainboardItem.specs.pcieSlots.toString())) {
      return false
    }

    // WiFi filter
    if (selectedWifi !== null && mainboardItem.specs.wifi !== selectedWifi) {
      return false
    }

    // Bluetooth filter
    if (selectedBluetooth !== null && mainboardItem.specs.bluetooth !== selectedBluetooth) {
      return false
    }

    // M.2 slots filter
    if (selectedM2Slots.length > 0 && !selectedM2Slots.includes(mainboardItem.specs.m2Slots.toString())) {
      return false
    }

    // SATA ports filter
    if (selectedSataPorts.length > 0 && !selectedSataPorts.includes(mainboardItem.specs.sataPorts.toString())) {
      return false
    }

    return true
  })

  const handleSocketTypeChange = (socketType: string) => {
    setSelectedSocketTypes(prev => 
      prev.includes(socketType) 
        ? prev.filter(s => s !== socketType)
        : [...prev, socketType]
    )
  }

  const handleFormFactorChange = (formFactor: string) => {
    setSelectedFormFactors(prev => 
      prev.includes(formFactor) 
        ? prev.filter(f => f !== formFactor)
        : [...prev, formFactor]
    )
  }

  const handleChipsetChange = (chipset: string) => {
    setSelectedChipsets(prev => 
      prev.includes(chipset) 
        ? prev.filter(c => c !== chipset)
        : [...prev, chipset]
    )
  }

  const handleMemoryTypeChange = (memoryType: string) => {
    setSelectedMemoryTypes(prev => 
      prev.includes(memoryType) 
        ? prev.filter(m => m !== memoryType)
        : [...prev, memoryType]
    )
  }

  const handleMemorySlotsChange = (slots: string) => {
    setSelectedMemorySlots(prev => 
      prev.includes(slots) 
        ? prev.filter(s => s !== slots)
        : [...prev, slots]
    )
  }

  const handlePCIESlotsChange = (slots: string) => {
    setSelectedPCIESlots(prev => 
      prev.includes(slots) 
        ? prev.filter(s => s !== slots)
        : [...prev, slots]
    )
  }

  const handleWifiChange = (value: boolean) => {
    setSelectedWifi(prev => prev === value ? null : value)
  }

  const handleBluetoothChange = (value: boolean) => {
    setSelectedBluetooth(prev => prev === value ? null : value)
  }

  const handleM2SlotsChange = (slots: string) => {
    setSelectedM2Slots(prev => 
      prev.includes(slots) 
        ? prev.filter(s => s !== slots)
        : [...prev, slots]
    )
  }

  const handleSataPortsChange = (ports: string) => {
    setSelectedSataPorts(prev => 
      prev.includes(ports) 
        ? prev.filter(p => p !== ports)
        : [...prev, ports]
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
    <div className="page homepage-container">
      <div className="layout">

        {/* Main */}
        <main className="main">
          {/* Breadcrumb + controls */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Products</span>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="font-medium text-white">Mainboard</span>
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
                  <h3 className="text-base font-semibold mb-3 text-white">Socket Type</h3>
                  <div className="space-y-2 text-sm">
                    {['LGA 1700','AM5','AM4','LGA 1200'].map((socket) => (
                      <label key={socket} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedSocketTypes.includes(socket)}
                          onChange={() => handleSocketTypeChange(socket)}
                          className="rounded" 
                        />
                        <span>{socket}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowSocketTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Form Factor</h3>
                  <div className="space-y-2 text-sm">
                    {['ATX','Micro ATX','Mini ITX'].map((formFactor) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Chipset</h3>
                  <div className="space-y-2 text-sm">
                    {['Intel Z790','AMD X670E','AMD B650','Intel B760','AMD B550'].map((chipset) => (
                      <label key={chipset} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedChipsets.includes(chipset)}
                          onChange={() => handleChipsetChange(chipset)}
                          className="rounded" 
                        />
                        <span>{chipset}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowChipsetPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Memory Type</h3>
                  <div className="space-y-2 text-sm">
                    {['DDR4-3200','DDR5-5200','DDR5-5600','DDR4-3200, DDR5-5600'].map((memoryType) => (
                      <label key={memoryType} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedMemoryTypes.includes(memoryType)}
                          onChange={() => handleMemoryTypeChange(memoryType)}
                          className="rounded" 
                        />
                        <span>{memoryType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowMemoryTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Memory Slots</h3>
                  <div className="space-y-2 text-sm">
                    {['4'].map((slots) => (
                      <label key={slots} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedMemorySlots.includes(slots)}
                          onChange={() => handleMemorySlotsChange(slots)}
                          className="rounded" 
                        />
                        <span>{slots}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowMemorySlotsPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">PCIe Slots</h3>
                  <div className="space-y-2 text-sm">
                    {['2','3'].map((slots) => (
                      <label key={slots} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedPCIESlots.includes(slots)}
                          onChange={() => handlePCIESlotsChange(slots)}
                          className="rounded" 
                        />
                        <span>{slots}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowPCIESlotsPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">WiFi</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedWifi === true}
                        onChange={() => handleWifiChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedWifi === false}
                        onChange={() => handleWifiChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Bluetooth</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedBluetooth === true}
                        onChange={() => handleBluetoothChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedBluetooth === false}
                        onChange={() => handleBluetoothChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">M.2 Slots</h3>
                  <div className="space-y-2 text-sm">
                    {['2','3','4'].map((slots) => (
                      <label key={slots} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedM2Slots.includes(slots)}
                          onChange={() => handleM2SlotsChange(slots)}
                          className="rounded" 
                        />
                        <span>{slots}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowM2SlotsPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3">SATA Ports</h3>
                  <div className="space-y-2 text-sm">
                    {['4','6'].map((ports) => (
                      <label key={ports} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedSataPorts.includes(ports)}
                          onChange={() => handleSataPortsChange(ports)}
                          className="rounded" 
                        />
                        <span>{ports}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowSataPortsPopup(true)} className="text-blue-600 text-xs">Show More</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu Mainboard...</div>
                </div>
              )}

              {filteredMainboards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {mainboards.length === 0 ? 'Không có Mainboard nào trong database' : 'Không tìm thấy Mainboard nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {mainboards.length === 0 ? 'Vui lòng thêm Mainboard vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {mainboards.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedSocketTypes([])
                        setSelectedFormFactors([])
                        setSelectedChipsets([])
                        setSelectedMemoryTypes([])
                        setSelectedMemorySlots([])
                        setSelectedPCIESlots([])
                        setSelectedWifi(null)
                        setSelectedBluetooth(null)
                        setSelectedM2Slots([])
                        setSelectedSataPorts([])
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
                  {filteredMainboards.map((mainboardItem) => (
                    <div key={mainboardItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/mainboard/${mainboardItem.id}`)}>
                      <div className="p-4">
                        <img src={mainboardItem.image} alt={mainboardItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{mainboardItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {mainboardItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Socket:</span><span className="text-white">{mainboardItem.specs.socketType}</span></div>
                          <div className="flex justify-between"><span>Form Factor:</span><span className="text-white">{mainboardItem.specs.formFactor}</span></div>
                          <div className="flex justify-between"><span>Chipset:</span><span className="text-white">{mainboardItem.specs.chipset}</span></div>
                          <div className="flex justify_between"><span>Memory:</span><span className="text-white">{mainboardItem.specs.memoryType}</span></div>
                          <div className="flex justify_between"><span>WiFi:</span><span className="text-white">{mainboardItem.specs.wifi ? 'Yes' : 'No'}</span></div>
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
      {selectedMainboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedMainboard.name}</h2>
                  <p className="text-lg text-white/70">{selectedMainboard.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedMainboard(null)}
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
                    src={selectedMainboard.image}
                    alt={selectedMainboard.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedMainboard.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedMainboard.productPrices && selectedMainboard.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedMainboard.productPrices
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
                      {Object.entries(selectedMainboard.specs).map(([key, value]) => (
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
                      {selectedMainboard.features.map((feature, index) => (
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
                        selectedMainboard.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedMainboard.inStock}
                    >
                      {selectedMainboard.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showSocketTypePopup}
        onClose={() => setShowSocketTypePopup(false)}
        title="Socket Type"
        searchTerm={socketTypeSearch}
        onSearchChange={setSocketTypeSearch}
        options={['LGA 1700','AM5','AM4','LGA 1200','LGA 1151','TR4','sTRX4','sWRX8']}
        selectedItems={selectedSocketTypes}
        onItemChange={handleSocketTypeChange}
      />

      <FilterPopup
        isOpen={showFormFactorPopup}
        onClose={() => setShowFormFactorPopup(false)}
        title="Form Factor"
        searchTerm={formFactorSearch}
        onSearchChange={setFormFactorSearch}
        options={['ATX','Micro ATX','Mini ITX','EATX','XL ATX','DTX','Thin Mini ITX']}
        selectedItems={selectedFormFactors}
        onItemChange={handleFormFactorChange}
      />

      <FilterPopup
        isOpen={showChipsetPopup}
        onClose={() => setShowChipsetPopup(false)}
        title="Chipset"
        searchTerm={chipsetSearch}
        onSearchChange={setChipsetSearch}
        options={['Intel Z790','Intel Z690','Intel B760','Intel B660','Intel H770','Intel H670','AMD X670E','AMD X670','AMD B650E','AMD B650','AMD B550','AMD A520']}
        selectedItems={selectedChipsets}
        onItemChange={handleChipsetChange}
      />

      <FilterPopup
        isOpen={showMemoryTypePopup}
        onClose={() => setShowMemoryTypePopup(false)}
        title="Memory Type"
        searchTerm={memoryTypeSearch}
        onSearchChange={setMemoryTypeSearch}
        options={['DDR4-2133','DDR4-2400','DDR4-2666','DDR4-2933','DDR4-3200','DDR5-4800','DDR5-5200','DDR5-5600','DDR5-6000','DDR5-6400']}
        selectedItems={selectedMemoryTypes}
        onItemChange={handleMemoryTypeChange}
      />

      <FilterPopup
        isOpen={showMemorySlotsPopup}
        onClose={() => setShowMemorySlotsPopup(false)}
        title="Memory Slots"
        searchTerm={memorySlotsSearch}
        onSearchChange={setMemorySlotsSearch}
        options={['2','4','8']}
        selectedItems={selectedMemorySlots}
        onItemChange={handleMemorySlotsChange}
      />

      <FilterPopup
        isOpen={showPCIESlotsPopup}
        onClose={() => setShowPCIESlotsPopup(false)}
        title="PCIe Slots"
        searchTerm={pcieSlotsSearch}
        onSearchChange={setPcieSlotsSearch}
        options={['1','2','3','4','5','6','7','8']}
        selectedItems={selectedPCIESlots}
        onItemChange={handlePCIESlotsChange}
      />

      <FilterPopup
        isOpen={showM2SlotsPopup}
        onClose={() => setShowM2SlotsPopup(false)}
        title="M.2 Slots"
        searchTerm={m2SlotsSearch}
        onSearchChange={setM2SlotsSearch}
        options={['1','2','3','4','5','6']}
        selectedItems={selectedM2Slots}
        onItemChange={handleM2SlotsChange}
      />

      <FilterPopup
        isOpen={showSataPortsPopup}
        onClose={() => setShowSataPortsPopup(false)}
        title="SATA Ports"
        searchTerm={sataPortsSearch}
        onSearchChange={setSataPortsSearch}
        options={['2','4','6','8','10','12']}
        selectedItems={selectedSataPorts}
        onItemChange={handleSataPortsChange}
      />
    </div>
  )
}

export default MainboardPage
