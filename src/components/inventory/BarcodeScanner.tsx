import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, X } from 'lucide-react'
import { BarcodeFormat, BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onDetected: (code: string) => void
}

type ScannerStatus = 'starting' | 'scanning' | 'permission-denied' | 'unsupported' | 'error'

const hints = new Map<DecodeHintType, unknown>()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
])

const UNSUPPORTED_MESSAGE = "Barcode scanning isn't available in this browser."
const PERMISSION_MESSAGE = 'Camera access was denied. Allow camera access in your browser settings to scan.'

export const BarcodeScanner = ({ open, onClose, onDetected }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('starting')

  useEffect(() => {
    if (!open) return

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }

    let cancelled = false
    setStatus('starting')

    // No deviceId given: zxing prefers the rear/environment-facing camera
    // automatically when one is available, which is exactly what we want
    // for scanning a product held in front of the phone.
    const reader = new BrowserMultiFormatReader(hints)

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, _error, controls) => {
        controlsRef.current = controls
        if (cancelled) return
        setStatus('scanning')
        if (result) {
          // Stop immediately so the camera is released the instant a code is
          // found, and so the same code can never fire onDetected twice.
          controls.stop()
          controlsRef.current = null
          onDetected(result.getText())
        }
        // Any other `_error` here is zxing's normal per-frame "no barcode in
        // this frame yet" signal — not a real failure, so it's ignored.
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = err instanceof Error ? err.name : undefined
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
          setStatus('permission-denied')
        } else {
          setStatus('unsupported')
        }
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [open, onDetected])

  const handleClose = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    onClose()
  }

  const showCamera = status === 'starting' || status === 'scanning'
  const message = status === 'permission-denied' ? PERMISSION_MESSAGE : status === 'unsupported' ? UNSUPPORTED_MESSAGE : null

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
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cancel"
              className="rounded-full bg-white/15 p-2.5 text-white active:scale-90"
            >
              <X size={19} />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {showCamera ? (
              <>
                <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute h-40 w-72 rounded-3xl border-2 border-white/70" />
                <p className="pointer-events-none absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] left-6 right-6 text-center text-[13.5px] font-medium text-white/80">
                  Line up the barcode inside the frame
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                  <Camera size={28} />
                </span>
                <p className="text-[16px] font-semibold text-white">{message}</p>
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
