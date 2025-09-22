import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatOryza } from '../../lib/oryza.js'

const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct:free'

const INITIAL_MESSAGE = {
  id: 'greet',
  role: 'assistant',
  name: 'ORYZA',
  text: 'Halo, ini ORYZA. AI Pengenal Penyakit Tanaman yang siap membantu menganalisis kesehatan tanaman Anda.',
  ts: Date.now()
}

export default function OryzaChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [attached, setAttached] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [recentActivity, setRecentActivity] = useState([])
  const scrollRef = useRef(null)
  const abortRef = useRef(null)

  // Load recent activity from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('oryza-recent-activity')
      if (saved) {
        const activities = JSON.parse(saved)
        setRecentActivity(activities.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error)
    }
  }, [])

  // Save activity to localStorage
  const saveActivity = (activity) => {
    try {
      const existing = JSON.parse(localStorage.getItem('oryza-recent-activity') || '[]')
      const updated = [activity, ...existing.filter(item => item.id !== activity.id)].slice(0, 10)
      localStorage.setItem('oryza-recent-activity', JSON.stringify(updated))
      setRecentActivity(updated.slice(0, 5))
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit lalu`
    if (hours < 24) return `${hours} jam lalu`
    if (days === 1) return 'Kemarin'
    if (days < 7) return `${days} hari lalu`
    return '1 minggu lalu'
  }

  // Determine activity type and icon based on message content
  const getActivityInfo = (text, hasImage) => {
    const lowerText = text.toLowerCase()
    
    if (hasImage) {
      return {
        type: 'scan',
        icon: '📸',
        color: 'emerald',
        title: 'Scan foto tanaman'
      }
    }
    
    if (lowerText.includes('menguning') || lowerText.includes('layu') || lowerText.includes('bercak')) {
      return {
        type: 'diagnosis',
        icon: '🔍',
        color: 'amber',
        title: 'Diagnosis gejala'
      }
    }
    
    if (lowerText.includes('tips') || lowerText.includes('cara') || lowerText.includes('perawatan')) {
      return {
        type: 'tips',
        icon: '🌿',
        color: 'violet',
        title: 'Tips perawatan'
      }
    }
    
    if (lowerText.includes('penyakit') || lowerText.includes('hama')) {
      return {
        type: 'disease',
        icon: '⚕️',
        color: 'red',
        title: 'Deteksi penyakit'
      }
    }
    
    return {
      type: 'general',
      icon: '💬',
      color: 'blue',
      title: 'Konsultasi umum'
    }
  }

  // Desktop detection for responsive sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e) => setIsDesktop(e.matches)
    
    mq.addEventListener('change', onChange)
    setIsDesktop(mq.matches)
    
    return () => mq.removeEventListener('change', onChange)
  }, [])

  function appendMessage(msg) {
    setMessages(prev => [...prev, msg])
  }

  // Reset conversation
  function resetConversation() {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setMessages([{
      ...INITIAL_MESSAGE,
      id: 'greet-' + cryptoRandom(),
      ts: Date.now()
    }])
    setError(null)
    setAttached(null)
    setPending(false)
    setInputValue('')
    setSidebarOpen(false)
  }

  // Send message with real AI connection
  async function onSend({ text }) {
    if (!text && !attached) return
    setError(null)

    const userMsg = {
      id: 'u-' + cryptoRandom(),
      role: 'user',
      name: 'Me',
      text: text,
      image: attached || null,
      ts: Date.now()
    }
    appendMessage(userMsg)
    setPending(true)
    setInputValue('')

    // Save user activity
    const activityInfo = getActivityInfo(text, !!attached)
    const activity = {
      id: userMsg.id,
      type: activityInfo.type,
      icon: activityInfo.icon,
      color: activityInfo.color,
      title: activityInfo.title,
      timestamp: userMsg.ts,
      hasResult: false
    }
    saveActivity(activity)

    try {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      // Real AI call
      const content = await chatOryza({
        prompt: text,
        imageDataUrl: attached,
        model,
        signal: abortRef.current.signal
      })

      const assistantMsg = {
        id: 'a-' + cryptoRandom(),
        role: 'assistant',
        name: 'ORYZA',
        text: content || '(no content)',
        ts: Date.now()
      }
      appendMessage(assistantMsg)

      // Update activity with result
      const updatedActivity = {
        ...activity,
        hasResult: true,
        resultPreview: content ? content.slice(0, 50) + '...' : 'Analisis selesai'
      }
      saveActivity(updatedActivity)

    } catch (e) {
      setError(String(e))
      appendMessage({
        id: 'e-' + cryptoRandom(),
        role: 'assistant',
        name: 'ORYZA',
        text: 'Maaf, terjadi kesalahan saat memproses permintaan.',
        ts: Date.now()
      })

      // Update activity with error
      const errorActivity = {
        ...activity,
        hasResult: false,
        resultPreview: 'Analisis gagal'
      }
      saveActivity(errorActivity)
    } finally {
      setPending(false)
      setAttached(null)
    }
  }

  function onAttach(dataUrl) {
    setAttached(dataUrl)
  }

  // Fixed scroll functionality with setTimeout
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 0)
    }
  }, [messages, pending])

  // Close sidebar on resize for mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 relative overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Responsive Sidebar */}
      <motion.div
        initial={false}
        animate={isDesktop ? { x: 0 } : { x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className={`
          fixed lg:relative lg:translate-x-0 
          w-80 sm:w-72 md:w-80 
          lg:w-80 xl:w-88
          h-full bg-white/90 backdrop-blur-xl 
          border-r-2 border-emerald-200/50
          flex flex-col z-50 shadow-xl lg:shadow-none
        `}
      >
        {/* Sidebar content - keeping existing structure */}
        <div className="px-5 sm:px-6 py-5 sm:py-6 lg:px-6 lg:py-5 border-b border-emerald-100/60">
          <div className="flex items-center gap-4 lg:gap-3">
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 lg:w-11 lg:h-11 rounded-2xl lg:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 overflow-hidden bg-white"
              style={{ transform: 'rotate(-1deg)' }}
            >
              <img 
                src="/icons/pwa-512.png" 
                alt="ORYZA Logo" 
                className="w-full h-full object-cover rounded-2xl lg:rounded-xl"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 
                className="text-xl sm:text-2xl lg:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate"
                style={{ letterSpacing: '-0.02em' }}
              >
                ORYZA
              </h1>
              <p className="text-sm lg:text-sm text-slate-500 font-medium truncate">
                Plant Disease AI Assistant
              </p>
            </div>
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-9 h-9 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center lg:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lg:w-3 lg:h-3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 lg:mt-3">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-sm lg:text-sm font-medium text-slate-700 bg-emerald-50/80 border border-emerald-200/60 rounded-xl lg:rounded-lg px-4 lg:px-3 py-3 lg:py-2 focus:ring-2 focus:ring-emerald-400/30 focus:bg-white transition-all"
            >
              <option value="mistralai/mistral-small-3.2-24b-instruct:free">🌱 Plant AI Detection</option>
              <option value="openai/gpt-5">🔬 Advanced Analysis</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 px-4 sm:px-5 py-5 lg:px-4 lg:py-4 overflow-y-auto">
          {/* Navigation buttons and recent activity - keeping existing structure */}
          <div className="space-y-2 lg:space-y-1">
            <motion.button 
              whileHover={{ scale: 1.02, x: 8 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 lg:gap-3 px-4 lg:px-3 py-3 lg:py-2 text-sm lg:text-sm font-semibold text-slate-900 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl lg:rounded-lg transition-all duration-200 border border-emerald-100 shadow-sm"
            >
              <div className="w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600 flex-shrink-0 lg:w-4 lg:h-4">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              <span className="truncate">Dashboard</span>
            </motion.button>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8 lg:mt-6">
            <div className="flex items-center justify-between mb-3 lg:mb-2 px-1">
              <h3 className="text-xs lg:text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Recent Activity
              </h3>
            </div>
            
            <div className="space-y-2 lg:space-y-1">
              {recentActivity.length === 0 ? (
                <div className="p-3 lg:p-3 rounded-lg bg-slate-50/50 border border-slate-200/30 text-center">
                  <div className="text-xs text-slate-500">
                    Belum ada aktivitas
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 lg:p-3 rounded-lg bg-slate-50/80 border border-slate-200/50 hover:bg-slate-100/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3 lg:gap-2">
                        <div className={`w-8 h-8 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          activity.color === 'emerald' ? 'bg-emerald-100' :
                          activity.color === 'amber' ? 'bg-amber-100' :
                          activity.color === 'violet' ? 'bg-violet-100' :
                          activity.color === 'red' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          <span className="text-sm lg:text-xs">{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs lg:text-xs font-medium text-slate-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 lg:p-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetConversation}
            className="w-full flex items-center justify-center gap-3 lg:gap-2 px-5 lg:px-4 py-4 lg:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl lg:rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-600/25 text-sm lg:text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 lg:w-4 lg:h-4">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            <span className="truncate">Start New Analysis</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 lg:px-6 lg:py-4 bg-white/85 backdrop-blur-xl border-b border-emerald-100/60">
          <div className="flex items-center gap-3 lg:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 flex items-center justify-center lg:hidden transition-colors flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lg:w-4 lg:h-4">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="18" x2="16" y2="18"/>
              </svg>
            </button>

            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-11 lg:h-11 rounded-xl lg:rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0 overflow-hidden bg-white"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <img 
                src="/icons/pwa-512.png" 
                alt="ORYZA Logo" 
                className="w-full h-full object-cover rounded-xl lg:rounded-lg"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-lg font-bold text-slate-900 truncate">Plant Health Assistant</h2>
              <p className="text-sm lg:text-sm text-slate-500 truncate">AI-powered disease detection & care advice</p>
            </div>
          </div>
        </div>

        {/* Messages Area - FIXED SCROLL IMPLEMENTATION */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {messages.length <= 1 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 lg:px-7 lg:py-9 relative w-full">
              <div className="max-w-4xl text-center relative z-10 w-full">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 lg:mb-4"
                >
                  Haloooo! 👋
                </motion.h1>
                
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-xl lg:text-2xl font-light text-slate-600 mb-6 sm:mb-8 lg:mb-9"
                >
                  Ada tanaman yang perlu{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold">
                    diperiksa hari ini?
                  </span>
                </motion.h2>
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-5 lg:px-7 lg:py-6 w-full"
              style={{ 
                height: '100%',
                maxHeight: '100%'
              }}
            >
              <div className="max-w-4xl mx-auto space-y-4 lg:space-y-5 w-full">
                <AnimatePresence mode="popLayout">
                  {messages.map(function (m, index) {
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 350, 
                          damping: 25,
                          delay: index * 0.1
                        }}
                      >
                        <MessageBubble
                          role={m.role}
                          name={m.name}
                          text={m.text}
                          image={m.image}
                        />
                      </motion.div>
                    )
                  })}
                  
                  {pending && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <TypingBubble />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
       
<div className="px-4 sm:px-6 py-4 sm:py-5 lg:px-7 lg:py-5 bg-white/90 backdrop-blur-xl border-t-2 border-emerald-100/60 w-full">
  <div className="max-w-4xl mx-auto w-full">
    {/* ✅ IMAGE PREVIEW - BAGIAN YANG HILANG */}
    {attached && (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 lg:mb-4 p-3 lg:p-4 rounded-xl lg:rounded-xl bg-emerald-50/90 backdrop-blur-xl border-2 border-emerald-200/60"
        style={{ transform: 'rotate(0.3deg)' }}
      >
        <div className="flex items-center gap-3 lg:gap-4">
          <img src={attached} alt="Plant Image" className="w-12 h-12 lg:w-14 lg:h-14 object-cover rounded-xl lg:rounded-lg border-2 border-emerald-200/60 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 mb-0.5 text-sm lg:text-sm truncate">🌱 Gambar tanaman siap dianalisis</div>
            <div className="text-xs lg:text-xs text-slate-600 truncate">Resolusi tinggi terdeteksi - analisis akan lebih akurat</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setAttached(null)}
            className="w-8 h-8 lg:w-8 lg:h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Remove image"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lg:w-3 lg:h-3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    )}

    {/* Input Container */}
    <div className="relative w-full" style={{ transform: 'rotate(-0.1deg)' }}>
      <div className="flex items-end gap-3 lg:gap-3 w-full">
        {/* ✅ ATTACHMENT BUTTON - DIPERBAIKI */}
        <motion.label
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl lg:rounded-xl bg-emerald-100/90 hover:bg-emerald-200/90 border-2 border-emerald-200/60 hover:border-emerald-300/60 cursor-pointer transition-all duration-200 flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-700 lg:w-4 lg:h-4">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
          </svg>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => onAttach(e.target.result)
                reader.readAsDataURL(file)
              }
            }}
            aria-label="Upload plant image"
          />
        </motion.label>

        {/* Text Input */}
        <div className="flex-1 relative min-w-0 w-full">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (inputValue.trim()) {
                  onSend({ text: inputValue.trim() })
                }
              }
            }}
            placeholder="Jelaskan kondisi tanaman atau upload foto untuk analisis AI..."
            disabled={pending}
            className="w-full bg-white/95 backdrop-blur-xl border-2 border-emerald-200/60 rounded-2xl lg:rounded-xl px-4 lg:px-4 py-3 lg:py-3 text-sm lg:text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/20 resize-none transition-all duration-200 shadow-sm"
            rows="1"
            style={{
              minHeight: '44px',
              maxHeight: '120px',
              height: 'auto'
            }}
            onInput={(e) => {
              e.target.style.height = '44px'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (inputValue.trim()) {
              onSend({ text: inputValue.trim() })
            }
          }}
          disabled={pending || (!inputValue.trim() && !attached)}
          className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl lg:rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white transition-all duration-200 flex items-center justify-center shadow-lg shadow-emerald-600/25 disabled:shadow-none flex-shrink-0"
          aria-label="Send message"
        >
          {pending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lg:w-4 lg:h-4">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </motion.div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="lg:w-4 lg:h-4">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  </div>
</div>

      </div>
    </div>
  )
}

