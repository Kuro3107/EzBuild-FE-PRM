import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../../services/api'
import '../../Homepage.css'
import PriceRangeSlider from '../../components/PriceRangeSlider'

interface CoolingItem {
  id: number
  name: string
  brand: string
  price: string // Thay đổi từ number sang string để hiển thị min-max range
  image: string
  specs: {
    type: string
    socket: string
    fanSize: string
    fanCount: string
    noiseLevel: string
    tdp: string
    height: string
    weight: string
    material: string
    warranty: string
    rgb: boolean
    liquidCooling: boolean
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

function CoolingPage() {
  const navigate = useNavigate()
  const [selectedCooling, setSelectedCooling] = useState<CoolingItem | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 50000000])
  const [searchTerm, setSearchTerm] = useState('')
  const [coolers, setCoolers] = useState<CoolingItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch Cooling (category_id = 8) – giống pattern trang RAM
  useEffect(() => {
    const fetchCoolers = async () => {
      setLoading(true)
      try {
        const products = await ApiService.getProductsByCategory(8)

        const formatted: CoolingItem[] = (products || []).map((item: Record<string, unknown>) => {
          const specsString = String(item.specs || '')

          const typeField = item.type || (specsString.match(/(AIR|LIQUID)/i)?.[0] ?? '')
          const socketField = item.socket || (specsString.match(/(AM\d+|AM\d+\+|LGA\d+)/i)?.[0] ?? '')
          const fanSizeField = item.fan_size ?? item.fanSize ?? (specsString.match(/(120|140|92)mm/i)?.[0] ?? '')
          const fanCountField = item.fan_count ?? item.fanCount ?? (specsString.match(/(\d+)\s*fans?/i)?.[1] ?? '')
          const noiseField = item.noise_level || (specsString.match(/(\d+\.?\d*)\s*dB(A)?/i)?.[0] ?? '')
          const tdpField = item.tdp_watt ?? item.tdpWatt ?? (specsString.match(/(\d+)\s*W/i)?.[1] ?? '')
          const heightField = item.height || (specsString.match(/(\d+\.?\d*)\s*mm\s*height/i)?.[1] ?? '')
          const weightField = item.weight || (specsString.match(/(\d+\.?\d*)\s*g/i)?.[1] ?? '')
          const materialField = item.material || (specsString.match(/(ALUMINUM|COPPER|NICKEL)/i)?.[0] ?? '')
          const warrantyField = item.warranty || (specsString.match(/(\d+)\s*year/i)?.[1] ?? '')

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
          console.log(`Cooling: ${item.name}, productPrices:`, productPrices, 'priceRange:', priceRange)

          return {
            id: Number(item.id) || 0,
            name: String(item.name) || 'Unknown Cooling',
            brand: String(item.brand) || 'Unknown',
            price: priceRange,
            image: String(item.image_url1 || item.imageUrl1 || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop'),
            specs: {
              type: typeField ? String(typeField).toUpperCase() : 'Unknown',
              socket: socketField ? String(socketField).toUpperCase() : 'Unknown',
              fanSize: fanSizeField ? `${String(fanSizeField).toUpperCase()}` : 'Unknown',
              fanCount: fanCountField ? String(fanCountField) : 'Unknown',
              noiseLevel: noiseField ? String(noiseField).toUpperCase() : 'Unknown',
              tdp: tdpField ? `${String(tdpField)}W` : 'Unknown',
              height: heightField ? `${String(heightField)}mm` : 'Unknown',
              weight: weightField ? `${String(weightField)}g` : 'Unknown',
              material: materialField ? String(materialField).toUpperCase() : 'Unknown',
              warranty: warrantyField ? `${String(warrantyField)} Years` : 'Unknown',
              rgb: Boolean(item.rgb ?? true),
              liquidCooling: Boolean(item.liquid_cooling ?? item.liquidCooling ?? false),
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

        setCoolers(formatted)
      } catch (err) {
        console.error('Error fetching Cooling:', err)
        setCoolers([])
      } finally {
        setLoading(false)
      }
    }

    fetchCoolers()
  }, [])

  // Dữ liệu từ API
  const allCoolers = coolers

  // Filter logic
  const filteredCoolers = allCoolers.filter((coolerItem) => {
    // Price filter - parse min price từ price range string
    if (coolerItem.price !== 'Liên hệ') {
      // Lấy min price từ string (ví dụ: "19.900.000 - 20.990.000 VND" -> 19900000)
      const minPriceMatch = coolerItem.price.match(/^([\d.,]+)/)
      if (minPriceMatch) {
        const minPrice = parseInt(minPriceMatch[1].replace(/[.,]/g, ''))
        if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
          return false
        }
      }
    }

    // Search filter
    if (searchTerm && !coolerItem.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !coolerItem.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="page bg-grid bg-radial">
      <div className="layout">

        <main className="main">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Products</span>
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
              <span className="font-medium text-white">Cooling</span>
            </div>
            <div className="flex items-center gap-3">
              <select className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm border border-white/20"><option>Default</option></select>
              <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm w-48 border border-white/20 placeholder-white/60" />
            </div>
          </div>

          <div className="flex">
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
              </div>
            </div>

            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'hidden' }}>
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-white/70">Đang tải dữ liệu Cooling...</div>
                </div>
              )}

              {filteredCoolers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-white/70 mb-4">
                    {coolers.length === 0 ? 'Không có Cooling nào trong database' : 'Không tìm thấy Cooling nào phù hợp'}
                  </div>
                  <div className="text-sm text-white/50 mb-4">
                    {coolers.length === 0 ? 'Vui lòng thêm Cooling vào database' : 'Thử điều chỉnh bộ lọc hoặc tìm kiếm khác'}
                  </div>
                </div>
              ) : (
                <div className="product-grid">
                  {filteredCoolers.map((coolerItem) => (
                    <div key={coolerItem.id} className="rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition cursor-pointer" onClick={() => navigate(`/products/cooling/${coolerItem.id}`)}>
                      <div className="p-4">
                        <img src={coolerItem.image} alt={coolerItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                        <div className="text-sm font-medium mb-2 line-clamp-2 text-white">{coolerItem.name}</div>
                        <div className="text-lg font-bold mb-3 text-white">
                          {coolerItem.price}
                        </div>
                        <div className="space-y-1 text-xs text-white/60 mb-4">
                          <div className="flex justify-between"><span>Type:</span><span className="text-white">{coolerItem.specs.type}</span></div>
                          <div className="flex justify-between"><span>Socket:</span><span className="text-white">{coolerItem.specs.socket}</span></div>
                          <div className="flex justify-between"><span>Fan Size:</span><span className="text-white">{coolerItem.specs.fanSize}</span></div>
                          <div className="flex justify-between"><span>Fan Count:</span><span className="text-white">{coolerItem.specs.fanCount}</span></div>
                          <div className="flex justify-between"><span>TDP:</span><span className="text-white">{coolerItem.specs.tdp}</span></div>
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
      {selectedCooling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedCooling.name}</h2>
                  <p className="text-lg text-white/70">{selectedCooling.brand}</p>
                </div>
                <button
                  onClick={() => setSelectedCooling(null)}
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
                    src={selectedCooling.image}
                    alt={selectedCooling.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{selectedCooling.price}</div>
                  
                  {/* Hiển thị giá từ nhiều suppliers */}
                  {selectedCooling.productPrices && selectedCooling.productPrices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-white">Giá từ các nhà cung cấp</h3>
                      <div className="space-y-2">
                        {selectedCooling.productPrices
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
                      {Object.entries(selectedCooling.specs).map(([key, value]) => (
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
                      {selectedCooling.features.map((feature, index) => (
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
                        selectedCooling.inStock 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                      disabled={!selectedCooling.inStock}
                    >
                      {selectedCooling.inStock ? '+ Add to build' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoolingPage


