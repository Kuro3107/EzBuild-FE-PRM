import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  maxWidthClassName?: string
  variant?: 'dark' | 'light'
}

function Modal({ isOpen, title, onClose, children, footer, maxWidthClassName = 'max-w-2xl', variant = 'dark' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const container = (
    <div className="fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-5">
        <div className={`${variant === 'dark' ? 'bg-gray-900 border border-white/20 text-white' : 'bg-white text-gray-900'} rounded-lg w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto shadow-2xl`}> 
          {title && (
            <div className="flex justify-between items-center p-6 pb-0">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button onClick={onClose} className={`${variant === 'dark' ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>✕</button>
            </div>
          )}
          <div className="p-6">
            {children}
            {footer && (
              <div className="flex gap-3 pt-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(container, document.body)
}

export default Modal


