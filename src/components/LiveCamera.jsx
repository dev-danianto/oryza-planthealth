import { useEffect, useRef, useState } from 'react'

export default function LiveCamera({ onSnapshot }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stream
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      } catch (e) {
        console.error('Camera error', e)
      }
    }
    start()
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  function snap() {
    const v = videoRef.current
    const c = canvasRef.current
    const w = v.videoWidth
    const h = v.videoHeight
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    ctx.drawImage(v, 0, 0, w, h)
    const dataUrl = c.toDataURL('image/jpeg', 0.9)
    onSnapshot?.(dataUrl)
  }

  return (
    <div className="space-y-3">
      <video ref={videoRef} className="w-full max-w-md rounded border" playsInline muted />
      <button
        onClick={snap}
        disabled={!ready}
        className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Capture
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
