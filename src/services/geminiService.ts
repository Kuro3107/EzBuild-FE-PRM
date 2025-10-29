import { ApiService } from './api'

export interface ChatMessage {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
}

// Database câu trả lời offline
const offlineResponses = {
  greeting: [
    'Xin chào! Tôi là AI Assistant chuyên về PC Builder của EzBuild. Tôi có thể tư vấn về linh kiện PC, so sánh hiệu năng, và giúp bạn build PC phù hợp nhất. Bạn muốn hỏi gì về PC?',
    'Chào bạn! Tôi là AI của EzBuild, chuyên tư vấn về linh kiện PC và PC Builder. Bạn cần tư vấn gì về PC hôm nay?',
    'Hello! Tôi là AI Assistant EzBuild. Hãy hỏi tôi về CPU, GPU, RAM, hoặc bất cứ điều gì liên quan đến PC!',
    'Chào mừng đến với EzBuild! Tôi là AI Assistant chuyên về PC. Tôi có thể giúp bạn tư vấn linh kiện, so sánh hiệu năng, hoặc build PC. Bạn cần hỗ trợ gì?'
  ],
  error: [
    'Xin lỗi, có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.',
    'Có vấn đề với dịch vụ AI. Hãy thử lại sau một chút nhé!',
  ]
}

