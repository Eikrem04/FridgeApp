import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface UseDialogA11yOptions {
  /** Focus the first focusable element inside the dialog as soon as it opens. Default true — pass
   * false when the dialog already manages its own initial focus (e.g. focusing a search input after
   * its own entrance-animation delay) to avoid two competing focus calls. */
  autoFocus?: boolean
}

/**
 * Shared modal behavior for Sheet/ConfirmDialog/ZeroQuantityDialog/full-screen
 * overlays: Escape closes, Tab is trapped inside the dialog while open, and
 * focus returns to whatever triggered the dialog once it closes. Attach the
 * returned ref to the dialog's outer panel element (the one with
 * role="dialog").
 */
export function useDialogA11y(open: boolean, onClose: () => void, options?: UseDialogA11yOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const autoFocus = options?.autoFocus ?? true

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const getFocusable = () => {
      const container = containerRef.current
      if (!container) return []
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      )
    }

    let rafId: number | undefined
    if (autoFocus) {
      rafId = requestAnimationFrame(() => {
        const [first] = getFocusable()
        ;(first ?? containerRef.current)?.focus()
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId)
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose, autoFocus])

  return containerRef
}
