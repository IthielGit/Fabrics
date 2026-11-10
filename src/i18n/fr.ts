// Tous les textes d'interface de Fabrics (français).
// Aucun texte affiché à l'utilisateur ne doit être écrit directement dans un composant.

export const fr = {
  app: {
    name: 'Fabrics',
    tagline: 'Crée des visuels et des plans à l’échelle, mesure-les instantanément.',
  },
  common: {
    cancel: 'Annuler',
    close: 'Fermer',
    save: 'Enregistrer',
    loading: 'Chargement…',
    retry: 'Réessayer',
  },
  home: {
    title: 'Projets récents',
    newDesign: 'Nouveau visuel',
    newPlan: 'Nouveau plan',
    emptyTitle: 'Aucun projet pour le moment',
    emptyText:
      'Créez un visuel (affiche, post, flyer) ou un plan à l’échelle pour commencer. Vos projets sont enregistrés automatiquement dans ce navigateur.',
    loadError: 'Impossible de charger vos projets.',
  },
  projects: {
    defaultDesignName: 'Visuel sans titre',
    defaultPlanName: 'Plan sans titre',
    copySuffix: '(copie)',
    kindDesign: 'Visuel',
    kindPlan: 'Plan',
    menuLabel: 'Actions du projet',
    rename: 'Renommer',
    duplicate: 'Dupliquer',
    delete: 'Supprimer',
    renameTitle: 'Renommer le projet',
    nameLabel: 'Nom du projet',
    deleteTitle: 'Supprimer ce projet ?',
    deleteMessage: (name: string) =>
      `« ${name} » sera supprimé définitivement. Cette action est irréversible.`,
  },
  formats: {
    title: 'Choisir un format',
    'post-square': 'Post carré',
    story: 'Story',
    a4: 'A4',
    a3: 'Affiche A3',
    banner: 'Bannière',
    size: (width: number, height: number) => `${width} × ${height} px`,
  },
  editor: {
    backToHome: 'Retour à l’accueil',
    notFoundTitle: 'Projet introuvable',
    notFoundText: 'Ce projet n’existe pas ou a été supprimé.',
    loadError: 'Impossible d’ouvrir ce projet.',
    zoomLabel: 'Niveau de zoom',
    zoomValue: (percent: number) => `Zoom ${percent} %`,
    fitToScreen: 'Ajuster à l’écran',
    undo: 'Annuler',
    redo: 'Rétablir',
    saving: 'Enregistrement…',
    saved: 'Enregistré',
    saveError: 'Erreur d’enregistrement',
    saveErrorHint: 'Les dernières modifications n’ont pas pu être enregistrées dans ce navigateur.',
  },
  tools: {
    label: 'Outils',
    select: 'Sélection',
    rect: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Ligne',
  },
  elements: {
    rect: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Ligne',
  },
  notFound: {
    title: 'Page introuvable',
    backToHome: 'Retour à l’accueil',
  },
} as const