// ✅ MESSAGEBUBBLE DENGAN MARKDOWN PARSER TERINTEGRASI
function MessageBubble({ role, name, text, image }) {
  const isUser = role === 'user'
  
  // Fungsi untuk memproses text markdown
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    
    const lines = rawText.split('\n');
    const processedElements = [];
    
    lines.forEach((line, index) => {
      if (!line.trim()) {
        processedElements.push(<br key={`br-${index}`} />);
        return;
      }
      
      // Headers
      if (line.startsWith('#### ')) {
        processedElements.push(
          <h4 key={index} className="text-sm font-semibold mt-2 mb-1 text-inherit">
            {line.substring(5)}
          </h4>
        );
      } else if (line.startsWith('### ')) {
        processedElements.push(
          <h3 key={index} className="text-base font-semibold mt-3 mb-2 text-inherit">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        processedElements.push(
          <h2 key={index} className="text-lg font-bold mt-4 mb-3 text-inherit">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        processedElements.push(
          <h1 key={index} className="text-xl font-bold mt-4 mb-3 text-inherit">
            {line.substring(2)}
          </h1>
        );
      } else {
        // Process bold text dalam paragraph
        const processLine = (text) => {
          const parts = text.split(/(\*\*.*?\*\*)/);
          return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };
        
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          processedElements.push(
            <div key={index} className="ml-4 mb-1 text-inherit">
              {processLine(line)}
            </div>
          );
        }
        // Bullet point
        else if (line.startsWith('- ')) {
          processedElements.push(
            <div key={index} className="ml-4 mb-1 text-inherit">
              • {processLine(line.substring(2))}
            </div>
          );
        }
        // Regular paragraph
        else {
          processedElements.push(
            <p key={index} className="mb-2 leading-relaxed text-inherit">
              {processLine(line)}
            </p>
          );
        }
      }
    });
    
    return processedElements;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-2 lg:gap-3 max-w-full lg:max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className={`w-8 h-8 lg:w-9 lg:h-9 shrink-0 rounded-xl lg:rounded-lg flex items-center justify-center font-semibold text-sm shadow-lg overflow-hidden ${
            isUser 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-600/25' 
              : 'bg-white shadow-emerald-500/25 border-2 border-emerald-200/50'
          }`}
          style={{ transform: isUser ? 'rotate(1deg)' : 'rotate(-1deg)' }}
        >
          {isUser ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lg:w-4 lg:h-4">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ) : (
            <img 
              src="/icons/pwa-512.png" 
              alt="ORYZA" 
              className="w-full h-full object-cover rounded-xl lg:rounded-lg"
            />
          )}
        </motion.div>
        
        {/* Message Content */}
        <motion.div
          whileHover={{ y: -2 }}
          className={`min-w-0 rounded-2xl lg:rounded-xl px-4 lg:px-4 py-3 lg:py-3 text-sm lg:text-sm shadow-lg transition-all duration-200 backdrop-blur-xl border-2 ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/25 border-blue-500/20'
              : 'bg-white/95 text-slate-900 border-emerald-200/60 shadow-slate-900/5 hover:shadow-xl'
          }`}
          style={{ 
            maxWidth: 'min(550px, calc(100vw - 8rem))', 
            transform: isUser ? 'rotate(0.2deg)' : 'rotate(-0.2deg)' 
          }}
        >
          {image && (
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              src={image}
              alt="plant analysis"
              className="mb-3 lg:mb-4 max-h-48 lg:max-h-52 w-auto rounded-xl lg:rounded-lg border-2 border-emerald-200/60 object-contain shadow-lg"
            />
          )}
          
          {/* ✅ FORMATTED TEXT DENGAN MARKDOWN PARSER */}
          <div className="leading-relaxed font-medium">
            {renderFormattedText(text)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// TypingBubble Component
function TypingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex gap-2 lg:gap-3 max-w-2xl">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-8 h-8 lg:w-9 lg:h-9 shrink-0 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-emerald-200/50"
        >
          <img 
            src="/icons/pwa-512.png" 
            alt="ORYZA" 
            className="w-full h-full object-cover rounded-xl"
          />
        </motion.div>
        <div className="flex items-center">
          <motion.div className="flex items-center gap-1 rounded-2xl bg-white/95 px-4 py-3 shadow-lg border-2 border-emerald-200/60">
            <Dot delay="0s" />
            <Dot delay="0.2s" />
            <Dot delay="0.4s" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Dot Component
function Dot(props) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
      animate={{
        scale: [1, 1.4, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        delay: parseFloat(props.delay.replace('s', ''))
      }}
    />
  )
}

// Utility function
function cryptoRandom() {
  try {
    const a = crypto.getRandomValues(new Uint32Array(1))[0]
    return a.toString(36)
  } catch {
    return Math.floor(Math.random() * 1e9).toString(36)
  }
}
