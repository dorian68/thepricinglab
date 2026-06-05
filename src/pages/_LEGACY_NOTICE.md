# ⚠️ Legacy / non monté — lire avant d'éditer ce dossier

`App.tsx` ne monte **que** `src/claude/ClaudeFrontend.jsx` (hash-router maison).
Aucun fichier vivant n'importe `src/pages/*` (vérifié : 0 import hors de ce dossier).

**Conséquence :** les pages React de ce dossier (`Courses.tsx`, `courses/BlackScholes.tsx`,
`courses/Greeks.tsx`, etc.) **ne sont pas affichées** par l'application en production.
Le rendu réel des cours passe par `ClaudeFrontend.jsx` qui charge les markdown
`public/course-scripts/*.md` générés par le backend RAG.

**Risque :** corriger un cours ici n'a aucun effet visible. C'est le piège
principal de cette base (double frontend).

**Où corriger réellement la section cours :**
- contenu des cours → backend `Tools/pricinglibrary_rag_backend` (génération) +
  fichiers `public/course-scripts/*.md` ;
- rendu/UI des cours → `src/claude/ClaudeFrontend.jsx`
  (`CourseDetailPage`, `parseCourseScript`, `CourseScript`).

**Décision en attente (à valider avec le propriétaire) :** soit remonter ces
pages proprement dans un routeur, soit les déplacer dans `src/legacy/`. Tant que
ce n'est pas tranché, ne pas supprimer (historique potentiellement utile) mais ne
pas investir d'effort produit ici.
