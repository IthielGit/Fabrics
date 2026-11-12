import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import AuthField from '../components/auth/AuthField'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessages from '../components/auth/AuthMessages'
import Button from '../components/ui/Button'
import type { AuthErrorKey } from '../features/auth/authErrors'
import { isValidEmail, signUpProblems, type FieldProblem } from '../features/auth/authValidation'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../stores/authStore'

type Mode = 'signIn' | 'signUp' | 'forgot'

const LINK_CLASS =
  'rounded-sm text-sm font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition-colors hover:text-indigo-900 hover:decoration-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
const SUBMIT_CLASS = 'h-11 w-full justify-center text-[0.9375rem]'

export default function LoginPage() {
  const status = useAuthStore((state) => state.status)
  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset)

  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [problems, setProblems] = useState<FieldProblem[]>([])
  const [error, setError] = useState<AuthErrorKey | null>(null)
  const [pending, setPending] = useState(false)
  /** Adresse à laquelle un e-mail vient d'être envoyé (inscription ou mot de passe oublié). */
  const [sentTo, setSentTo] = useState<{ email: string; kind: 'signUp' | 'reset' } | null>(null)

  // Sans Supabase ou déjà connecté : rien à faire ici.
  if (status === 'disabled' || status === 'signedIn') return <Navigate to="/" replace />

  const switchMode = (next: Mode) => {
    setMode(next)
    setProblems([])
    setError(null)
    setSentTo(null)
    setPassword('')
    setConfirm('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    setError(null)

    let found: FieldProblem[]
    if (mode === 'signUp') found = signUpProblems(email, password, confirm)
    else found = isValidEmail(email) ? [] : ['emailInvalid']
    setProblems(found)
    if (found.length > 0) return

    setPending(true)
    let result: AuthErrorKey | null
    if (mode === 'signIn') result = await signIn(email, password)
    else if (mode === 'signUp') result = await signUp(email, password)
    else result = await sendPasswordReset(email)
    setPending(false)

    if (result) setError(result)
    else if (mode === 'signUp') setSentTo({ email: email.trim(), kind: 'signUp' })
    else if (mode === 'forgot') setSentTo({ email: email.trim(), kind: 'reset' })
    // Connexion réussie : l'état de connexion change et la page redirige vers l'accueil.
  }

  const handleGoogle = async () => {
    if (pending) return
    setError(null)
    setPending(true)
    const result = await signInWithGoogle()
    // Succès : le navigateur part vers Google, la page est quittée.
    if (result) {
      setPending(false)
      setError(result)
    }
  }

  const texts: Record<Mode, { title: string; intro: string; submit: string }> = {
    signIn: { title: fr.auth.signInTitle, intro: fr.auth.signInIntro, submit: fr.auth.signInSubmit },
    signUp: { title: fr.auth.signUpTitle, intro: fr.auth.signUpIntro, submit: fr.auth.signUpSubmit },
    forgot: { title: fr.auth.forgotTitle, intro: fr.auth.forgotIntro, submit: fr.auth.forgotSubmit },
  }
  const current = texts[mode]

  if (sentTo) {
    return (
      <AuthLayout title={fr.auth.checkEmailTitle}>
        <p role="status" className="text-sm leading-relaxed text-slate-700">
          {sentTo.kind === 'signUp'
            ? fr.auth.checkEmailSignUp(sentTo.email)
            : fr.auth.checkEmailReset(sentTo.email)}
        </p>
        <Button className="mt-5" onClick={() => switchMode('signIn')}>
          {fr.auth.backToSignIn}
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={current.title} intro={current.intro}>
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-5">
        <AuthField
          label={fr.auth.email}
          type="email"
          value={email}
          autoComplete="email"
          autoFocus
          invalid={problems.includes('emailInvalid')}
          onChange={setEmail}
        />
        {mode !== 'forgot' && (
          <AuthField
            label={fr.auth.password}
            type="password"
            value={password}
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            hint={mode === 'signUp' ? fr.auth.passwordHint : undefined}
            invalid={problems.includes('passwordTooShort')}
            labelAction={
              mode === 'signIn' ? (
                <button type="button" className={LINK_CLASS} onClick={() => switchMode('forgot')}>
                  {fr.auth.forgotLink}
                </button>
              ) : undefined
            }
            onChange={setPassword}
          />
        )}
        {mode === 'signUp' && (
          <AuthField
            label={fr.auth.confirmPassword}
            type="password"
            value={confirm}
            autoComplete="new-password"
            invalid={problems.includes('passwordsDiffer')}
            onChange={setConfirm}
          />
        )}
        <AuthMessages problems={problems} error={error} />
        <Button type="submit" variant="primary" disabled={pending} className={SUBMIT_CLASS}>
          {pending ? fr.auth.working : current.submit}
        </Button>
      </form>

      {mode !== 'forgot' && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-slate-500" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            {fr.auth.orDivider}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Button type="button" disabled={pending} className={SUBMIT_CLASS} onClick={() => void handleGoogle()}>
            {fr.auth.withGoogle}
          </Button>
        </>
      )}

      <div className="mt-8 text-sm">
        {mode === 'signIn' && (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode('signUp')}>
            {fr.auth.toSignUp}
          </button>
        )}
        {mode === 'signUp' && (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode('signIn')}>
            {fr.auth.toSignIn}
          </button>
        )}
        {mode === 'forgot' && (
          <button type="button" className={LINK_CLASS} onClick={() => switchMode('signIn')}>
            {fr.auth.backToSignIn}
          </button>
        )}
      </div>
    </AuthLayout>
  )
}
