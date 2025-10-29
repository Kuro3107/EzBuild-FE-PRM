import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../Homepage.css'
import { ApiService } from '../../services/api'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface StorageItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    capacity: string
    type: string
    interface: string
    readSpeed: string
    writeSpeed: string
    formFactor: string
    nandType: string
    controller: string
    endurance: string
    warranty: string
    encryption: boolean
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

function StoragePage() {
  const navigate = useNavigate()
  const [selectedStorage, setSelectedStorage] = useState<StorageItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCapacities, setSelectedCapacities] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedFormFactors, setSelectedFormFactors] = useState<string[]>([])
  const [selectedNandTypes, setSelectedNandTypes] = useState<string[]>([])
  const [selectedReadSpeeds, setSelectedReadSpeeds] = useState<string[]>([])
  const [selectedWriteSpeeds, setSelectedWriteSpeeds] = useState<string[]>([])
  const [selectedEncryption, setSelectedEncryption] = useState<boolean | null>(null)
  const [selectedRGB, setSelectedRGB] = useState<boolean | null>(null)
  
  // API states
  const [storages, setStorages] = useState<StorageItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Popup states
  const [showCapacityPopup, setShowCapacityPopup] = useState(false)
  const [showTypePopup, setShowTypePopup] = useState(false)
  const [showInterfacePopup, setShowInterfacePopup] = useState(false)
  const [showBrandPopup, setShowBrandPopup] = useState(false)
  const [showFormFactorPopup, setShowFormFactorPopup] = useState(false)
  const [showNandTypePopup, setShowNandTypePopup] = useState(false)
  const [showReadSpeedPopup, setShowReadSpeedPopup] = useState(false)
  const [showWriteSpeedPopup, setShowWriteSpeedPopup] = useState(false)
  
  // Search terms for popups
  const [capacitySearch, setCapacitySearch] = useState('')
  const [typeSearch, setTypeSearch] = useState('')
  const [interfaceSearch, setInterfaceSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [formFactorSearch, setFormFactorSearch] = useState('')
  const [nandTypeSearch, setNandTypeSearch] = useState('')
  const [readSpeedSearch, setReadSpeedSearch] = useState('')
  const [writeSpeedSearch, setWriteSpeedSearch] = useState('')

  // Fetch storages from API (category_id = 5)
  useEffect(() => {
    const fetchStorages = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(5)

        const formatted: StorageItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')
          const capacityMatch = specsString.match(/(\d+\s*(GB|TB))/i)
          const typeMatch = specsString.match(/\b(SSD|HDD|NVMe)\b/i)
          const ifaceMatch = specsString.match(/(SATA\s*6Gb\/s|PCIe\s*[2-5]\.0\s*x\s*\d)/i)
          const readMatch = specsString.match(/(\d{2,4})\s*MB\/s\s*(read)?/i)
          const writeMatch = specsString.match(/(\d{2,4})\s*MB\/s\s*(write)?/i)

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
          console.log(`Storage: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown Storage',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || item.imageUrl1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              capacity: capacityMatch ? capacityMatch[1].toUpperCase() : 'Unknown',
              type: typeMatch ? typeMatch[1].toUpperCase() : 'SSD',
              interface: ifaceMatch ? ifaceMatch[1].toUpperCase() : 'SATA 6Gb/s',
              readSpeed: readMatch ? `${readMatch[1]} MB/s` : 'Unknown',
              writeSpeed: writeMatch ? `${writeMatch[1]} MB/s` : 'Unknown',
              formFactor: 'M.2 2280',
              nandType: 'Unknown',
              controller: 'Unknown',
              endurance: 'Unknown',
              warranty: 'Unknown',
              encryption: true,
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

        setStorages(formatted)
      } catch (err) {
        console.error('Error fetching Storages:', err)
        setStorages([])
      } finally {
        setLoading(false)
      }
    }

    fetchStorages()
  }, [])

  const allStorages = storages

  // Filter logic
  const filteredStorages = allStorages.filter((storageItem) => {
    // Price filter - parse min price từ price range string
    if (storageItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = storageItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !storageItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !storageItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Capacity filter
    if (selectedCapacities.length > 0 && !selectedCapacities.includes(storageItem.specs.capacity)) {
      return false
    }

    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(storageItem.specs.type)) {
      return false
    }

    // Interface filter
    if (selectedInterfaces.length > 0 && !selectedInterfaces.includes(storageItem.specs.interface)) {
      return false
    }

    // Brand filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(storageItem.brand)) {
      return false
    }

    // Form factor filter
    if (selectedFormFactors.length > 0 && !selectedFormFactors.includes(storageItem.specs.formFactor)) {
      return false
    }

    // NAND type filter
    if (selectedNandTypes.length > 0 && !selectedNandTypes.includes(storageItem.specs.nandType)) {
      return false
    }

    // Read speed filter
    if (selectedReadSpeeds.length > 0 && !selectedReadSpeeds.includes(storageItem.specs.readSpeed)) {
      return false
    }

    // Write speed filter
    if (selectedWriteSpeeds.length > 0 && !selectedWriteSpeeds.includes(storageItem.specs.writeSpeed)) {
      return false
    }

    // Encryption filter
    if (selectedEncryption !== null && storageItem.specs.encryption !== selectedEncryption) {
      return false
    }

    // RGB filter
    if (selectedRGB !== null && storageItem.specs.rgb !== selectedRGB) {
      return false
    }

    return true
  })

  const handleCapacityChange = (capacity: string) => {
    setSelectedCapacities(prev => 
      prev.includes(capacity) 
        ? prev.filter(c => c !== capacity)
        : [...prev, capacity]
    )
  }

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleInterfaceChange = (interfaceType: string) => {
    setSelectedInterfaces(prev => 
      prev.includes(interfaceType) 
        ? prev.filter(i => i !== interfaceType)
        : [...prev, interfaceType]
    )
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const handleFormFactorChange = (formFactor: string) => {
    setSelectedFormFactors(prev => 
      prev.includes(formFactor) 
        ? prev.filter(f => f !== formFactor)
        : [...prev, formFactor]
    )
  }

  const handleNandTypeChange = (nandType: string) => {
    setSelectedNandTypes(prev => 
      prev.includes(nandType) 
        ? prev.filter(n => n !== nandType)
        : [...prev, nandType]
    )
  }

  const handleReadSpeedChange = (speed: string) => {
    setSelectedReadSpeeds(prev => 
      prev.includes(speed) 
        ? prev.filter(s => s !== speed)
        : [...prev, speed]
    )
  }

  const handleWriteSpeedChange = (speed: string) => {
    setSelectedWriteSpeeds(prev => 
      prev.includes(speed) 
        ? prev.filter(s => s !== speed)
        : [...prev, speed]
    )
  }

  const handleEncryptionChange = (value: boolean) => {
    setSelectedEncryption(prev => prev === value ? null : value)
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
              <span className="font-medium text-white">Storage</span>
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
                  <h3 className="text-base font-semibold mb-3 text-white">Capacity</h3>
                  <div className="space-y-2 text-sm">
                    {['500GB','1TB','2TB'].map((capacity) => (
                      <label key={capacity} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedCapacities.includes(capacity)}
                          onChange={() => handleCapacityChange(capacity)}
                          className="rounded" 
                        />
                        <span>{capacity}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowCapacityPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Type</h3>
                  <div className="space-y-2 text-sm">
                    {['SSD','HDD'].map((type) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Interface</h3>
                  <div className="space-y-2 text-sm">
                    {['SATA 6Gb/s','PCIe 3.0 x4','PCIe 4.0 x4'].map((interfaceType) => (
                      <label key={interfaceType} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedInterfaces.includes(interfaceType)}
                          onChange={() => handleInterfaceChange(interfaceType)}
                          className="rounded" 
                        />
                        <span>{interfaceType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowInterfacePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Brand</h3>
                  <div className="space-y-2 text-sm">
                    {['Samsung','WD','Crucial','Seagate','Corsair','Kingston'].map((brand) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">Form Factor</h3>
                  <div className="space-y-2 text-sm">
                    {['2.5"','3.5"','M.2 2280'].map((formFactor) => (
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
                  <h3 className="text-base font-semibold mb-3 text-white">NAND Type</h3>
                  <div className="space-y-2 text-sm">
                    {['3D NAND','3D TLC NAND','3D V-NAND'].map((nandType) => (
                      <label key={nandType} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedNandTypes.includes(nandType)}
                          onChange={() => handleNandTypeChange(nandType)}
                          className="rounded" 
                        />
                        <span>{nandType}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowNandTypePopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Read Speed</h3>
                  <div className="space-y-2 text-sm">
                    {['210 MB/s','560 MB/s','1700 MB/s','2100 MB/s','5000 MB/s','7000 MB/s'].map((speed) => (
                      <label key={speed} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedReadSpeeds.includes(speed)}
                          onChange={() => handleReadSpeedChange(speed)}
                          className="rounded" 
                        />
                        <span>{speed}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowReadSpeedPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Write Speed</h3>
                  <div className="space-y-2 text-sm">
                    {['210 MB/s','510 MB/s','1700 MB/s','6300 MB/s','6800 MB/s'].map((speed) => (
                      <label key={speed} className="flex items-center gap-2 text-white">
                        <input 
                          type="checkbox" 
                          checked={selectedWriteSpeeds.includes(speed)}
                          onChange={() => handleWriteSpeedChange(speed)}
                          className="rounded" 
                        />
                        <span>{speed}</span>
                      </label>
                    ))}
                    <button onClick={() => setShowWriteSpeedPopup(true)} className="text-blue-400 text-xs">Show More</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-3 text-white">Encryption</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedEncryption === true}
                        onChange={() => handleEncryptionChange(true)}
                        className="rounded" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-white">
                      <input 
                        type="checkbox" 
                        checked={selectedEncryption === false}
                        onChange={() => handleEncryptionChange(false)}
                        className="rounded" 
                      />
                      <span>No</span>
                    </label>
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
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu Storage...</div>
                </div>
              )}

              {filteredStorages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {storages.length === 0 ? 'Không có Storage nào trong database' : 'Không tìm thấy Storage nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {storages.length === 0 ? 'Vui lòng thêm Storage vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                  {storages.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCapacities([])
                        setSelectedTypes([])
                        setSelectedInterfaces([])
                        setSelectedBrands([])
                        setSelectedFormFactors([])
                        setSelectedNandTypes([])
                        setSelectedReadSpeeds([])
                        setSelectedWriteSpeeds([])
                        setSelectedEncryption(null)
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
                  {filteredStorages.map((storageItem) => (
                    <div key={storageItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/storage/${storageItem.id}`)}>
                      <div className="p-4">
                        <img src={storageItem.image} alt={storageItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{storageItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {storageItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Capacity:</span><span className="text-white">{storageItem.specs.capacity}</span></div>
                          <div className="flex justify-between"><span>Type:</span><span className="text-white">{storageItem.specs.type}</span></div>
                          <div className="flex justify-between"><span>Interface:</span><span className="text-white">{storageItem.specs.interface}</span></div>
                          <div className="flex justify-between"><span>Read Speed:</span><span className="text-white">{storageItem.specs.readSpeed}</span></div>
                          <div className="flex justify-between"><span>Write Speed:</span><span className="text-white">{storageItem.specs.writeSpeed}</span></div>
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
      {selectedStorage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedStorage.name}</h2>
                  <p className="text-lg text-white/70">{selectedStorage.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedStorage(null)}
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
                    src={selectedStorage.image}
                    alt={selectedStorage.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedStorage.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedStorage.productPrices && selectedStorage.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedStorage.productPrices
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
                      {Object.entries(selectedStorage.specs).map(([key, value]) => (
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
                      {selectedStorage.features.map((feature, index) => (
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
                        selectedStorage.inStock 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedStorage.inStock}
                    >
                      {selectedStorage.inStock ? 'Add to Build' : 'Out of Stock'}
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
        isOpen={showCapacityPopup}
        onClose={() => setShowCapacityPopup(false)}
        title="Capacity"
        searchTerm={capacitySearch}
        onSearchChange={setCapacitySearch}
        options={['120GB','240GB','250GB','480GB','500GB','960GB','1TB','2TB','4TB','8TB','10TB','12TB','14TB','16TB','18TB','20TB']}
        selectedItems={selectedCapacities}
        onItemChange={handleCapacityChange}
      />

      <FilterPopup
        isOpen={showTypePopup}
        onClose={() => setShowTypePopup(false)}
        title="Type"
        searchTerm={typeSearch}
        onSearchChange={setTypeSearch}
        options={['SSD','HDD','NVMe SSD','SATA SSD','M.2 SSD','External SSD','External HDD']}
        selectedItems={selectedTypes}
        onItemChange={handleTypeChange}
      />

      <FilterPopup
        isOpen={showInterfacePopup}
        onClose={() => setShowInterfacePopup(false)}
        title="Interface"
        searchTerm={interfaceSearch}
        onSearchChange={setInterfaceSearch}
        options={['SATA 3Gb/s','SATA 6Gb/s','PCIe 2.0 x4','PCIe 3.0 x4','PCIe 4.0 x4','PCIe 5.0 x4','USB 3.0','USB 3.1','USB 3.2','USB-C','Thunderbolt 3','Thunderbolt 4']}
        selectedItems={selectedInterfaces}
        onItemChange={handleInterfaceChange}
      />

      <FilterPopup
        isOpen={showBrandPopup}
        onClose={() => setShowBrandPopup(false)}
        title="Brand"
        searchTerm={brandSearch}
        onSearchChange={setBrandSearch}
        options={['Samsung','WD','Crucial','Seagate','Corsair','Kingston','Intel','ADATA','SanDisk','Toshiba','Hitachi','Western Digital']}
        selectedItems={selectedBrands}
        onItemChange={handleBrandChange}
      />

      <FilterPopup
        isOpen={showFormFactorPopup}
        onClose={() => setShowFormFactorPopup(false)}
        title="Form Factor"
        searchTerm={formFactorSearch}
        onSearchChange={setFormFactorSearch}
        options={['2.5"','3.5"','M.2 2242','M.2 2260','M.2 2280','M.2 22110','U.2','mSATA','External']}
        selectedItems={selectedFormFactors}
        onItemChange={handleFormFactorChange}
      />

      <FilterPopup
        isOpen={showNandTypePopup}
        onClose={() => setShowNandTypePopup(false)}
        title="NAND Type"
        searchTerm={nandTypeSearch}
        onSearchChange={setNandTypeSearch}
        options={['SLC','MLC','TLC','QLC','3D NAND','3D TLC NAND','3D QLC NAND','3D V-NAND','BiCS','N/A']}
        selectedItems={selectedNandTypes}
        onItemChange={handleNandTypeChange}
      />

      <FilterPopup
        isOpen={showReadSpeedPopup}
        onClose={() => setShowReadSpeedPopup(false)}
        title="Read Speed"
        searchTerm={readSpeedSearch}
        onSearchChange={setReadSpeedSearch}
        options={['100 MB/s','150 MB/s','200 MB/s','210 MB/s','300 MB/s','400 MB/s','500 MB/s','550 MB/s','560 MB/s','600 MB/s','700 MB/s','800 MB/s','1000 MB/s','1200 MB/s','1500 MB/s','1700 MB/s','2000 MB/s','2100 MB/s','3000 MB/s','3500 MB/s','5000 MB/s','7000 MB/s','7400 MB/s']}
        selectedItems={selectedReadSpeeds}
        onItemChange={handleReadSpeedChange}
      />

      <FilterPopup
        isOpen={showWriteSpeedPopup}
        onClose={() => setShowWriteSpeedPopup(false)}
        title="Write Speed"
        searchTerm={writeSpeedSearch}
        onSearchChange={setWriteSpeedSearch}
        options={['100 MB/s','150 MB/s','200 MB/s','210 MB/s','300 MB/s','400 MB/s','500 MB/s','510 MB/s','550 MB/s','600 MB/s','700 MB/s','800 MB/s','1000 MB/s','1200 MB/s','1500 MB/s','1700 MB/s','2000 MB/s','3000 MB/s','3500 MB/s','5000 MB/s','6300 MB/s','6800 MB/s','7000 MB/s']}
        selectedItems={selectedWriteSpeeds}
        onItemChange={handleWriteSpeedChange}
      />
    </div>
  )
}

export default StoragePage
