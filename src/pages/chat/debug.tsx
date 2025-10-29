import { useState, useEffect } from 'react'
import { ApiService } from '../../services/api'
import { chatService } from '../../services/chat'

function ChatDebugPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [wsStatus, setWsStatus] = useState<string>('Chưa kết nối')
  const [testMessage, setTestMessage] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    // Kiểm tra user info
    const user = ApiService.getCurrentUser()
    setUserInfo(user)
    addLog(`User info: ${JSON.stringify(user)}`)

    // Kiểm tra localStorage
    const token = localStorage.getItem('authToken')
    addLog(`Auth token exists: ${!!token}`)
    if (token) {
      addLog(`Token length: ${token.length}`)
    }

    // Test WebSocket connection
    const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').trim()
    addLog(`API Base: ${API_BASE}`)
    
    if (user && user.userId) {
      addLog(`Attempting WebSocket connection for user: ${user.userId}`)
      chatService.connect(API_BASE, user.userId, (msg) => {
        addLog(`Received message: ${JSON.stringify(msg)}`)
      })
      setWsStatus('Đã kết nối')
    } else {
      addLog('No valid user ID for WebSocket connection')
      setWsStatus('Không thể kết nối - thiếu user ID')
    }
  }, [])

  const testSendMessage = () => {
    if (!userInfo || !userInfo.userId) {
      addLog('Không thể gửi tin nhắn - thiếu user ID')
      return
    }

    addLog(`Sending test message: ${testMessage}`)
    chatService.send(userInfo.userId, {
      senderId: userInfo.userId,
      receiverId: 0,
      content: testMessage,
      senderRole: 'USER',
    })
    addLog('Message sent via WebSocket')
  }

  const testApiCall = async () => {
    try {
      const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '').trim()
      const response = await fetch(`${API_BASE}/api/chat/history/${userInfo?.userId}`)
      addLog(`API call status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        addLog(`API response: ${JSON.stringify(data)}`)
      } else {
        addLog(`API error: ${response.statusText}`)
      }
    } catch (error) {
      addLog(`API error: ${error}`)
    }
  }

  return (
    <div className="page bg-grid-dark">
      <div className="layout">
        <main className="main" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 className="text-2xl font-bold mb-4 text-white">Chat Debug Page</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* User Info */}
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-white">User Information</h2>
              <div className="text-white/80">
                <pre className="text-sm">{JSON.stringify(userInfo, null, 2)}</pre>
              </div>
            </div>

            {/* WebSocket Status */}
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-white">WebSocket Status</h2>
              <div className="text-white/80">
                <p>Status: {wsStatus}</p>
                <div className="mt-3">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Test message"
                    className="w-full px-3 py-2 rounded border border-white/20 bg-white/80 text-gray-900 mb-2"
                  />
                  <button
                    onClick={testSendMessage}
                    className="px-4 py-2 rounded bg-blue-600 text-white mr-2"
                  >
                    Test Send
                  </button>
                  <button
                    onClick={testApiCall}
                    className="px-4 py-2 rounded bg-green-600 text-white"
                  >
                    Test API
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-white">Debug Logs</h2>
            <div className="bg-black/50 rounded p-3 h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400 text-sm font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ChatDebugPage
