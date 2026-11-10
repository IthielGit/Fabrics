# 04 — Prompts à envoyer à Claude

Les détails sont dans les autres documents : ces prompts restent courts **exprès**, pour que
Claude suive toujours la même source (`CLAUDE.md` + `docs/`). Copie-colle-les tels quels
dans Claude Code, un à la fois.

---

## P0 — Démarrage (une seule fois, tout au début)

```
Lis CLAUDE.md puis tous les fichiers de docs/ et supabase/schema.sql.
Ne code rien pour l'instant.
1. Résume en 10 lignes maximum ce que tu as compris du produit et du MVP.
2. Liste les contradictions ou les points flous que tu as trouvés dans les documents.
3. Vérifie ce qui est installé sur ma machine (node, npm, git) et dis-moi ce qui manque.
4. Présente ton plan pour le jalon M0, puis attends mon feu vert.
```

## P1 — Lancer un jalon

Remplace `M0` par le jalon voulu (M0, M1, M2… M12).

```
On attaque le jalon M0 de docs/03-ROADMAP.md.
Donne-moi la liste des tâches et des fichiers que tu vas créer ou modifier, puis attends
mon feu vert. Ensuite, réalise les tâches une par une en respectant CLAUDE.md :
build + lint + tests après chaque tâche, case cochée, entrée dans docs/PROGRESS.md,
commit proposé. À la fin, explique-moi comment vérifier chaque critère d'acceptation.
```

## P2 — Reprendre une session

```
Lis CLAUDE.md, docs/PROGRESS.md et docs/03-ROADMAP.md.
Dis-moi où on en est, ce qui reste dans le jalon en cours, et propose la prochaine tâche.
```

## P3 — Valider un jalon

```
Vérifie un par un les critères d'acceptation du jalon en cours.
Pour chacun : comment tu l'as vérifié, et ce que je dois tester moi-même dans le navigateur.
Lance build, lint et tests. Si tout est bon, marque le jalon terminé dans docs/PROGRESS.md.
```

## P4 — Signaler un bug

```
Bug : [ce que j'ai fait] → [ce qui s'est passé] au lieu de [ce que j'attendais].
Message d'erreur (s'il y en a) : [coller ici, depuis le terminal ou la console du navigateur]
Trouve la cause avant de corriger, explique-la en deux phrases, puis corrige.
Ajoute un test qui aurait détecté ce bug si c'est de la logique dans src/features/.
```

## P5 — Demander une modification

```
Je voudrais [changement]. Est-ce que c'est dans le jalon en cours ?
Si oui, fais-le. Si non, ajoute-le aux idées dans docs/PROGRESS.md et ne le code pas.
```

## P6 — Revue de qualité (à la fin de chaque jalon)

```
Fais une revue du code du jalon qui se termine :
- écarts avec docs/02-ARCHITECTURE.md (types, dossiers, dépendances)
- calculs placés dans des composants au lieu de src/features/
- textes d'interface qui ne passent pas par src/i18n/fr.ts
- problèmes de sécurité (clés, RLS)
Liste les problèmes par ordre de gravité, puis demande-moi lesquels corriger.
```

## Conseils

- Une conversation par jalon garde Claude concentré. Commence chaque nouvelle conversation par P2.
- Si Claude part dans une direction qui ne te plaît pas, dis-le tout de suite : « Stop, reviens
  à la dernière version qui marchait » (il peut utiliser git pour ça).
- Ne modifie pas `docs/02-ARCHITECTURE.md` en cours de route sans le dire à Claude : c'est sa
  référence technique.
