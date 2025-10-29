/**
 * Chat Service sử dụng BroadcastChannel API và localStorage
 * Cho phép chat real-time giữa Staff và Customer mà không cần backend
 */

import { ApiService } from './api'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'Staff' | 'Customer' | 'Admin'
  content: string
  timestamp: number
  isRead: boolean
}

export interface ChatRoom {
  id: string
  participants: string[]
  messages: ChatMessage[]
  lastMessage?: ChatMessage
  unreadCount: number
}

class ChatService {
  private broadcastChannel: BroadcastChannel
  private currentUser: any = null
  private chatRooms: Map<string, ChatRoom> = new Map()
  private listeners: Set<(rooms: ChatRoom[]) => void> = new Set()
  private messageListeners: Set<(roomId: string, message: ChatMessage) => void> = new Set()

  constructor() {
    // Tạo BroadcastChannel để giao tiếp giữa các tab
    this.broadcastChannel = new BroadcastChannel('ezbuild-chat')
    
    // Lắng nghe tin nhắn từ các tab khác
    this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this))
    
    // Load dữ liệu từ localStorage khi khởi tạo
    this.loadFromStorage()
    
    // Lấy thông tin user hiện tại
    this.loadCurrentUser()
  }

  private loadCurrentUser() {
    try {
      // Sử dụng ApiService để lấy user data chính xác
      this.currentUser = ApiService.getCurrentUser()
      
      if (!this.currentUser) {
        console.log('No authenticated user found, will use guest user for chat')
        // Fallback: lấy từ localStorage trực tiếp
        this.loadFromLocalStorage()
      } else {
        console.log('Current user loaded for chat:', this.currentUser.fullname || this.currentUser.email)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
      this.loadFromLocalStorage()
    }
  }

  private loadFromLocalStorage() {
    try {
      const authUser = localStorage.getItem('authUser')
      if (authUser) {
        this.currentUser = JSON.parse(authUser)
        console.log('Loaded user from localStorage:', this.currentUser?.fullname || this.currentUser?.email)
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }

  private loadFromStorage() {
    try {
      const storedRooms = localStorage.getItem('ezbuild-chat-rooms')
      if (storedRooms) {
        const rooms = JSON.parse(storedRooms)
        rooms.forEach((room: ChatRoom) => {
          this.chatRooms.set(room.id, room)
        })
      }
    } catch (error) {
      console.error('Error loading chat rooms from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      const rooms = Array.from(this.chatRooms.values())
      localStorage.setItem('ezbuild-chat-rooms', JSON.stringify(rooms))
    } catch (error) {
      console.error('Error saving chat rooms to storage:', error)
    }
  }

  private handleBroadcastMessage(event: MessageEvent) {
    const { type, data } = event.data

    switch (type) {
      case 'NEW_MESSAGE':
        this.handleNewMessage(data.roomId, data.message)
        break
      case 'USER_TYPING':
        // Có thể implement typing indicator sau
        break
      case 'MESSAGE_READ':
        this.handleMessageRead(data.roomId, data.messageId)
        break
    }
  }

  private handleNewMessage(roomId: string, message: ChatMessage) {
    const room = this.chatRooms.get(roomId)
    if (room) {
      room.messages.push(message)
      room.lastMessage = message
      
      // Tăng unread count nếu không phải tin nhắn của user hiện tại
      if (message.senderId !== this.currentUser?.id) {
        room.unreadCount++
      }
      
      this.chatRooms.set(roomId, room)
      this.saveToStorage()
      
      // Thông báo cho listeners
      this.notifyRoomListeners()
      this.notifyMessageListeners(roomId, message)
    }
  }

  private handleMessageRead(roomId: string, messageId: string) {
    const room = this.chatRooms.get(roomId)
    if (room) {
      const message = room.messages.find(m => m.id === messageId)
      if (message) {
        message.isRead = true
        this.chatRooms.set(roomId, room)
        this.saveToStorage()
        this.notifyRoomListeners()
      }
    }
  }

  private notifyRoomListeners() {
    const rooms = Array.from(this.chatRooms.values())
    this.listeners.forEach(listener => listener(rooms))
  }

  private notifyMessageListeners(roomId: string, message: ChatMessage) {
    this.messageListeners.forEach(listener => listener(roomId, message))
  }

  // Public methods

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    // Reload user data mỗi lần gọi để đảm bảo up-to-date
    this.loadCurrentUser()
    return this.currentUser
  }

  /**
   * Gửi tin nhắn mới
   */
  sendMessage(roomId: string, content: string): ChatMessage | null {
    // Reload current user trước khi gửi
    this.loadCurrentUser()
    
    if (!content.trim()) {
      console.log('Cannot send message - empty content:', { content })
      return null
    }

    // Tạo user tạm nếu chưa đăng nhập
    const currentUser = this.currentUser || {
      id: 'guest_' + Date.now(),
      fullname: 'Khách hàng',
      email: 'guest@example.com',
      role: 'Customer'
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.id,
      senderName: currentUser.fullname || currentUser.email || 'User',
      senderRole: currentUser.role === 'Staff' ? 'Staff' : 
                  currentUser.role === 'Admin' ? 'Admin' : 'Customer',
      content: content.trim(),
      timestamp: Date.now(),
      isRead: false
    }

    // Tạo room nếu chưa tồn tại
    if (!this.chatRooms.has(roomId)) {
      this.createRoom(roomId, [currentUser.id, 'customer']) // Default với customer
    }

    const room = this.chatRooms.get(roomId)!
    room.messages.push(message)
    room.lastMessage = message
    this.chatRooms.set(roomId, room)
    this.saveToStorage()

    // Broadcast tin nhắn đến các tab khác
    this.broadcastChannel.postMessage({
      type: 'NEW_MESSAGE',
      data: { roomId, message }
    })

    this.notifyRoomListeners()
    this.notifyMessageListeners(roomId, message)

    return message
  }

  /**
   * Tạo room chat mới
   */
  createRoom(roomId: string, participants: string[]): ChatRoom {
    const room: ChatRoom = {
      id: roomId,
      participants,
      messages: [],
      unreadCount: 0
    }
    
    this.chatRooms.set(roomId, room)
    this.saveToStorage()
    this.notifyRoomListeners()
    
    return room
  }

  /**
   * Lấy room chat
   */
  getRoom(roomId: string): ChatRoom | undefined {
    return this.chatRooms.get(roomId)
  }

  /**
   * Lấy tất cả rooms
   */
  getAllRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values())
  }

  /**
   * Đánh dấu tin nhắn là đã đọc
   */
  markMessageAsRead(roomId: string, messageId: string) {
    const room = this.chatRooms.get(roomId)
    if (room) {
      const message = room.messages.find(m => m.id === messageId)
      if (message) {
        message.isRead = true
        this.chatRooms.set(roomId, room)
        this.saveToStorage()
        
        // Broadcast đến các tab khác
        this.broadcastChannel.postMessage({
          type: 'MESSAGE_READ',
          data: { roomId, messageId }
        })
        
        this.notifyRoomListeners()
      }
    }
  }

  /**
   * Đánh dấu tất cả tin nhắn trong room là đã đọc
   */
  markRoomAsRead(roomId: string) {
    const room = this.chatRooms.get(roomId)
    if (room) {
      room.messages.forEach(message => {
        if (message.senderId !== this.currentUser?.id) {
          message.isRead = true
        }
      })
      room.unreadCount = 0
      this.chatRooms.set(roomId, room)
      this.saveToStorage()
      this.notifyRoomListeners()
    }
  }

  /**
   * Subscribe để lắng nghe thay đổi rooms
   */
  subscribeToRooms(callback: (rooms: ChatRoom[]) => void): () => void {
    this.listeners.add(callback)
    
    // Gọi ngay lập tức với dữ liệu hiện tại
    callback(this.getAllRooms())
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Subscribe để lắng nghe tin nhắn mới
   */
  subscribeToMessages(callback: (roomId: string, message: ChatMessage) => void): () => void {
    this.messageListeners.add(callback)
    
    return () => {
      this.messageListeners.delete(callback)
    }
  }


  /**
   * Tạo room ID cho chat giữa staff và customer
   */
  createStaffCustomerRoom(staffId?: string, customerId?: string): string {
    const staff = staffId || this.currentUser?.id || 'staff'
    const customer = customerId || 'customer'
    return `staff_customer_${staff}_${customer}`
  }

  /**
   * Lấy tổng số tin nhắn chưa đọc
   */
  getTotalUnreadCount(): number {
    return Array.from(this.chatRooms.values())
      .reduce((total, room) => total + room.unreadCount, 0)
  }

  /**
   * Xóa tất cả dữ liệu chat (để test)
   */
  clearAllData() {
    this.chatRooms.clear()
    localStorage.removeItem('ezbuild-chat-rooms')
    this.notifyRoomListeners()
  }

  /**
   * Cleanup
   */
  destroy() {
    this.broadcastChannel.close()
    this.listeners.clear()
    this.messageListeners.clear()
  }
}

// Export singleton instance
export const chatService = new ChatService()