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
          

          <div 
  className="whitespace-pre-wrap leading-relaxed font-medium"
  dangerouslySetInnerHTML={{
    __html: text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size:1.1em;font-weight:bold;margin:8px 0;">$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4 style="font-size:1em;font-weight:bold;margin:6px 0;">$1</h4>')
      .replace(/^\d+\.\s/gm, '• ')
      .replace(/^- /gm, '• ')
      .replace(/\n/g, '<br/>')
  }}
/>

          {/* FORMATTED TEXT */}
          <div className="leading-relaxed font-medium">
            {renderFormattedText(text)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
