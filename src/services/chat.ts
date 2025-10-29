import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

// Tự định nghĩa type tối thiểu để tránh import runtime lỗi
type IMessage = { body: string }
type StompSubscription = { unsubscribe: () => void }

export type ChatMessage = {
  id?: number
  conversationId: number
  senderId: number
  receiverId: number
  content: string
  sentAt?: string
  senderRole: 'USER' | 'STAFF'
}

class ChatService {
  private client: Client | null = null
  private subscription: StompSubscription | null = null
  private isConnecting = false

  connect(apiBase: string, conversationId: number, onMessage: (msg: ChatMessage) => void) {
    if (this.client?.active) {
      console.log('STOMP client đã kết nối rồi')
      return
    }
    
    if (this.isConnecting) {
      console.log('Đang kết nối...')
      return
    }
    
    this.isConnecting = true
    console.log('Đang kết nối STOMP...')
    
    const sock = new SockJS(`${apiBase}/ws`)
    this.client = new Client({
      webSocketFactory: () => sock as any,
      reconnectDelay: 3000,
      debug: (str) => console.log('STOMP Debug:', str),
    })
    
    this.client.onConnect = () => {
      console.log('✅ STOMP đã kết nối thành công')
      this.isConnecting = false
      this.subscription = this.client!.subscribe(`/topic/chat/${conversationId}`, (frame: IMessage) => {
        const body = JSON.parse(frame.body) as ChatMessage
        console.log('📨 Nhận tin nhắn:', body)
        onMessage(body)
      })
      console.log(`📡 Đã subscribe /topic/chat/${conversationId}`)
    }
    
    this.client.onStompError = (frame) => {
      console.error('❌ STOMP Error:', frame)
      this.isConnecting = false
    }
    
    this.client.onWebSocketError = (error) => {
      console.error('❌ WebSocket Error:', error)
      this.isConnecting = false
    }
    
    this.client.activate()
  }

  disconnect() {
    try { this.subscription?.unsubscribe() } catch {}
    try { this.client?.deactivate() } catch {}
    this.subscription = null
    this.client = null
    this.isConnecting = false
  }

  send(conversationId: number, payload: Omit<ChatMessage, 'id' | 'sentAt' | 'conversationId'>) {
    if (!this.client) {
      console.error('STOMP client chưa được khởi tạo')
      return
    }
    
    if (this.isConnecting) {
      console.log('Đang kết nối, vui lòng đợi...')
      // Đợi kết nối hoàn tất
      setTimeout(() => this.send(conversationId, payload), 1000)
      return
    }
    
    if (!this.client.active) {
      console.error('STOMP client chưa kết nối hoặc đã ngắt kết nối')
      return
    }
    
    try {
      this.client.publish({
        destination: `/app/chat/${conversationId}`,
        body: JSON.stringify({ ...payload, conversationId }),
      })
      console.log('Tin nhắn đã được gửi:', payload)
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error)
    }
  }
}

export const chatService = new ChatService()


