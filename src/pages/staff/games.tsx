import { useEffect, useState, useMemo } from 'react'
import { ApiService } from '../../services/api'
import '../../Homepage.css'

interface Game {
  id: number
  name: string
  description: string
  genre: string
  releaseDate: string
  developer: string
  imageUrl?: string
  createdAt?: string
}

function StaffGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    releaseDate: '',
    developer: '',
    imageUrl: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const gamesData = await ApiService.getAllGames()
      setGames(gamesData as Game[])
    } catch (err) {
      setError('Không thể tải dữ liệu')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGame = async () => {
    try {
      await ApiService.createGame(formData)
      alert('Đã thêm game thành công!')
      setIsAddModalOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      console.error('Error adding game:', err)
      alert('Có lỗi khi thêm game')
    }
  }

  const handleEditGame = async () => {
    if (!selectedGame) return
    try {
      await ApiService.updateGame(selectedGame.id, formData)
      alert('Đã cập nhật game thành công!')
      setIsEditModalOpen(false)
      setSelectedGame(null)
      resetForm()
      loadData()
    } catch (err) {
      console.error('Error updating game:', err)
      alert('Có lỗi khi cập nhật game')
    }
  }

  const handleDeleteGame = async () => {
    if (!selectedGame) return
    try {
      await ApiService.deleteGame(selectedGame.id)
      alert('Đã xóa game thành công!')
      setIsDeleteModalOpen(false)
      setSelectedGame(null)
      loadData()
    } catch (err) {
      console.error('Error deleting game:', err)
      alert('Có lỗi khi xóa game')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', genre: '', releaseDate: '', developer: '', imageUrl: '' })
  }

  const openEditModal = (game: Game) => {
    setSelectedGame(game)
    setFormData({
      name: game.name,
      description: game.description,
      genre: game.genre,
      releaseDate: game.releaseDate,
      developer: game.developer,
      imageUrl: game.imageUrl || ''
    })
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (game: Game) => {
    setSelectedGame(game)
    setIsDeleteModalOpen(true)
  }

  const filteredGames = useMemo(() => {
    if (!games.length) return []
    return games.filter(game => {
      if (debouncedSearchTerm.trim()) {
        const lowerSearch = debouncedSearchTerm.toLowerCase()
        return game.name.toLowerCase().includes(lowerSearch) ||
               game.genre.toLowerCase().includes(lowerSearch) ||
               game.developer.toLowerCase().includes(lowerSearch)
      }
      return true
    })
  }, [games, debouncedSearchTerm])

  if (loading) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page bg-grid bg-radial">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page bg-grid bg-radial">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý game</h1>
        <p className="text-gray-600">Thêm, sửa, xóa game trong hệ thống</p>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Tổng game</div>
          <div className="text-2xl font-bold text-gray-900">{games.length}</div>
        </div>
        <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Đang hiển thị</div>
          <div className="text-2xl font-bold text-blue-600">{filteredGames.length}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm game..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 shadow-md border border-green-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm game</span>
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 shadow-md border border-blue-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hình ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên game</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thể loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà phát triển</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày phát hành</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">Không tìm thấy game nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGames.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{game.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={game.imageUrl || 'https://via.placeholder.com/100x100?text=No+Image'}
                        alt={game.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=No+Image'
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{game.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.genre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.developer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.releaseDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(game)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium border border-blue-300"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => openDeleteModal(game)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium border border-red-300"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Thêm game mới</h3>
              <button onClick={() => { setIsAddModalOpen(false); resetForm() }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên game *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại *</label>
                  <input type="text" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} placeholder="VD: Action, RPG" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà phát triển *</label>
                  <input type="text" value={formData.developer} onChange={(e) => setFormData({ ...formData, developer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày phát hành *</label>
                  <input type="date" value={formData.releaseDate} onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (URL)</label>
                  <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleAddGame} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Thêm game</button>
                <button onClick={() => { setIsAddModalOpen(false); resetForm() }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sửa game #{selectedGame.id}</h3>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedGame(null); resetForm() }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên game *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại *</label>
                  <input type="text" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nhà phát triển *</label>
                  <input type="text" value={formData.developer} onChange={(e) => setFormData({ ...formData, developer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày phát hành *</label>
                  <input type="date" value={formData.releaseDate} onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (URL)</label>
                  <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleEditGame} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cập nhật</button>
                <button onClick={() => { setIsEditModalOpen(false); setSelectedGame(null); resetForm() }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
              <button onClick={() => { setIsDeleteModalOpen(false); setSelectedGame(null) }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-gray-700 mb-6">Bạn có chắc chắn muốn xóa game <strong>{selectedGame.name}</strong> không?</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteGame} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
              <button onClick={() => { setIsDeleteModalOpen(false); setSelectedGame(null) }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffGamesPage

