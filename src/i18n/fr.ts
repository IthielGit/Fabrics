// Tous les textes d'interface de Fabrics (français).
// Aucun texte affiché à l'utilisateur ne doit être écrit directement dans un composant.

export const fr = {
  app: {
    name: 'Fabrics',
    tagline: 'Crée des visuels et des plans à l’échelle, mesure-les instantanément.',
  },
  home: {
    title: 'Projets récents',
    placeholder: 'Page d’accueil provisoire — la liste des projets arrive au jalon M1.',
  },
  editor: {
    title: 'Éditeur',
    placeholder: 'Page éditeur provisoire — le canevas arrive au jalon M1.',
    projectLabel: 'Projet :',
    backToHome: 'Retour à l’accueil',
  },
  projects: {
    defaultDesignName: 'Visuel sans titre',
    defaultPlanName: 'Plan sans titre',
    copySuffix: '(copie)',
  },
  elements: {
    rect: 'Rectangle',
    ellipse: 'Ellipse',
  },
  notFound: {
    title: 'Page introuvable',
    backToHome: 'Retour à l’accueil',
  },
} as const
