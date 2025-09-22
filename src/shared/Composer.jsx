import { useRef, useState } from 'react'

export default function Composer({ onSend, onAttach, attached, onClearAttachment }) {
  const [text, setText] = useState('')
  const fileRef = useRef(null)

  function send() {
    if (!text && !attached) return
    onSend({ text: text })
    setText('')
  }

  async function pickFile(e) {
    const fl = e && e.target && e.target.files
    const file = fl && fl[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    if (typeof onAttach === 'function') onAttach(dataUrl)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {attached ? (
        <div className="mb-2 flex items-center gap-3">
          <img src={attached} alt="attachment" className="h-16 w-16 rounded-md border object-cover" />
          <button
            onClick={onClearAttachment}
            className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Remove
          </button>
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <button
          onClick={function () { if (fileRef.current) fileRef.current.click() }}
          className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80"
          aria-label="Attach image"
        >
          +
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pickFile}
          className="hidden"
        />
        <textarea
          value={text}
          onChange={function (e) { setText(e.target.value) }}
          rows={1}
          placeholder="Message ORYZA..."
          className="min-h-[44px] flex-1 resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:placeholder:text-slate-500"
        />
        <button
          onClick={send}
          className="shrink-0 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          Send
        </button>
      </div>
    </div>
  )
}

function fileToDataUrl(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader()
    reader.onload = function () { resolve(reader.result) }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
