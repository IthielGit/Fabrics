# M24 — Plan du jalon (contrôles qualité, performance, sécurité, gate G7)

Réévalué le 2026-11-27 à la demande de l'utilisateur, avec un seul fil conducteur : **facile à utiliser**.
Décisions : `M24-decisions.md` (D24-0 à D24-6, choisies par Claude). **En attente du feu vert ; rien
n'est codé.** Tout le jalon d'une traite, un commit par sous-lot sur `pascal`, essai de l'utilisateur
à la fin.

## Ce qui change par rapport au découpage du 2026-11-18

- **24.1 devient le cœur du jalon** : un onglet « Contrôles » pensé pour l'utilisateur (gravité,
  explication, bouton), au lieu d'une simple liste technique.
- **24.6 est remonté avant la performance** : retrouver son travail après un plantage et sauvegarder
  en un clic comptent plus pour l'utilisateur que des millisecondes.
- **24.2 et 24.3 sont regroupés** (régression et épreuves) : invisibles pour l'utilisateur, ils
  partagent les mêmes plans d'essai.
- **Messages d'import réécrits** (24.5) : chaque refus dit quoi faire.

## Sous-lots (ordre d'exécution)

| Sous-lot | Pour l'utilisateur | Contenu technique |
|---|---|---|
| **24.1 Onglet « Contrôles »** | Un seul endroit pour tout ce qui cloche, en trois groupes : **« À corriger avant d'exporter »**, **« À vérifier »**, **« Pour information »**. Chaque ligne : ce qui ne va pas, pourquoi, bouton « Voir sur le plan » (et « Corriger » quand c'est sûr, ex. raccorder deux murs). La pastille du haut compte les points et ouvre l'onglet. | Agrège `warnings.ts`, `qualityChecks.ts`, `wallContacts`, contrôles du DQE ; les 7 cas d'EDGE-01 signalés (test) ; textes D24-0 |
| **24.2 Sécurité des imports** | Un fichier refusé l'est avec une phrase claire (« Ce fichier IFC fait 180 Mo ; la limite est 100 Mo. Essayez d'exporter un seul bâtiment. »). Un import long montre sa progression et peut être annulé. | Inventaire des entrées (IFC, DXF, prix, images, fichier projet) ; limites de taille et de contenu ; limite IFC ajoutée ; fichiers piégés en test |
| **24.3 Fiabilité** | Bandeau **« Reprendre là où vous en étiez ? »** après une fermeture brutale ; boutons « Télécharger une sauvegarde » et « Exporter la bibliothèque » ; restauration en copie ; onglet « Journal » lisible. Exports : fichier complet ou rien. | D24-3, D24-4 ; table d'événements pour les manques ; tests de reprise |
| **24.4 Performance** | L'éditeur reste fluide sur un grand projet ; barre de progression sur les exports longs. | Générateur de plans 1 000 / 5 000 / 10 000 ; mesures Node et Chromium (dont machine lente) ; optimisations ciblées ; rapport face à D24-1 |
| **24.5 Épreuves et régression** | Rien de visible : la garantie que la suite ne casse rien. | Référence étendue au PDF et à la 3D (captures Playwright) ; tests sur plans tirés au hasard (reproductibles, sans nouvelle bibliothèque) ; épreuves HOUSE-01, villa ROOMIT, petit immeuble R+3 (nouveau), modèles abîmés, IFC extérieurs (D24-5) |
| **24.6 Dossier de revue et gate G7** | Un dossier prêt à envoyer à un architecte et à un métreur, avec une grille simple. | D24-6 ; rapport `M24-report.md` ; G7 ouvert jusqu'à la revue |

## Ce que l'utilisateur essaiera à la fin

1. Ouvrir EDGE-01 : l'onglet « Contrôles » montre les 7 cas, chacun avec « Voir sur le plan ».
2. Importer un fichier trop gros ou abîmé : refus clair, rien n'est cassé.
3. Fermer l'onglet en pleine saisie, rouvrir : « Reprendre là où vous en étiez ? ».
4. Télécharger une sauvegarde, la restaurer : une copie apparaît, l'original est intact.
5. Ouvrir le projet de 5 000 éléments : il reste fluide ; exporter en PDF avec la barre de progression.
6. Lire le journal du projet et celui de la bibliothèque.

## Dépendances

Aucune nouvelle. Playwright (captures 3D) est déjà admis comme outil de Pascal (D78). Si un besoin
apparaît, l'utilisateur sera consulté d'abord (règle 6).
