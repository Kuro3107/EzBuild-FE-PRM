import { useEffect, useState } from 'react'
import { ApiService } from '../../services/api'
import '../../Homepage.css'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'

interface UserItem {
  id: number
  email: string
  fullname?: string
  role?: string
}

function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)

  const [formData, setFormData] = useState<{ email: string; fullname: string; role: string }>({
    email: '',
    fullname: '',
    role: 'User'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ApiService.getAllUsers()
      setUsers((data as unknown as UserItem[]) || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (user: UserItem) => {
    setSelectedUser(user)
    setFormData({ email: user.email, fullname: user.fullname || '', role: user.role || 'User' })
    setIsEditOpen(true)
  }

  const resetForm = () => setFormData({ email: '', fullname: '', role: 'User' })

  const handleAdd = async () => {
    try {
      await ApiService.createUser(formData)
      setIsAddOpen(false)
      resetForm()
      loadUsers()
    } catch (err) {
      console.error('Error creating user:', err)
      alert('Có lỗi khi tạo user')
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    try {
      await ApiService.updateUser(String(selectedUser.id), formData)
      setIsEditOpen(false)
      setSelectedUser(null)
      resetForm()
      loadUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      alert('Có lỗi khi cập nhật user')
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      await ApiService.deleteUser(String(selectedUser.id))
      setIsDeleteOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Có lỗi khi xóa user')
    }
  }

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
            <button onClick={loadUsers} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page bg-grid bg-radial">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Quản lý người dùng hệ thống</p>
        </div>
        <button onClick={() => { setIsAddOpen(true); resetForm() }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Thêm user
        </button>
      </div>

      <div className="bg-white rounded-lg border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fullname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Chưa có người dùng</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.fullname || ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.role || 'User'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium border border-blue-300">Sửa</button>
                        <button onClick={() => { setSelectedUser(u); setIsDeleteOpen(true) }} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium border border-red-300">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User */}
      <Modal isOpen={isAddOpen} title="Thêm user" onClose={() => { setIsAddOpen(false); resetForm() }} variant="dark">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fullname</label>
            <input type="text" value={formData.fullname} onChange={e => setFormData({ ...formData, fullname: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="User">User</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Thêm</button>
            <button onClick={() => { setIsAddOpen(false); resetForm() }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Hủy</button>
          </div>
        </div>
      </Modal>

      {/* Edit User */}
      <Modal isOpen={isEditOpen && !!selectedUser} title={selectedUser ? `Sửa user #${selectedUser.id}` : 'Sửa user'} onClose={() => { setIsEditOpen(false); setSelectedUser(null); resetForm() }} variant="dark">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fullname</label>
            <input type="text" value={formData.fullname} onChange={e => setFormData({ ...formData, fullname: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="User">User</option>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Cập nhật</button>
            <button onClick={() => { setIsEditOpen(false); setSelectedUser(null); resetForm() }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Hủy</button>
          </div>
        </div>
      </Modal>

      {/* Delete User */}
      <ConfirmModal
        isOpen={isDeleteOpen && !!selectedUser}
        title="Xác nhận xóa"
        message={selectedUser ? `Bạn có chắc chắn muốn xóa user ${selectedUser.email} không?` : 'Bạn có chắc chắn muốn xóa?'}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDelete}
        onCancel={() => { setIsDeleteOpen(false); setSelectedUser(null) }}
      />
    </div>
  )
}

export default AdminUsersPage


