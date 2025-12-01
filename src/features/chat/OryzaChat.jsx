import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// ✅ PERBAIKAN: Import chatEdutora langsung, bukan sebagai alias dari chatOryza
import { chatEdutora } from '../../lib/oryza.js'

const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/mistral-small-3.2-24b-instruct:free'

const INITIAL_MESSAGE = {
  id: 'greet',
  role: 'assistant',
  name: 'EDUTORA',
  text: 'Halo, ini EDUTORA. AI Asisten Belajar yang siap membantu membahas soal, materi pelajaran, dan tugas Anda.',
  ts: Date.now()
}

export default function EdutoraChat() {
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('edutora-recent-activity')
      if (saved) {
        const activities = JSON.parse(saved)
        setRecentActivity(activities.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error)
    }
  }, [])

  const saveActivity = (activity) => {
    try {
      const existing = JSON.parse(localStorage.getItem('edutora-recent-activity') || '[]')
      const updated = [activity, ...existing.filter(item => item.id !== activity.id)].slice(0, 10)
      localStorage.setItem('edutora-recent-activity', JSON.stringify(updated))
      setRecentActivity(updated.slice(0, 5))
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

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

  const getActivityInfo = (text, hasImage) => {
    const lowerText = text.toLowerCase()
    
    if (hasImage) {
      return {
        type: 'scan',
        icon: '📸',
        color: 'indigo',
        title: 'Scan soal/tugas'
      }
    }
    
    if (lowerText.includes('rumus') || lowerText.includes('hitung') || lowerText.includes('matematika')) {
      return {
        type: 'math',
        icon: '📐',
        color: 'blue',
        title: 'Matematika/Sains'
      }
    }
    
    if (lowerText.includes('sejarah') || lowerText.includes('siapa') || lowerText.includes('kapan')) {
      return {
        type: 'history',
        icon: '📜',
        color: 'amber',
        title: 'Sejarah/Sosial'
      }
    }
    
    if (lowerText.includes('kode') || lowerText.includes('program') || lowerText.includes('error')) {
      return {
        type: 'coding',
        icon: '💻',
        color: 'violet',
        title: 'Programming'
      }
    }
    
    return {
      type: 'general',
      icon: '🎓',
      color: 'slate',
      title: 'Tanya Jawab Umum'
    }
  }

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

      const content = await chatEdutora({
        prompt: text,
        imageDataUrl: attached,
        model,
        signal: abortRef.current.signal
      })

      const assistantMsg = {
        id: 'a-' + cryptoRandom(),
        role: 'assistant',
        name: 'EDUTORA',
        text: content || '(no content)',
        ts: Date.now()
      }
      appendMessage(assistantMsg)

      const updatedActivity = {
        ...activity,
        hasResult: true,
        resultPreview: content ? content.slice(0, 50) + '...' : 'Pembahasan selesai'
      }
      saveActivity(updatedActivity)

    } catch (e) {
      setError(String(e))
      appendMessage({
        id: 'e-' + cryptoRandom(),
        role: 'assistant',
        name: 'EDUTORA',
        text: 'Maaf, terjadi kesalahan saat memproses permintaan.',
        ts: Date.now()
      })

      const errorActivity = {
        ...activity,
        hasResult: false,
        resultPreview: 'Gagal memproses'
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

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 0)
    }
  }, [messages, pending])

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
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 relative overflow-hidden">
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

      <motion.div
        initial={false}
        animate={isDesktop ? { x: 0 } : { x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className={`
          fixed lg:relative lg:translate-x-0 
          w-80 sm:w-72 md:w-80 
          lg:w-80 xl:w-88
          h-full bg-white/90 backdrop-blur-xl 
          border-r-2 border-indigo-200/50
          flex flex-col z-50 shadow-xl lg:shadow-none
        `}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 lg:px-6 lg:py-5 border-b border-indigo-100/60">
          <div className="flex items-center gap-4 lg:gap-3">
            <div 
              className="w-11 h-11 sm:w-12 sm:h-12 lg:w-11 lg:h-11 rounded-2xl lg:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 overflow-hidden bg-white"
              style={{ transform: 'rotate(-1deg)' }}
            >
              <img 
                src="/icons/pwa-512.png" 
                alt="Edutora Logo" 
                className="w-full h-full object-cover rounded-2xl lg:rounded-xl"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 
                className="text-xl sm:text-2xl lg:text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-800 bg-clip-text text-transparent truncate"
                style={{ letterSpacing: '-0.02em' }}
              >
                EDUTORA
              </h1>
              <p className="text-sm lg:text-sm text-slate-500 font-medium truncate">
                AI Learning Assistant
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
              className="w-full text-sm lg:text-sm font-medium text-slate-700 bg-indigo-50/80 border border-indigo-200/60 rounded-xl lg:rounded-lg px-4 lg:px-3 py-3 lg:py-2 focus:ring-2 focus:ring-indigo-400/30 focus:bg-white transition-all"
            >
              <option value="mistralai/mistral-small-3.2-24b-instruct:free">🎓 General Tutor</option>
              <option value="openai/gpt-5">🧠 Deep Reasoning</option>
            </select>
          </div>
        </div>

        <nav className="flex-1 px-4 sm:px-5 py-5 lg:px-4 lg:py-4 overflow-y-auto">
          <div className="space-y-2 lg:space-y-1">
            <motion.button 
              whileHover={{ scale: 1.02, x: 8 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 lg:gap-3 px-4 lg:px-3 py-3 lg:py-2 text-sm lg:text-sm font-semibold text-slate-900 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 rounded-xl lg:rounded-lg transition-all duration-200 border border-indigo-100 shadow-sm"
            >
              <div className="w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full bg-indigo-500 flex-shrink-0 animate-pulse"></div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600 flex-shrink-0 lg:w-4 lg:h-4">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <span className="truncate">Ruang Belajar</span>
            </motion.button>
          </div>

          <div className="mt-8 lg:mt-6">
            <div className="flex items-center justify-between mb-3 lg:mb-2 px-1">
              <h3 className="text-xs lg:text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Riwayat Belajar
              </h3>
            </div>
            
            <div className="space-y-2 lg:space-y-1">
              {recentActivity.length === 0 ? (
                <div className="p-3 lg:p-3 rounded-lg bg-slate-50/50 border border-slate-200/30 text-center">
                  <div className="text-xs text-slate-500">
                    Belum ada sesi belajar
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
                          activity.color === 'indigo' ? 'bg-indigo-100' :
                          activity.color === 'amber' ? 'bg-amber-100' :
                          activity.color === 'violet' ? 'bg-violet-100' :
                          activity.color === 'blue' ? 'bg-blue-100' :
                          'bg-slate-100'
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
            className="w-full flex items-center justify-center gap-3 lg:gap-2 px-5 lg:px-4 py-4 lg:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl lg:rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/25 text-sm lg:text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 lg:w-4 lg:h-4">
              <path d="M12 5v14m7-7H5"/>
            </svg>
            <span className="truncate">Sesi Baru</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 w-full min-h-0">
        <div className="px-4 sm:px-6 py-4 sm:py-5 lg:px-6 lg:py-4 bg-white/85 backdrop-blur-xl border-b border-indigo-100/60">
          <div className="flex items-center gap-3 lg:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 flex items-center justify-center lg:hidden transition-colors flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lg:w-4 lg:h-4">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="18" x2="16" y2="18"/>
              </svg>
            </button>

            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-11 lg:h-11 rounded-xl lg:rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0 overflow-hidden bg-white"
              style={{ transform: 'rotate(-0.5deg)' }}
            >
              <img 
                src="/icons/pwa-512.png" 
                alt="Edutora Logo" 
                className="w-full h-full object-cover rounded-xl lg:rounded-lg"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-lg font-bold text-slate-900 truncate">Edutora AI</h2>
              <p className="text-sm lg:text-sm text-slate-500 truncate">Teman belajar pintar & interaktif</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 w-full">
          {messages.length <= 1 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 py-8 lg:px-7 lg:py-9 relative w-full">
              <div className="max-w-4xl text-center relative z-10 w-full">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 lg:mb-4"
                >
                  Selamat Datang! 🎓
                </motion.h1>
                
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-xl lg:text-2xl font-light text-slate-600 mb-6 sm:mb-8 lg:mb-9"
                >
                  Apa yang ingin kita{' '}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent font-semibold">
                    pelajari hari ini?
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

        <div className="px-4 sm:px-6 py-4 sm:py-5 lg:px-7 lg:py-5 bg-white/90 backdrop-blur-xl border-t-2 border-indigo-100/60 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {attached && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ op
