/** Règles de saisie du formulaire de connexion (fonctions pures). */

export const MIN_PASSWORD_LENGTH = 8

export type FieldProblem = 'emailInvalid' | 'passwordTooShort' | 'passwordsDiffer'

/** Vrai si le texte ressemble à une adresse e-mail (le vrai contrôle est la vérification par e-mail). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH
}

/** Problèmes d'une inscription ou d'un nouveau mot de passe ; liste vide si tout est bon. */
export function signUpProblems(email: string, password: string, confirm: string): FieldProblem[] {
  const problems: FieldProblem[] = []
  if (!isValidEmail(email)) problems.push('emailInvalid')
  if (!isValidPassword(password)) problems.push('passwordTooShort')
  else if (password !== confirm) problems.push('passwordsDiffer')
  return problems
}

export function newPasswordProblems(password: string, confirm: string): FieldProblem[] {
  const problems: FieldProblem[] = []
  if (!isValidPassword(password)) problems.push('passwordTooShort')
  else if (password !== confirm) problems.push('passwordsDiffer')
  return problems
}
