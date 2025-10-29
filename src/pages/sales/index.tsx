import { useState, useEffect, useCallback } from 'react'
import ApiService from '../../services/api'
import '../../Homepage.css'

interface SalesItem {
  id: number
  title: string
  category: string
  price: number
  originalPrice?: number
  image: string
  specs: {
    brand: string
    model: string
    specifications: string
    retailer: string
    availability: string
    shipping: string
    warranty: string
    condition: string
  }
  features: string[]
  rating: number
  reviews: number
  inStock: boolean
  description: string
  datePosted: string
  dealType: string
}

interface ApiSalesItem {
  id: number
  name: string
  category?: {
    id: number
    name: string
  }
  price: number
  originalPrice?: number
  image?: string
  brand?: string
  model?: string
  specifications?: string
  retailer?: string
  availability?: string
  shipping?: string
  warranty?: string
  condition?: string
  features?: string[]
  rating?: number
  reviews?: number
  inStock?: boolean
  description?: string
  createdAt?: string
  dealType?: string
  productPrices?: Array<{
    id: number
    price: number
    supplier: string
    url?: string
    availability?: string
  }>
}

function SalesPage() {
  const [selectedBuild, setSelectedBuild] = useState<SalesItem | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [allDeals, setAllDeals] = useState<SalesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Popup states
  const [showFilterPopup, setShowFilterPopup] = useState(false)

  // Function to convert API data to SalesItem format
  const convertApiDataToSalesItem = (apiItem: ApiSalesItem): SalesItem => {
    // Lấy giá tốt nhất từ productPrices nếu có
    let bestPrice = apiItem.price
    let bestRetailer = apiItem.retailer || 'Unknown'
    
    if (apiItem.productPrices && apiItem.productPrices.length > 0) {
      const lowestPriceItem = apiItem.productPrices.reduce((min, current) => 
        current.price < min.price ? current : min
      )
      bestPrice = lowestPriceItem.price
      bestRetailer = lowestPriceItem.supplier
    }

    return {
      id: apiItem.id,
      title: apiItem.name,
      category: apiItem.category?.name || 'Other',
      price: bestPrice,
      originalPrice: apiItem.originalPrice,
      image: apiItem.image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=200&fit=crop',
      specs: {
        brand: apiItem.brand || 'Unknown',
        model: apiItem.model || 'Unknown',
        specifications: apiItem.specifications || 'Không có thông tin chi tiết',
        retailer: bestRetailer,
        availability: apiItem.availability || 'In Stock',
        shipping: apiItem.shipping || 'Free Shipping',
        warranty: apiItem.warranty || '1 Year',
        condition: apiItem.condition || 'New'
      },
      features: apiItem.features || [],
      rating: apiItem.rating || 4.0,
      reviews: apiItem.reviews || 0,
      inStock: apiItem.inStock !== undefined ? apiItem.inStock : true,
      description: apiItem.description || `${apiItem.name} - Sản phẩm chất lượng cao với giá tốt nhất thị trường.`,
      datePosted: apiItem.createdAt ? new Date(apiItem.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
      dealType: apiItem.dealType || 'Sale'
    }
  }

  // Load sales data from API
  const loadSalesData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading sales data from API...')
      const apiData = await ApiService.getSales()
      
      // Convert API data to SalesItem format with proper type casting
      const convertedData = apiData.map((item: Record<string, unknown>) => 
        convertApiDataToSalesItem(item as unknown as ApiSalesItem)
      )
      
      console.log(`Loaded ${convertedData.length} sales items from API`)
      setAllDeals(convertedData)
    } catch (err) {
      console.error('Error loading sales data:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu sales')
      
      // Fallback to empty array on error
      setAllDeals([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    loadSalesData()
  }, [loadSalesData])

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      console.log('Refreshing sales data...')
      const apiData = await ApiService.refreshSales()
      
      // Convert API data to SalesItem format with proper type casting
      const convertedData = apiData.map((item: Record<string, unknown>) => 
        convertApiDataToSalesItem(item as unknown as ApiSalesItem)
      )
      
      console.log(`Refreshed ${convertedData.length} sales items`)
      setAllDeals(convertedData)
      setError(null)
    } catch (err) {
      console.error('Error refreshing sales data:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi làm mới dữ liệu')
    } finally {
      setIsRefreshing(false)
    }
  }


  // Filter logic
  const filteredDeals = allDeals.filter((dealItem) => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(dealItem.category)) {
      return false
    }

    return true
  })

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div className="page homepage-container">
      <div className="layout">
        {/* Main */}
        <main className="main">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-black/70 mb-2">
              <span>Sales</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">Product Sales</h1>
                <p className="text-black/60">Discover the latest deals and sales from r/buildapcsales</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowFilterPopup(true)}
                  className="bg-black/5 hover:bg-black/10 text-black px-4 py-2 rounded-md text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </button>
                    <button 
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                        isRefreshing 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-black/5 hover:bg-black/10 text-black'
                      }`}
                    >
                      <svg 
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải dữ liệu sales...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">Lỗi: {error}</p>
              </div>
              <button 
                onClick={loadSalesData}
                className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredDeals.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có deals nào</h3>
              <p className="text-gray-600 mb-4">
                {selectedCategories.length > 0 
                  ? `Không tìm thấy deals nào cho danh mục ${selectedCategories.join(', ')}`
                  : 'Hiện tại không có deals nào. Hãy thử lại sau.'
                }
              </p>
              {selectedCategories.length > 0 && (
                <button 
                  onClick={() => setSelectedCategories([])}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}

          {/* Deals List */}
          {!loading && !error && filteredDeals.length > 0 && (
            <div className="space-y-3">
              {filteredDeals.map((dealItem) => (
              <div key={dealItem.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-sm" onClick={() => setSelectedBuild(dealItem)}>
                <div className="flex items-center gap-4">
                  {/* Category Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {dealItem.category === 'GPU' ? 'GPU' : 
                         dealItem.category === 'Storage' ? 'SSD' : 
                         dealItem.category === 'Case' ? 'CASE' : 
                         dealItem.category === 'CPU' ? 'CPU' : 
                         dealItem.category === 'RAM' ? 'RAM' : 
                         dealItem.category === 'Motherboard' ? 'MB' :
                         dealItem.category === 'CPU Cooler' ? 'COOL' :
                         dealItem.category === 'Power Supply' ? 'PSU' :
                         dealItem.category === 'Case Fan' ? 'FAN' :
                         dealItem.category === 'Monitor' ? 'MON' :
                         dealItem.category === 'Mouse' ? 'MOU' :
                         dealItem.category === 'Keyboard' ? 'KEY' :
                         dealItem.category === 'Speaker' ? 'SPK' :
                         dealItem.category === 'Headphones' ? 'HP' :
                         dealItem.category === 'Thermal Compound' ? 'TC' :
                         dealItem.category === 'Operating System' ? 'OS' :
                         dealItem.category === 'Sound Card' ? 'SC' :
                         dealItem.category === 'Network Card' ? 'NC' :
                         dealItem.category === 'Microphone' ? 'MIC' :
                         dealItem.category === 'VR Headset' ? 'VR' :
                         dealItem.category === 'Capture Card' ? 'CC' :
                         dealItem.category === 'Webcam' ? 'CAM' :
                         dealItem.category === 'Accessory' ? 'ACC' :
                         dealItem.category === 'Other' ? 'OTH' : 'PC'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Category */}
                  <div className="flex-shrink-0 w-16">
                    <span className="text-gray-600 text-sm font-medium">{dealItem.category}</span>
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="text-gray-900 text-sm mb-1 font-medium">
                      {dealItem.title} - ${dealItem.price} ({dealItem.specs.retailer})
                    </div>
                    <div className="text-green-600 font-bold text-lg">
                      ${dealItem.price.toFixed(2)}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {dealItem.specs.retailer}
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="flex-shrink-0">
                    <span className="text-gray-500 text-sm">{dealItem.datePosted}</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </main>
      </div>

      {/* Deal Detail Modal */}
      {selectedBuild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedBuild.title}</h2>
                  <p className="text-lg text-gray-600">{selectedBuild.specs.brand} - {selectedBuild.specs.retailer}</p>
                </div>
                <button
                  onClick={() => setSelectedBuild(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <img
                    src={selectedBuild.image}
                    alt={selectedBuild.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-bold text-green-600">${selectedBuild.price}</div>
                    {selectedBuild.originalPrice && (
                      <div className="text-xl text-gray-500 line-through">${selectedBuild.originalPrice}</div>
                    )}
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-semibold">
                      {selectedBuild.dealType}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Deal Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedBuild.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium">{selectedBuild.specs.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Retailer:</span>
                        <span className="font-medium">{selectedBuild.specs.retailer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Condition:</span>
                        <span className="font-medium">{selectedBuild.specs.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Availability:</span>
                        <span className="font-medium">{selectedBuild.specs.availability}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date Posted:</span>
                        <span className="font-medium">{selectedBuild.datePosted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Specifications</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium">{selectedBuild.specs.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Specifications:</span>
                        <span className="font-medium">{selectedBuild.specs.specifications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="font-medium">{selectedBuild.specs.shipping}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Warranty:</span>
                        <span className="font-medium">{selectedBuild.specs.warranty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBuild.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-gray-600">{selectedBuild.description}</p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        selectedBuild.inStock 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!selectedBuild.inStock}
                    >
                      {selectedBuild.inStock ? 'View Deal' : 'Out of Stock'}
                    </button>
                    <button className="flex-1 border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                      Add to Wishlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Sales Modal */}
      {showFilterPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Filter Sales</h2>
                <button
                  onClick={() => setShowFilterPopup(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">Select the categories you want to see in your sales feed.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {['Case', 'CPU', 'Motherboard', 'GPU', 'RAM', 'CPU Cooler', 'Storage', 'Power Supply', 'Case Fan', 'Monitor', 'Mouse', 'Keyboard', 'Speaker', 'Headphones', 'Thermal Compound', 'Operating System', 'Sound Card', 'Network Card', 'Microphone', 'VR Headset', 'Capture Card', 'Webcam', 'Accessory', 'Other'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedCategories([])}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterPopup(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesPage
