import type { AuthErrorKey } from '../../features/auth/authErrors'
import type { FieldProblem } from '../../features/auth/authValidation'
import { fr } from '../../i18n/fr'

interface AuthMessagesProps {
  problems: FieldProblem[]
  error: AuthErrorKey | null
}

/** Messages d'erreur d'un formulaire de connexion (annoncés par les lecteurs d'écran). */
export default function AuthMessages({ problems, error }: AuthMessagesProps) {
  const lines = [
    ...problems.map((problem) => fr.auth.problems[problem]),
    ...(error ? [fr.auth.errors[error]] : []),
  ]
  if (lines.length === 0) return null
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
