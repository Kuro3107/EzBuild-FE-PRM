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

function UserChatPage() {
  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080'
  const currentUser = ApiService.getCurrentUser() as Record<string, unknown>
  const userId = Number(currentUser?.id || currentUser?.userId || 0)
  const [staffId] = useState<number>(0) // optional: nếu chưa có staff cụ thể
  const [conversationId, setConversationId] = useState<number | null>(null) // Sẽ được set sau khi load conversation
  const [conversation, setConversation] = useState<Conversation | null>(null) // Lưu thông tin conversation
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false) // Indicator cho việc gửi tin nhắn
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Chỉ load history nếu có userId hợp lệ
    if (!userId || userId === 0) {
      console.log('Chưa có userId hợp lệ, không thể load history')
      return
    }
    
    // Trước tiên, lấy conversation của user
    const conversationUrl = `${apiBase.replace(/^:\/\//, 'http://').replace(/^(?!https?:)/, 'http://')}/api/conversations/by-user/${userId}`
    console.log('Loading conversation từ:', conversationUrl)
    
    fetch(conversationUrl)
      .then(async (r) => {
        if (!r.ok) {
          console.log('Lỗi load conversation:', r.status, r.statusText)
          return []
        }
        try { 
          const conversations = await r.json()
          console.log('Loaded conversations:', conversations)
          return conversations
        } catch (e) { 
          console.error('Error parsing conversations:', e)
          return []
        }
      })
      .then((conversations: any[]) => {
        if (conversations && conversations.length > 0) {
          const conversationData = conversations[0] // Lấy conversation đầu tiên
          const conversationId = conversationData.id
          console.log('Found conversation ID:', conversationId)
          
          // Set conversation ID và conversation data để sử dụng cho WebSocket
          setConversationId(conversationId)
          setConversation(conversationData)
          
          // Load chat history với conversation ID thực
          const historyUrl = `${apiBase.replace(/^:\/\//, 'http://').replace(/^(?!https?:)/, 'http://')}/api/chat/history/${conversationId}`
          console.log('Loading chat history từ:', historyUrl)
          
          return fetch(historyUrl)
        } else {
          console.log('Không tìm thấy conversation cho user:', userId)
          // Tạo conversation mới nếu chưa có
          const createUrl = `${apiBase.replace(/^:\/\//, 'http://').replace(/^(?!https?:)/, 'http://')}/api/conversations/open/${userId}`
          console.log('Creating new conversation từ:', createUrl)
          
          return fetch(createUrl, { method: 'POST' })
        }
      })
      .then(async (r) => {
        if (!r.ok) {
          console.log('Lỗi load history:', r.status, r.statusText)
          return [] as ChatMessage[]
        }
        try { 
          const data = await r.json()
          console.log('Loaded chat history:', data)
          return data as unknown 
        } catch (e) { 
          console.error('Error parsing history:', e)
          return [] as ChatMessage[] 
        }
      })
      .then((data: unknown) => {
        setMessages(Array.isArray(data) ? (data as ChatMessage[]) : [])
      })
      .catch((e) => {
        console.error('Error loading history:', e)
        setMessages([])
      })
  }, [apiBase, userId])

  useEffect(() => {
    // Chỉ connect nếu có conversationId hợp lệ
    if (!conversationId) {
      console.log('Chưa có conversationId, không thể connect WebSocket')
      return
    }
    
    console.log('=== WEBSOCKET CONNECTION DEBUG ===')
    console.log('API Base:', apiBase)
    console.log('User ID:', userId)
    console.log('Conversation ID:', conversationId)
    console.log('Connecting WebSocket với conversationId:', conversationId)
    
    chatService.connect(apiBase, conversationId, (msg) => {
      console.log('=== RECEIVED MESSAGE ===')
      console.log('Tin nhắn mới từ WebSocket:', msg)
      setMessages(prev => {
        console.log('Previous messages:', prev.length)
        const newMessages = [...prev, msg]
        console.log('New messages count:', newMessages.length)
        return newMessages
      })
      
      // Reset sending state khi nhận được tin nhắn
      setIsSending(false)
    })
    
    return () => {
      console.log('Disconnecting WebSocket')
      chatService.disconnect()
    }
  }, [apiBase, conversationId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = () => {
    if (!input.trim() || isSending) return
    
    // Đảm bảo có userId và conversationId hợp lệ
    if (!userId || userId === 0) {
      console.error('User ID không hợp lệ:', userId)
      return
    }
    
    if (!conversationId) {
      console.error('Conversation ID không hợp lệ:', conversationId)
      return
    }
    
    console.log('Gửi tin nhắn với conversationId:', conversationId, 'userId:', userId)
    
    // Lưu nội dung tin nhắn và set sending state
    const messageContent = input.trim()
    setInput('') // Clear input ngay lập tức
    setIsSending(true) // Set sending state
    
    // Gửi qua WebSocket - tin nhắn sẽ hiển thị khi WebSocket trả về
    chatService.send(conversationId, {
      senderId: userId,
      receiverId: staffId,
      content: messageContent,
      senderRole: 'USER',
    })
    
    // Reset sending state sau một khoảng thời gian ngắn
    setTimeout(() => setIsSending(false), 1000)
  }

  // Lấy tên hiển thị của user
  const userDisplayName = currentUser?.fullname || currentUser?.username || 'Khách hàng'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg rounded-t-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {(userDisplayName as string).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Trò chuyện với {(conversation?.staffFullname as string) || 'nhân viên'}
                  </h1>
                  <p className="text-white/70">Xin chào, {userDisplayName as string}!</p>
                  {conversation?.staffEmail ? (
                    <p className="text-white/50 text-sm">{conversation.staffEmail}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/70 text-sm">Đang trực tuyến</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={listRef} className="bg-white/5 backdrop-blur-lg border-x border-white/20 p-6 h-[60vh] overflow-y-auto">
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
                  <div key={i} className={`flex ${m.senderRole === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${m.senderRole === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        m.senderRole === 'USER' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                          : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                      }`}>
                        {m.senderRole === 'USER' ? (userDisplayName as string).charAt(0).toUpperCase() : 'NV'}
                      </div>
                      
                      {/* Message */}
                      <div className={`px-4 py-3 rounded-2xl ${
                        m.senderRole === 'USER' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                          : 'bg-white/20 text-white rounded-bl-md backdrop-blur-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{m.content}</p>
                        <p className={`text-xs mt-1 ${
                          m.senderRole === 'USER' ? 'text-blue-100' : 'text-white/50'
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
                  placeholder="Nhập tin nhắn của bạn..." 
                  disabled={isSending}
                />
              </div>
              <button 
                onClick={send} 
                disabled={isSending || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {isSending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang gửi...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Gửi</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserChatPage


