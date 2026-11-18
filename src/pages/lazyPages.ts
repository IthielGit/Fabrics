import { lazy } from 'react'

// Pages chargées à la demande (lot Performance) : l'accueil ne télécharge que ce qu'il affiche.
// Chaque fonction `load…` sert aussi au préchargement (survol d'une carte de projet).
export const loadPascalEditorPage = () => import('./PascalEditorPage')
export const loadEditorPage = () => import('./EditorPage')

export const PascalEditorPage = lazy(loadPascalEditorPage)
export const EditorPage = lazy(loadEditorPage)
export const ProjectPage = lazy(() => import('./ProjectPage'))
export const SharedProjectPage = lazy(() => import('./SharedProjectPage'))
export const VersionPreviewPage = lazy(() => import('./VersionPreviewPage'))
export const SettingsPage = lazy(() => import('./SettingsPage'))
export const IntroPage = lazy(() => import('./IntroPage'))
export const InvitePage = lazy(() => import('./InvitePage'))
export const SharePage = lazy(() => import('./SharePage'))
export const ResetPasswordPage = lazy(() => import('./ResetPasswordPage'))

/** Précharge l'éditeur d'un projet (plan → Pascal, visuel → Konva), sans l'afficher. */
export function preloadEditor(kind: 'plan' | 'design'): void {
  void (kind === 'design' ? loadEditorPage() : loadPascalEditorPage()).catch(() => undefined)
}
