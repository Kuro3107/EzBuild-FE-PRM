import { useEffect, useState } from 'react'
import { ApiService } from '../../services/api'
import '../../Homepage.css'

function StaffDebugPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      addLog('Bắt đầu load data...')
      
      // Load orders only (payment API không tồn tại)
      addLog('Loading orders...')
      const ordersData = await ApiService.getOrders()
      setOrders(ordersData as any[])
      addLog(`Loaded ${ordersData.length} orders`)
      
      addLog('Data loaded successfully!')
    } catch (error) {
      addLog(`Error: ${error}`)
      console.error('Debug load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testUpdateOrder = async () => {
    if (orders.length === 0) {
      addLog('No orders to test with')
      return
    }

    const testOrder = orders[0]
    addLog(`Testing update order ID: ${testOrder.id}`)
    
    try {
      const result = await ApiService.updateOrderStatus(testOrder.id, 'DEPOSITED')
      addLog(`Order update successful: ${JSON.stringify(result)}`)
    } catch (error) {
      addLog(`Order update failed: ${error}`)
    }
  }

  return (
    <div className="page bg-grid bg-radial">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Debug</h1>
        <p className="text-gray-600">Kiểm tra API và data flow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Display */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-black/10 p-6">
            <h3 className="text-lg font-semibold mb-4">Orders ({orders.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orders.map(order => (
                <div key={order.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div>ID: {order.id}</div>
                  <div>Status: <span className="font-medium">{order.status}</span></div>
                  <div>Total: {order.totalPrice || order.total_price} VND</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Debug Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-black/10 p-6">
            <h3 className="text-lg font-semibold mb-4">Debug Actions</h3>
            <div className="space-y-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Reload Data'}
              </button>
              
              <button
                onClick={testUpdateOrder}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Test Update Order
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-black/10 p-6">
            <h3 className="text-lg font-semibold mb-4">Debug Logs</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDebugPage
