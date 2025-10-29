import { useEffect, useRef, useState } from 'react'
import { chatService } from '../../services/chat'
import type { ChatMessage } from '../../services/chat'
import { ApiService } from '../../services/api'

interface Conversation {
  id: number
  userId: number
  staffId: number
  status: string
  createdAt: string
  updatedAt: string
  userFullname?: string
  userEmail?: string
  userPhone?: string
  staffFullname?: string
  staffEmail?: string
}

function StaffChatPage() {
  const currentUser = ApiService.getCurrentUser() as Record<string, unknown>
  const staffId = Number(currentUser?.id || currentUser?.userId || 0)
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  // Load danh sách conversation
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      // Sử dụng API mới để lấy conversation với thông tin user
      const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').trim()
      const response = await fetch(`${API_BASE}/api/conversations/all-with-user-info`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data || [])
        console.log('Loaded conversations with user info:', data)
      } else {
        console.error('Failed to load conversations:', response.status)
        // Fallback về API cũ nếu API mới không hoạt động
        const fallbackResponse = await fetch(`${API_BASE}/api/conversations/all`)
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setConversations(fallbackData || [])
          console.log('Loaded conversations (fallback):', fallbackData)
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeConversationId) return
    const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').trim()
    fetch(`${API_BASE}/api/chat/history/${activeConversationId}`)
      .then(r => r.json())
      .then((data: ChatMessage[]) => setMessages(data || []))
      .catch(() => {})
  }, [activeConversationId])

  useEffect(() => {
    if (!activeConversationId) return
    const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').trim()
    chatService.connect(API_BASE, activeConversationId, (msg) => {
      setMessages(prev => [...prev, msg])
    })
    return () => chatService.disconnect()
  }, [activeConversationId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = () => {
    if (!input.trim() || !activeConversationId) return
    chatService.send(activeConversationId, {
      senderId: staffId,
      receiverId: 0,
      content: input.trim(),
      senderRole: 'STAFF',
    })
    setInput('')
  }

  // Lấy tên hiển thị của staff
  const staffDisplayName = currentUser?.fullname || currentUser?.username || 'Nhân viên'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl border border-white/20 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {(staffDisplayName as string).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Hỗ trợ khách hàng</h1>
                  <p className="text-white/70">Xin chào, {staffDisplayName as string}!</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={loadConversations} 
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang tải...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Làm mới</span>
                    </div>
                  )}
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/70 text-sm">Đang trực tuyến</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Danh sách conversation */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-bold mb-4 text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Cuộc trò chuyện
              </h2>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-white/50 text-sm">Chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        activeConversationId === conv.id 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                          : 'bg-white/5 hover:bg-white/10 text-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            KH
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {conv.userFullname || `Khách hàng #${conv.userId}`}
                          </div>
                          <div className="text-xs opacity-70">
                            {conv.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'} • {new Date(conv.updatedAt).toLocaleDateString('vi-VN')}
                          </div>
                          {conv.userEmail && (
                            <div className="text-xs opacity-50 truncate">
                              {conv.userEmail}
                            </div>
                          )}
                        </div>
                        {activeConversationId === conv.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat area */}
            <div className="lg:col-span-3">
              {activeConversationId ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl border border-white/20 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(() => {
                            const activeConv = conversations.find(c => c.id === activeConversationId)
                            return activeConv?.userFullname ? 
                              (activeConv.userFullname as string).charAt(0).toUpperCase() : 'KH'
                          })()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {(() => {
                            const activeConv = conversations.find(c => c.id === activeConversationId)
                            return (activeConv?.userFullname as string) || `Khách hàng #${activeConversationId}`
                          })()}
                        </h3>
                        <p className="text-white/70 text-sm">Đang trực tuyến</p>
                        {(() => {
                          const activeConv = conversations.find(c => c.id === activeConversationId)
                          return activeConv?.userEmail ? (
                            <p className="text-white/50 text-xs">{activeConv.userEmail}</p>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div ref={listRef} className="bg-white/5 backdrop-blur-lg border-x border-white/20 p-6 h-[50vh] overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <p className="text-white/50 text-lg">Chưa có tin nhắn nào</p>
                          <p className="text-white/30 text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((m, i) => (
                          <div key={i} className={`flex ${m.senderRole === 'STAFF' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${m.senderRole === 'STAFF' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              {/* Avatar */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                m.senderRole === 'STAFF' 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                  : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                              }`}>
                                {m.senderRole === 'STAFF' ? 'NV' : 'KH'}
                              </div>
                              
                              {/* Message */}
                              <div className={`px-4 py-3 rounded-2xl ${
                                m.senderRole === 'STAFF' 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                                  : 'bg-white/20 text-white rounded-bl-md backdrop-blur-sm'
                              }`}>
                                <p className="text-sm leading-relaxed">{m.content}</p>
                                <p className={`text-xs mt-1 ${
                                  m.senderRole === 'STAFF' ? 'text-blue-100' : 'text-white/50'
                                }`}>
                                  {m.sentAt ? new Date(m.sentAt).toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : 'Vừa xong'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-b-2xl border border-white/20 p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input 
                          value={input} 
                          onChange={e => setInput(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' ? send() : undefined} 
                          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="Nhập tin nhắn phản hồi..." 
                        />
                      </div>
                      <button 
                        onClick={send} 
                        disabled={!input.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>Gửi</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12 text-center">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Chọn cuộc trò chuyện</h3>
                  <p className="text-white/70">Hãy chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu hỗ trợ khách hàng</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffChatPage


