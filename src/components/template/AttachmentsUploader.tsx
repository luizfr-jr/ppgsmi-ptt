'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2, Download } from 'lucide-react'
import { Attachment } from '@/types'

interface Props {
  templateId: string
  initial: Attachment[]
  readOnly?: boolean
}

function isImage(mime: string) {
  return mime.startsWith('image/')
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentsUploader({ templateId, initial, readOnly = false }: Props) {
  const [list, setList] = useState<Attachment[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    if (!files.length) return
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('files', f))
    try {
      const res = await fetch(`/api/templates/${templateId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setList(prev => [...prev, ...data.data])
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(attachId: string) {
    await fetch(`/api/templates/${templateId}/attachments/${attachId}`, { method: 'DELETE' })
    setList(prev => prev.filter(a => a.id !== attachId))
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-ninma-teal bg-ninma-teal-light/30 scale-[1.01]'
              : 'border-ninma-teal/40 hover:border-ninma-teal hover:bg-ninma-teal-light/10'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          {uploading ? (
            <Loader2 size={28} className="mx-auto text-ninma-teal animate-spin mb-2" />
          ) : (
            <Upload size={28} className="mx-auto text-ninma-teal/60 mb-2" />
          )}
          <p className="text-sm font-medium text-gray-600">
            {uploading ? 'Enviando...' : 'Clique ou arraste arquivos aqui'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Imagens, PDF, documentos — sem limite de quantidade</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {list.length === 0 && readOnly && (
        <p className="text-sm text-gray-400 italic">Nenhum anexo adicionado.</p>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {list.map(att => (
            <div
              key={att.id}
              className="group relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
            >
              {isImage(att.mimeType) ? (
                <img
                  src={att.url}
                  alt={att.originalName}
                  className="w-full h-28 object-cover"
                />
              ) : (
                <div className="w-full h-28 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-ninma-teal-light/30 to-ninma-purple/10">
                  <FileText size={32} className="text-ninma-purple/60" />
                  <span className="text-xs font-medium text-ninma-purple/80 uppercase">
                    {att.originalName.split('.').pop()}
                  </span>
                </div>
              )}

              <div className="p-2">
                <p className="text-xs text-gray-600 truncate font-medium" title={att.originalName}>
                  {att.originalName}
                </p>
                <p className="text-xs text-gray-400">{formatSize(att.size)}</p>
              </div>

              {/* Actions overlay */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/90 hover:bg-ninma-teal-light text-ninma-teal rounded-full p-1 shadow-sm"
                  title="Abrir"
                  onClick={e => e.stopPropagation()}
                >
                  <Download size={13} />
                </a>
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(att.id)}
                    className="bg-white/90 hover:bg-red-50 text-red-500 rounded-full p-1 shadow-sm"
                    title="Excluir"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
