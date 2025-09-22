import { useRef, useState } from 'react'

export default function CameraCapture({ onImageReady }) {
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  async function onPickFile(e) {
    const fl = e && e.target && e.target.files
    const file = fl && fl[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setPreview(dataUrl)
    if (typeof onImageReady === 'function') {
      onImageReady(dataUrl)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPickFile}
        className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-white"
      />
      {preview && (
        <img
          alt="preview"
          src={preview}
          className="w-full max-w-md rounded border"
        />
      )}
    </div>
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
