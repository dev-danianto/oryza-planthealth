// Ganti MessageBubble component dengan yang ini:

import { motion } from 'framer-motion'

export default function MessageBubble({ role, name, text, image }) {
  const isUser = role === 'user'
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${isUser ? 'justify-end pl-4 sm:pl-12' : 'justify-start pr-4 sm:pr-12'}`}
    >
      <div className={`flex gap-3 max-w-full sm:max-w-2xl lg:max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ${
            isUser 
              ? 'bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-500/25' 
              : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25'
          }`}
        >
          {isUser ? '👤' : '🌱'}
        </motion.div>
        
        {/* Message Bubble */}
        <motion.div
          whileHover={{ y: -1 }}
          className={`min-w-0 rounded-2xl px-4 py-3 shadow-sm border transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400/30 hover:shadow-md'
              : 'bg-white border-green-200 hover:border-green-300 hover:shadow-md dark:bg-gray-800 dark:border-gray-600'
          }`}
          style={{ maxWidth: 'min(90vw, 700px)' }}
        >
          {image && (
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              src={image}
              alt="plant analysis"
              className="mb-3 max-h-60 w-auto rounded-lg border border-green-200 object-contain dark:border-gray-600 mx-auto block"
            />
          )}
          
          {/* Simple Markdown Rendering */}
          {isUser ? (
            <div className="whitespace-pre-wrap leading-relaxed text-white">
              {text}
            </div>
          ) : (
            <div className={`leading-relaxed ${isUser ? 'text-white' : 'text-green-900 dark:text-green-100'}`}>
              <FormattedText text={text} />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Simple Markdown Formatter Component
function FormattedText({ text }) {
  if (!text) return null

  // Split text by lines
  const lines = text.split('\n')
  const elements = []
  let currentList = []
  let listType = null
  let isInCodeBlock = false
  let codeBlockContent = []
  let tableRows = []
  let isInTable = false

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        listType === 'ordered' ? (
          <ol key={elements.length} className="mb-4 ml-4 space-y-1 list-decimal marker:text-green-500">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                <InlineFormatted text={item} />
              </li>
            ))}
          </ol>
        ) : (
          <ul key={elements.length} className="mb-4 ml-4 space-y-1 list-disc marker:text-green-500">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                <InlineFormatted text={item} />
              </li>
            ))}
          </ul>
        )
      )
      currentList = []
      listType = null
    }
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={elements.length} className="mb-4 overflow-x-auto">
          <table className="min-w-full border-collapse border border-green-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
            <thead className="bg-green-100 dark:bg-gray-800">
              <tr>
                {tableRows[0].map((header, idx) => (
                  <th key={idx} className="border border-green-300 dark:border-gray-600 px-4 py-3 text-left font-semibold text-green-800 dark:text-green-200 text-sm">
                    <InlineFormatted text={header.trim()} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(2).map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-green-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-800/50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="border border-green-200 dark:border-gray-700 px-4 py-3 text-green-900 dark:text-green-100 text-sm">
                      <InlineFormatted text={cell.trim()} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
      isInTable = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Handle code blocks
    if (trimmed === '``````')) {
      if (isInCodeBlock) {
        // End code block
        elements.push(
          <pre key={elements.length} className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-xl mb-4 overflow-x-auto text-sm border border-green-200 dark:border-gray-700">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        )
        codeBlockContent = []
        isInCodeBlock = false
      } else {
        // Start code block
        flushList()
        flushTable()
        isInCodeBlock = true
      }
      return
    }

    if (isInCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    // Handle tables
    if (trimmed.includes('|') && trimmed.split('|').length > 2) {
      flushList()
      if (!isInTable) isInTable = true
      
      const cells = trimmed.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
      
      // Skip separator row (contains only - and |)
      if (!trimmed.match(/^[\s\|\-:]*$/)) {
        tableRows.push(cells)
      }
      return
    } else if (isInTable) {
      flushTable()
    }

    // Handle headers
    if (trimmed.startsWith('#')) {
      flushList()
      flushTable()
      
      const level = trimmed.match(/^#+/)[0].length
      const headerText = trimmed.replace(/^#+\s*/, '')
      const className = {
        1: "text-2xl font-bold text-green-800 dark:text-green-200 mb-4 mt-6 first:mt-0 border-b border-green-200 dark:border-gray-600 pb-2",
        2: "text-xl font-bold text-green-800 dark:text-green-200 mb-3 mt-5 first:mt-0",
        3: "text-lg font-semibold text-green-700 dark:text-green-300 mb-2 mt-4 first:mt-0",
        4: "text-base font-semibold text-green-700 dark:text-green-300 mb-2 mt-3 first:mt-0"
      }[level] || "text-sm font-semibold text-green-700 dark:text-green-300 mb-2 mt-2 first:mt-0"

      const HeaderTag = `h${Math.min(level, 6)}`
      elements.push(
        <HeaderTag key={elements.length} className={className}>
          <InlineFormatted text={headerText} />
        </HeaderTag>
      )
      return
    }

    // Handle horizontal rules
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList()
      flushTable()
      elements.push(
        <hr key={elements.length} className="border-t-2 border-green-200 dark:border-gray-600 my-6" />
      )
      return
    }

    // Handle lists
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)/)

    if (orderedMatch || unorderedMatch) {
      if (isInTable) flushTable()
      
      const content = orderedMatch ? orderedMatch[2] : unorderedMatch[1]
      const newListType = orderedMatch ? 'ordered' : 'unordered'
      
      if (listType && listType !== newListType) {
        flushList()
      }
      
      listType = newListType
      currentList.push(content)
      return
    }

    // Flush lists and tables if we hit non-list/table content
    if (currentList.length > 0 && !trimmed.match(/^[-*+]\s+/) && !trimmed.match(/^\d+\.\s+/)) {
      flushList()
    }
    if (isInTable && !trimmed.includes('|')) {
      flushTable()
    }

    // Handle empty lines
    if (trimmed === '') {
      if (elements.length > 0 && elements[elements.length - 1]?.type !== 'br') {
        elements.push(<br key={elements.length} />)
      }
      return
    }

    // Handle regular paragraphs
    elements.push(
      <p key={elements.length} className="mb-3 leading-relaxed">
        <InlineFormatted text={trimmed} />
      </p>
    )
  })

  // Flush any remaining lists or tables
  flushList()
  flushTable()

  return <div className="space-y-1">{elements}</div>
}

// Handle inline formatting (bold, italic, code, etc)
function InlineFormatted({ text }) {
  if (!text) return null

  // Handle inline code first
  let parts = text.split(/(`[^`]+`)/)
  parts = parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-green-100 dark:bg-gray-800 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm font-mono border border-green-200 dark:border-gray-600">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })

  // Handle bold and italic
  const processedParts = []
  parts.forEach((part, partIdx) => {
    if (typeof part === 'string') {
      // Split by bold (**text**)
      const boldParts = part.split(/(\*\*[^*]+\*\*)/)
      boldParts.forEach((boldPart, boldIdx) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          processedParts.push(
            <strong key={`${partIdx}-${boldIdx}`} className="font-bold text-green-800 dark:text-green-200">
              {boldPart.slice(2, -2)}
            </strong>
          )
        } else {
          // Split by italic (*text*)
          const italicParts = boldPart.split(/(\*[^*]+\*)/)
          italicParts.forEach((italicPart, italicIdx) => {
            if (italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) {
              processedParts.push(
                <em key={`${partIdx}-${boldIdx}-${italicIdx}`} className="italic text-green-800 dark:text-green-200">
                  {italicPart.slice(1, -1)}
                </em>
              )
            } else if (italicPart) {
              processedParts.push(italicPart)
            }
          })
        }
      })
    } else {
      processedParts.push(part)
    }
  })

  return <>{processedParts}</>
}
