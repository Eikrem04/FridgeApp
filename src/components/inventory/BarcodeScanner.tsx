import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, X } from 'lucide-react'

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onDetected: (code: string) => void
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
    }
  }
}

export const BarcodeScanner = ({ open, onClose, onDetected }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!open) return

    if (typeof window.BarcodeDetector === 'undefined') {
      setSupported(false)
      return
    }
    setSupported(true)
    setError(null)

    let cancelled = false
    let raf = 0

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        const detector = new window.BarcodeDetector!({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        })
        const scan = async () => {
          if (cancelled || !videoRef.current) return
          try {
            const results = await detector.detect(videoRef.current)
            if (results.length > 0) {
              onDetected(results[0].rawValue)
              return
            }
          } catch {
            // keep scanning
          }
          raf = requestAnimationFrame(() => {
            scan()
          })
        }
        scan()
      } catch {
        setError('Camera access was denied or is unavailable.')
      }
    }

    start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open, onDetected])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-black"
        >
          <div className="safe-top flex items-center justify-between px-5 pb-3 pt-4">
            <span className="text-[15px] font-semibold text-white">Scan barcode</span>
            <button type="button" onClick={onClose} className="rounded-full bg-white/15 p-2.5 text-white">
              <X size={19} />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {supported ? (
              <>
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute h-48 w-72 rounded-3xl border-2 border-white/70" />
                {error && (
                  <div className="absolute bottom-10 left-6 right-6 rounded-2xl bg-white/95 p-4 text-center text-[14px] font-medium text-[var(--color-ink)]">
                    {error}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                  <Camera size={28} />
                </span>
                <p className="text-[16px] font-semibold text-white">Barcode scanning isn't supported in this browser</p>
                <p className="text-[14px] text-white/70">
                  You can still add the product manually — just type in its name below.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
