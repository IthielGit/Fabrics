import { useState, type FormEvent } from 'react'

/** Envoi d'un formulaire de la bibliothèque : bloque pendant l'enregistrement, garde l'erreur visible. */
export function useSaveForm<T>(save: (value: T) => Promise<void>, onDone: () => void) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const submit = (event: FormEvent, value: T, blocked: boolean) => {
    event.preventDefault()
    if (blocked) return
    setSaving(true)
    setSaveError(false)
    save(value).then(onDone, (error: unknown) => {
      console.error('Enregistrement dans la bibliothèque :', error)
      setSaveError(true)
      setSaving(false)
    })
  }

  return { saving, saveError, submit }
}
