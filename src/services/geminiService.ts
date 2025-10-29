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
