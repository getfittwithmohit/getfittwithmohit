'use client'

import { useEffect, useState } from 'react'

// In-app replacements for window.alert / window.confirm.
// Call toast() or confirmDialog() from anywhere; <FeedbackHost /> (mounted
// once in the root layout) draws them.

type ToastKind = 'error' | 'success' | 'info'
type Toast = { id: number; message: string; kind: ToastKind }
type Confirm = {
  id: number
  message: string
  confirmLabel: string
  destructive: boolean
  resolve: (ok: boolean) => void
}

let nextId = 1
const toastListeners = new Set<(t: Toast) => void>()
const confirmListeners = new Set<(c: Confirm) => void>()

export function toast(message: string, kind: ToastKind = 'error') {
  const t = { id: nextId++, message, kind }
  if (!toastListeners.size) {
    // Host not mounted (shouldn't happen): never swallow the message.
    console.warn(message)
    return
  }
  toastListeners.forEach((fn) => fn(t))
}

export function confirmDialog(
  message: string,
  opts: { confirmLabel?: string; destructive?: boolean } = {}
): Promise<boolean> {
  if (!confirmListeners.size) return Promise.resolve(window.confirm(message))
  return new Promise((resolve) => {
    const c: Confirm = {
      id: nextId++,
      message,
      confirmLabel: opts.confirmLabel || (opts.destructive ? 'Delete' : 'OK'),
      destructive: !!opts.destructive,
      resolve,
    }
    confirmListeners.forEach((fn) => fn(c))
  })
}

const KIND_STYLE: Record<ToastKind, { icon: string; color: string }> = {
  error: { icon: '!', color: '#ef4444' },
  success: { icon: '✓', color: '#22c55e' },
  info: { icon: 'i', color: '#00D4E8' },
}

export function FeedbackHost() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  useEffect(() => {
    const onToast = (t: Toast) => {
      setToasts((prev) => [...prev.slice(-2), t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500)
    }
    const onConfirm = (c: Confirm) => setConfirm(c)
    toastListeners.add(onToast)
    confirmListeners.add(onConfirm)
    return () => {
      toastListeners.delete(onToast)
      confirmListeners.delete(onConfirm)
    }
  }, [])

  const close = (ok: boolean) => {
    confirm?.resolve(ok)
    setConfirm(null)
  }

  useEffect(() => {
    if (!confirm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      confirm.resolve(false)
      setConfirm(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm])

  return (
    <>
      <div
        className="fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ top: 'max(16px, env(safe-area-inset-top))' }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="gfm-toast pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
            style={{ background: 'rgba(26,31,58,0.96)', backdropFilter: 'blur(12px)' }}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: KIND_STYLE[t.kind].color, color: '#0a0f1a' }}
            >
              {KIND_STYLE[t.kind].icon}
            </span>
            <p className="text-[15px] leading-snug text-white">{t.message}</p>
          </div>
        ))}
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center px-6"
          style={{ background: 'rgba(10,15,26,0.45)' }}
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={confirm.message}
            className="gfm-pop w-full max-w-xs rounded-2xl overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-5 pt-5 pb-4 text-[15px] leading-snug text-center text-[#0f172a]">{confirm.message}</p>
            <div className="grid grid-cols-2 border-t border-[#e2e8f0]">
              <button
                autoFocus
                onClick={() => close(false)}
                className="h-12 text-[17px] text-[#0095A8] border-r border-[#e2e8f0]"
              >
                Cancel
              </button>
              <button
                onClick={() => close(true)}
                className="h-12 text-[17px] font-semibold"
                style={{ color: confirm.destructive ? '#ef4444' : '#0095A8' }}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
