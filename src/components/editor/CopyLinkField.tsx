import { useState } from 'react'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import { SHARE_INPUT } from './shareStyles'

interface CopyLinkFieldProps {
  url: string
}

/** Adresse d'un lien (lien public ou invitation) en lecture seule, avec un bouton « Copier ». */
export default function CopyLinkField({ url }: CopyLinkFieldProps) {
  const t = fr.share
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers refusé : l'adresse reste sélectionnable dans le champ.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        aria-label={t.linkLabel}
        value={url}
        onFocus={(event) => event.target.select()}
        className={`${SHARE_INPUT} min-w-0 flex-1 bg-slate-50 text-xs`}
      />
      <Button onClick={() => void copy()} className="px-3 py-1.5">
        {copied ? t.copied : t.copy}
      </Button>
    </div>
  )
}
