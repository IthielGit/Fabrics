/** Adresse du lien d'invitation à un espace (page `/espace/<jeton>`). */
export function workspaceInviteUrl(token: string, origin: string = window.location.origin): string {
  return `${origin}/espace/${encodeURIComponent(token)}`
}
