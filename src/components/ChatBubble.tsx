import { useState, useEffect, useRef } from 'react'
import { chatService, type ChatRoom } from '../services/chatService'

interface ChatBubbleProps {
  className?: string
}

/**
 * Component ChatBubble - Bubble chat ở góc trái màn hình
 * Hiển thị số tin nhắn chưa đọc và mở chat window khi click
 */
function ChatBubble({ className = '' }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true) // Luôn hiển thị
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Subscribe để lắng nghe thay đổi unread count
    const unsubscribe = chatService.subscribeToRooms((rooms: ChatRoom[]) => {
      const total = rooms.reduce((sum, room) => sum + room.unreadCount, 0)
      setUnreadCount(total)
      
      // Luôn hiển thị bubble
      setIsVisible(true)
    })

    // Hiển thị bubble ngay lập tức
    setIsVisible(true)

    return () => {
      unsubscribe()
    }
  }, [isOpen])

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
    if (!isOpen) {
      // Đánh dấu tất cả tin nhắn là đã đọc khi mở chat
      chatService.getAllRooms().forEach(room => {
        chatService.markRoomAsRead(room.id)
      })
    }
  }

  // Load current user properly
  const [currentUser, setCurrentUser] = useState(chatService.getCurrentUser())
  
  useEffect(() => {
    // Reload user data when component mounts
    const user = chatService.getCurrentUser()
    setCurrentUser(user)
    console.log('ChatBubble - Current user:', user)
  }, [])
  
  const userRole = currentUser?.role || 'Customer'

  // Hiển thị chat bubble cho tất cả user

  return (
    <div 
      ref={bubbleRef}
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      style={{ display: 'block' }}
    >
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-gray-50 rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Chat Bubble */}
      <button
        onClick={handleBubbleClick}
        className={`relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group ${
          userRole === 'Staff' 
            ? 'bg-gradient-to-br from-green-500 to-green-600' 
            : userRole === 'Admin'
            ? 'bg-gradient-to-br from-red-500 to-red-600'
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}
      >
        {/* Icon Chat */}
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* Online Indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        {userRole === 'Staff' || userRole === 'Admin' ? 'Chat với khách hàng' : 'Chat với nhân viên'}
      </div>
    </div>
  )
}

/**
 * Component ChatWindow - Cửa sổ chat chính
 */
interface ChatWindowProps {
  onClose: () => void
}

function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [currentUser, setCurrentUser] = useState(chatService.getCurrentUser())
  
  useEffect(() => {
    // Reload user data when component mounts
    const user = chatService.getCurrentUser()
    setCurrentUser(user)
    console.log('ChatWindow - Current user:', user)
  }, [])
  const roomId = chatService.createStaffCustomerRoom()

  useEffect(() => {
    // Load messages từ room hiện tại
    const room = chatService.getRoom(roomId)
    if (room) {
      setMessages(room.messages)
    }

    // Subscribe để lắng nghe tin nhắn mới
    const unsubscribe = chatService.subscribeToMessages((receivedRoomId, message) => {
      if (receivedRoomId === roomId) {
        setMessages(prev => [...prev, message])
        scrollToBottom()
      }
    })

    return unsubscribe
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    console.log('Attempting to send message:', { roomId, newMessage, currentUser })
    
    const message = chatService.sendMessage(roomId, newMessage)
    console.log('Message sent result:', message)
    
    if (message) {
      setMessages(prev => [...prev, message])
      setNewMessage('')
      scrollToBottom()
    } else {
      console.log('Failed to send message')
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Staff': return 'bg-green-500'
      case 'Admin': return 'bg-red-500'
      case 'Customer': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'Staff': return 'Nhân viên'
      case 'Admin': return 'Quản trị viên'
      case 'Customer': return 'Khách hàng'
      default: return 'Người dùng'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {currentUser?.role === 'Staff' ? 'Chat với khách hàng' : 'Chat với nhân viên'}
            </h3>
            <p className="text-xs opacity-90">Trực tuyến</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          style={{ color: '#1f2937' }}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.225 4.811a1 1 0 00-1.414 1.414L10.586 12 4.81 17.775a1 1 0 101.414 1.414L12 13.414l5.775 5.775a1 1 0 001.414-1.414L13.414 12l5.775-5.775a1 1 0 00-1.414-1.414L12 10.586 6.225 4.811z"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-700 text-sm py-8">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Chưa có tin nhắn nào</p>
            <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUser?.id
            return (
              <div key={`${message.id}_${index}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwn 
                    ? 'bg-blue-500 text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                }`}>
                  {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full ${getRoleColor(message.senderRole)} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">
                          {message.senderRole.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-gray-600">
                        ({getRoleText(message.senderRole)})
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-900">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default ChatBubble
