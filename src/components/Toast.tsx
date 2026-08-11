'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { X, Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type ToastType = 'info' | 'success' | 'warning' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const icons = {
    info: <Info size={16} className="text-blue-500" />,
    success: <CheckCircle2 size={16} className="text-green-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    error: <Bell size={16} className="text-red-500" />,
  }

  const bg = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 p-3 rounded-lg border shadow-lg animate-slide-in ${bg[t.type]}`}
          >
            <span className="shrink-0 mt-0.5">{icons[t.type]}</span>
            <span className="text-sm text-slate-800 flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="shrink-0">
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
