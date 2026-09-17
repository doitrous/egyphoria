'use client'
import { useState } from 'react'

export function EmbedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <textarea readOnly rows={6} value={code} style={{ width: '100%' }} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" onClick={() => navigator.clipboard.writeText(code).then(() => setCopied(true))}>
        {copied ? 'Copied' : 'Copy embed code'}
      </button>
    </div>
  )
}
