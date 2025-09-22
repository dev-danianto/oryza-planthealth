import { useState, useRef } from 'react'
import ErrorBoundary from './ErrorBoundary.jsx'
import CameraCapture from './components/CameraCapture.jsx'
// import LiveCamera from './components/LiveCamera.jsx' // optional HTTPS only
import { analyzeImage } from './lib/openrouter.js'
import OryzaChat from './features/chat/OryzaChat.jsx'


const MODELS = [
  { id: 'mistralai/mistral-small-3.2-24b-instruct:free', label: 'Mistral Small 3.2 24B (free)' },
  { id: 'openai/gpt-5', label: 'GPT-5' }
]

export default function App() {
  const [model, setModel] = useState(import.meta.env.VITE_OPENROUTER_MODEL)
  const [prompt, setPrompt] = useState('Describe the scene and objects.')
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  async function run() {
    if (!imageDataUrl) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setResult('')
    try {
      const text = await analyzeImage({
        prompt,
        imageDataUrl,
        model,
        signal: abortRef.current.signal
      })
      setResult(text)
    } catch (e) {
      setResult(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <OryzaChat/>

       
      </div>
    </ErrorBoundary>
  )
}