export const sendMessage = async (
  message: string, 
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  console.log('🚀 sendMessage called with:', message)
  
  // Kiểm tra câu chào trước - chỉ câu chào mới dùng offline response
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('xin chào')) {
    console.log('📝 Using greeting response')
    return offlineResponses.greeting[Math.floor(Math.random() * offlineResponses.greeting.length)]
  }

  // ====== Ý ĐỊNH MIỀN PC: sản phẩm mạnh nhất, gợi ý cấu hình ======
  const strongestPatterns = ['mạnh nhất', 'đỉnh nhất', 'xịn nhất', 'top', 'best', 'cao cấp nhất']
  const isStrongestQuery = strongestPatterns.some(p => lowerMessage.includes(p))
  const mentionCPU = ['cpu', 'vi xử lý', 'processor', 'intel', 'amd', 'ryzen', 'core i'].some(p => lowerMessage.includes(p))
  const mentionGPU = ['gpu', 'vga', 'card màn hình', 'card đồ họa', 'geforce', 'rtx', 'radeon'].some(p => lowerMessage.includes(p))

  type AnyProduct = { name?: string; productPrices?: Array<{ price?: number }> }

  async function getTopByCategory(categoryId: number, label: string): Promise<string> {
    try {
      const products = await ApiService.getProductsByCategory(categoryId)
      if (!Array.isArray(products) || products.length === 0) {
        return `Hiện chưa có ${label} trong database để tư vấn.`
      }

      const scoreOf = (p: Record<string, unknown>): number => {
        const prod = p as unknown as AnyProduct
        const name = String(prod.name || '')
        const prices = Array.isArray(prod.productPrices) ? prod.productPrices.map(x => Number(x.price || 0)) : []
        const maxPrice = prices.length ? Math.max(...prices) : 0
        let bonus = 0
        if (label === 'CPU' && /i9|ryzen\s*9|threadripper/i.test(name)) bonus += 1_000_000_000
        if (label === 'GPU' && /4090|4080|7900\s*xtx|7900\s*xt/i.test(name)) bonus += 1_000_000_000
        return maxPrice + bonus
      }

      const sorted = [...products].sort((a, b) => scoreOf(b) - scoreOf(a))
      const top = sorted[0] as Record<string, unknown>
      const topProd = top as unknown as AnyProduct
      const name = String(topProd.name || 'Unknown')
      const prices = Array.isArray(topProd.productPrices) ? topProd.productPrices.map(x => Number(x.price || 0)) : []
      const minPrice = prices.length ? Math.min(...prices) : 0
      const maxPrice = prices.length ? Math.max(...prices) : 0
      const priceText = prices.length
        ? (minPrice === maxPrice ? `${maxPrice.toLocaleString('vi-VN')} VND` : `${minPrice.toLocaleString('vi-VN')} - ${maxPrice.toLocaleString('vi-VN')} VND`)
        : 'Liên hệ'

      return `Theo dữ liệu hiện có, ${label} mạnh nhất là: ${name}${priceText ? ` (tầm giá ${priceText})` : ''}. Bạn có muốn xem chi tiết hoặc gợi ý cấu hình kèm theo không?`
    } catch (e) {
      console.error('AI strongest lookup error:', e)
      return `Không lấy được dữ liệu ${label}. Bạn thử lại sau giúp mình nhé.`
    }
  }

  if (isStrongestQuery && mentionCPU) {
    return await getTopByCategory(1, 'CPU')
  }
  if (isStrongestQuery && mentionGPU) {
    return await getTopByCategory(2, 'GPU')
  }

  // Gợi ý cấu hình theo nhu cầu
  const isGaming = /(chơi game|gaming|fps|esports|valorant|cs2|lol)/i.test(message)
  const isOffice = /(văn phòng|office|word|excel|ppt|lướt web)/i.test(message)
  const isCreator = /(đồ họa|render|premiere|after effects|photoshop|blender|3d|ai model)/i.test(message)
  if (isGaming || isOffice || isCreator) {
    const rec = isOffice
      ? `Cấu hình văn phòng đề xuất:\n- CPU: 6 nhân (Core i5 / Ryzen 5)\n- RAM: 16GB\n- Ổ cứng: SSD NVMe 500GB\n- GPU: iGPU hoặc GTX 1650 nếu cần đa màn hình\n- PSU: 500W 80+ Bronze\n- Case: mATX nhỏ gọn\nBạn cho mình ngân sách (VND) để gợi ý chi tiết?`
      : isGaming
      ? `Cấu hình gaming theo 3 mức:\n- Tiết kiệm: CPU 6–8 nhân, RAM 16GB, GPU RTX 3060 / RX 6600, SSD 1TB, PSU 550–650W.\n- Cân bằng: CPU 8–12 nhân, RAM 32GB, GPU RTX 4070 / RX 7800 XT, SSD 1TB Gen4, PSU 650–750W.\n- Cao cấp: CPU 12–16 nhân, RAM 32–64GB, GPU RTX 4080/4090 hoặc RX 7900 XTX, SSD 2TB Gen4, PSU 850–1000W.\nHãy cho mình độ phân giải (1080p/1440p/4K) và FPS mục tiêu để chốt cấu hình cụ thể.`
      : `Cấu hình dựng phim/đồ họa đề xuất:\n- CPU: 12–24 nhân (Core i7/i9 hoặc Ryzen 7/9)\n- RAM: 32–64GB\n- GPU: RTX 4070 trở lên (NVENC/Studio) hoặc RX 7900 series\n- Ổ cứng: SSD NVMe Gen4 1–2TB + HDD lưu trữ nếu cần\n- PSU: 750–1000W 80+ Gold\n- Màn hình: 2 màn hình 2K/4K nếu đa nhiệm\nBạn cho mình phần mềm chính và ngân sách để gợi ý chi tiết nhé.`
    return rec
  }

  // 3) Gợi ý cấu hình theo ngân sách: "tôi có X triệu" / "budget X VND"
  const budgetMatchTriệu = lowerMessage.match(/(\d+[.,]?\d*)\s*triệu/)
  const budgetMatchVnd = lowerMessage.match(/(\d+[.,]?\d*)\s*(vnđ|vnd|đ|dong|đồng)/)
  const normalizeNumber = (raw: string) => Number(raw.replace(/\./g, '').replace(/,/g, '.'))
  let budgetVnd = 0
  if (budgetMatchTriệu) budgetVnd = Math.round(normalizeNumber(budgetMatchTriệu[1]) * 1_000_000)
  else if (budgetMatchVnd) budgetVnd = Math.round(normalizeNumber(budgetMatchVnd[1]))

  if (budgetVnd > 0) {
    // Phân bổ ngân sách theo tỷ lệ tham khảo
    const alloc = (pct: number) => Math.round((budgetVnd * pct) / 100_000) * 100_000
    const isSmall = budgetVnd < 15_000_000
    const lines = [
      `Ngân sách ~${budgetVnd.toLocaleString('vi-VN')} VND, gợi ý phân bổ:`,
      `- CPU: ${alloc(isSmall ? 25 : 20).toLocaleString('vi-VN')} VND`,
      `- GPU: ${alloc(isSmall ? 30 : 40).toLocaleString('vi-VN')} VND`,
      `- RAM (16–32GB): ${alloc(10).toLocaleString('vi-VN')} VND`,
      `- SSD NVMe: ${alloc(8).toLocaleString('vi-VN')} VND`,
      `- Mainboard: ${alloc(8).toLocaleString('vi-VN')} VND`,
      `- PSU 80+ Bronze/Gold: ${alloc(8).toLocaleString('vi-VN')} VND`,
      `- Case + Tản: ${alloc(6).toLocaleString('vi-VN')} VND`,
      `Bạn cho mình nhu cầu (game/phần mềm, độ phân giải, ưu tiên im lặng/nhỏ gọn/đẹp) để chốt mã linh kiện cụ thể từ kho dữ liệu nhé.`
    ]
    return lines.join('\n')
  }

  // 4) Hỏi "mạnh nhất" cho các danh mục khác: RAM/SSD/PSU/Mainboard/Monitor/Case/Cooling/Keyboard/Mouse/Headset
  if (isStrongestQuery) {
    // Tra cứu category theo tên từ backend để không phụ thuộc ID cứng
    const keywordMap: Array<{ keys: string[]; label: string }> = [
      { keys: ['ram', 'memory'], label: 'RAM' },
      { keys: ['ssd', 'hdd', 'storage', 'ổ cứng'], label: 'Storage' },
      { keys: ['psu', 'nguồn'], label: 'PSU' },
      { keys: ['mainboard', 'motherboard', 'bo mạch chủ'], label: 'Mainboard' },
      { keys: ['monitor', 'màn hình'], label: 'Monitor' },
      { keys: ['case', 'vỏ máy'], label: 'Case' },
      { keys: ['cooling', 'tản', 'tản nhiệt', 'aio', 'air'], label: 'Cooling' },
      { keys: ['keyboard', 'bàn phím'], label: 'Keyboard' },
      { keys: ['mouse', 'chuột'], label: 'Mouse' },
      { keys: ['headset', 'tai nghe', 'loa', 'speaker'], label: 'Headset/Speaker' },
    ]

    const hit = keywordMap.find(item => item.keys.some(k => lowerMessage.includes(k)))
    if (hit) {
      try {
        const categories = await ApiService.getCategories()
        const found = (categories || []).find((c: Record<string, unknown>) =>
          String((c as Record<string, unknown>).name || (c as Record<string, unknown>).categoryName || '').toLowerCase().includes(hit.label.toLowerCase())
        )
        if (!found || found.id == null) {
          return `Mình chưa xác định được danh mục "${hit.label}" trong database để tra cứu. Bạn có thể mở trang sản phẩm tương ứng và thử lại.`
        }
        return await getTopByCategory(Number((found as Record<string, unknown>).id as number), hit.label)
      } catch (e) {
        console.error('Category resolve failed:', e)
        return `Không lấy được danh mục "${hit.label}" từ server. Bạn thử lại sau giúp mình nhé.`
      }
    }
  }

  try {
    console.log('✅ Calling backend AI API')
    
    // Convert chat history to backend format
    const history = chatHistory
      .filter(msg => msg.text && !msg.text.toLowerCase().includes('xin chào'))
      .map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      }))
    
    console.log('📤 Sending request to backend:', { message, historyLength: history.length })
    
    // Call backend API
    const response = await ApiService.sendAIChatMessage(message, history)
    
    console.log('✅ Received response from backend AI:', response.substring(0, 100) + '...')
    
    return response
  } catch (error: unknown) {
    console.error('❌ Lỗi khi gọi backend AI API:', error)
    
    // Type guard for Error object
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name
      })
      
      // Phân loại lỗi và xử lý phù hợp
      if (error.message.includes('Failed to fetch')) {
        return "Xin lỗi, không thể kết nối với server. Vui lòng kiểm tra kết nối mạng."
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        return "Xin lỗi, bạn cần đăng nhập để sử dụng tính năng AI."
      }
    }
    
    // Fallback về offline mode
    console.log('Chuyển sang offline mode do lỗi API')
    return offlineResponses.error[Math.floor(Math.random() * offlineResponses.error.length)]
  }
}

export default sendMessage
