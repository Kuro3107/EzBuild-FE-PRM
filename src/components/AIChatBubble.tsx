import { useState, useEffect, useRef } from 'react'
import { sendMessage, type ChatMessage } from '../services/geminiService'

interface AIChatBubbleProps {
  className?: string
}

/**
 * Component AIChatBubble - Bubble chat AI ở góc phải màn hình
 * Hiển thị chat với AI Assistant để tư vấn PC Builder
 */
function AIChatBubble({ className = '' }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Xử lý click outside để đóng chat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleBubbleClick = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div 
      ref={bubbleRef}
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      style={{ display: 'block' }}
    >
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-gray-50 rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
          <AIChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Chat Bubble */}
      <button
        onClick={handleBubbleClick}
        className="relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group bg-gradient-to-br from-purple-500 to-pink-600"
      >
        {/* AI Icon */}
        <svg 
          className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          />
        </svg>

        {/* AI Indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-400 border-2 border-white rounded-full animate-pulse"></div>
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Chat với AI Assistant
      </div>
    </div>
  )
}

/**
 * Component AIChatWindow - Cửa sổ chat AI chính
 */
interface AIChatWindowProps {
  onClose: () => void
}

function AIChatWindow({ onClose }: AIChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Thêm tin nhắn chào mừng từ AI
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: 'Xin chào! Tôi là AI Assistant của EzBuild. Tôi có thể tư vấn về linh kiện PC, build cấu hình, và so sánh hiệu năng. Bạn cần hỗ trợ gì?',
      isBot: true,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      isBot: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsTyping(true)

    try {
      const aiResponse = await sendMessage(newMessage, messages)
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isBot: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.',
        isBot: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      scrollToBottom()
    }
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 !bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs opacity-90">Tư vấn PC Builder</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.225 4.811a1 1 0 00-1.414 1.414L10.586 12 4.81 17.775a1 1 0 101.414 1.414L12 13.414l5.775 5.775a1 1 0 001.414-1.414L13.414 12l5.775-5.775a1 1 0 00-1.414-1.414L12 10.586 6.225 4.811z"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((message, index) => {
          const isOwn = !message.isBot
          return (
            <div key={`${message.id}_${index}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                isOwn 
                  ? 'bg-purple-500 text-white rounded-br-sm' 
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
              }`}>
                {!isOwn && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <span className="text-xs font-medium text-gray-800">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  isOwn ? 'text-purple-100' : 'text-gray-600'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Hỏi AI về PC Builder..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isTyping}
            className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

export default AIChatBubble
