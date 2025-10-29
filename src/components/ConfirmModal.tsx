import Modal from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  isOpen,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} maxWidthClassName="max-w-md" variant="dark">
      <p className="mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          {confirmText}
        </button>
        <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
          {cancelText}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmModal


