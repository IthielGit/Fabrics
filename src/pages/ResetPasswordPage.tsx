import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import AuthField from '../components/auth/AuthField'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessages from '../components/auth/AuthMessages'
import Button from '../components/ui/Button'
import type { AuthErrorKey } from '../features/auth/authErrors'
import { newPasswordProblems, type FieldProblem } from '../features/auth/authValidation'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'

const LINK_CLASS = 'mt-4 inline-block text-sm text-indigo-700 underline underline-offset-2'

/** Page ouverte par le lien « mot de passe oublié » reçu par e-mail. */
export default function ResetPasswordPage() {
  const status = useAuthStore((state) => state.status)
  const recovery = useAuthStore((state) => state.recovery)
  const updatePassword = useAuthStore((state) => state.updatePassword)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [problems, setProblems] = useState<FieldProblem[]>([])
  const [error, setError] = useState<AuthErrorKey | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  if (status === 'disabled') return <Navigate to="/" replace />
  if (status === 'loading') {
    return (
      <AuthLayout title={fr.auth.resetTitle}>
        <p className="text-sm text-slate-600">{fr.common.loading}</p>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title={fr.auth.resetTitle}>
        <p role="status" className="text-sm text-slate-700">
          {fr.auth.resetDone}
        </p>
        <Link to="/" className={LINK_CLASS}>
          {fr.auth.backToHome}
        </Link>
      </AuthLayout>
    )
  }

  if (!recovery) {
    return (
      <AuthLayout title={fr.auth.resetTitle}>
        <p role="alert" className="text-sm text-slate-700">
          {fr.auth.resetNoLink}
        </p>
        <Link to="/connexion" className={LINK_CLASS}>
          {fr.auth.backToSignIn}
        </Link>
      </AuthLayout>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    const found = newPasswordProblems(password, confirm)
    setProblems(found)
    if (found.length > 0) return
    setPending(true)
    const result = await updatePassword(password)
    setPending(false)
    if (result) setError(result)
    else setDone(true)
  }

  return (
    <AuthLayout title={fr.auth.resetTitle} intro={fr.auth.resetIntro}>
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-4">
        <AuthField
          label={fr.auth.password}
          type="password"
          value={password}
          autoComplete="new-password"
          hint={fr.auth.passwordHint}
          onChange={setPassword}
        />
        <AuthField
          label={fr.auth.confirmPassword}
          type="password"
          value={confirm}
          autoComplete="new-password"
          onChange={setConfirm}
        />
        <AuthMessages problems={problems} error={error} />
        <Button type="submit" variant="primary" disabled={pending} className="justify-center">
          {pending ? fr.auth.working : fr.auth.resetSubmit}
        </Button>
      </form>
    </AuthLayout>
  )
}
