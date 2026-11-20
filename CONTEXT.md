# Contexte produit — livrables 2D

## Référence exprimée le 2026-11-19

L'utilisateur souhaite que Fabrics produise des plans 2D similaires à son dossier
`C:/Users/My PC/Downloads/Villa ROOMIT_B.pdf`, réalisé dans un autre logiciel.
Cette demande définit une référence de résultat ; elle ne vaut pas validation
d'un nouveau lot d'implémentation. La roadmap officielle reste `docs/03-ROADMAP.md`.

## Termes et observations

- **Feuille** : page imprimable réunissant une vue, ses annotations, un cartouche
  et éventuellement des tableaux. Dans la référence, les pages 3 à 13 sont en A2 paysage.
- **Plan de niveau** : vue horizontale cotée avec murs, ouvertures, mobilier,
  noms et surfaces des pièces. Les pages 5 et 6 servent de références visuelles.
- **Gabarit de feuille** : cadre et colonne droite contenant titre, nord selon
  la vue, tableaux de surfaces selon la feuille, et cartouche inférieur.
- **Dossier 2D** : implantation, fondations, RDC, étage, toiture, coupe, quatre
  façades et détail de fosse septique dans cet exemple. Les pages 1 et 2 sont des vues 3D.

## Proposition à discuter

Utiliser la feuille RDC (page 5, A2, 1:50) comme premier cas de comparaison pour
M20 : fidélité graphique, exactitude imprimée, tableaux issus du modèle et mise
à jour après modification. Ne pas considérer une image collée dans un PDF comme
une preuve de production de plans liés au modèle.

## Points ouverts

**Modalité de validation (demande du 2026-11-19)** : conserver les propositions
et questions dans cette liste ; l'utilisateur les validera ensemble à la fin
du cadrage. Ne pas solliciter une validation intermédiaire pour chaque point.
Les propositions ci-dessous ne sont pas encore approuvées.

- Priorité : plans de niveau d'abord ou ensemble du dossier immédiatement.
- Feuille de référence initiale proposée : RDC, page 5, A2 au 1:50.
- Critères d'acceptation à valider : fidélité graphique au PDF de référence,
  lisibilité à l'impression, exactitude des cotes et surfaces, cohérence des
  vues et tableaux après modification du modèle.
- Unités affichées : les cotes du PDF semblent en centimètres, à confirmer ;
  Fabrics documente actuellement les longueurs en millimètres.
- Sens exact des traits bleus interrompus et conventions graphiques à conserver.
- Fondations et assainissement : distinguer représentation de données fournies
  et dimensionnement technique ; ce dernier n'est pas validé par la référence.
- Recherche demandée sur les fondations et fosses septiques : comparer les
  méthodes de Pascal, AutoCAD et Revit (dessin, objets paramétrables, génération
  des plans et détermination des dimensions), identifier ce qui peut être repris
  de Pascal et les ajouts nécessaires dans Fabrics. La recherche est préliminaire ;
  ses conclusions et le périmètre retenu restent à valider à la fin.

## Clarification et recherche demandée le 2026-11-19

- **Qualité des plans 2D** : fidélité graphique à la référence, lisibilité sur
  papier, exactitude des cotes et cohérence des mises à jour. Ce terme ne désigne
  pas un choix de gamme inférieure ou supérieure à la référence de l'utilisateur.
- L'utilisateur demande d'étudier les méthodes de Pascal, AutoCAD et Revit pour
  les fondations et fosses septiques avant de définir leur traitement dans Fabrics.
  Ne pas conclure à leur exclusion sur la seule base du périmètre antérieur.
- Premier repérage : Pascal déclare le type `foundation-plan` et contient du code
  de fondations. Cependant, `packages/pascal/packages/editor/src/store/use-drawing-view.ts`
  indique explicitement que seuls `floor-plan` et `site-plan` disposent du rendu
  éditeur correspondant ; la déclaration ne prouve pas un plan de fondations opérationnel.

L'inspection du PDF établit une cible graphique, pas une validation technique
des fondations, réseaux ou autres ouvrages représentés.
