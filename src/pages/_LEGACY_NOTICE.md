# ⚠️ Legacy / non monté — lire avant d'éditer ce dossier

`App.tsx` ne monte **que** `src/claude/ClaudeFrontend.jsx` (hash-router maison).
Aucun fichier vivant n'importe `src/pages/*` (vérifié : 0 import hors de ce dossier).

**Conséquence :** les pages React de ce dossier (`Courses.tsx`, `courses/BlackScholes.tsx`,
`courses/Greeks.tsx`, etc.) **ne sont pas affichées** par l'application en production.
Le rendu réel des cours passe par `ClaudeFrontend.jsx`. Seul l'aperçu gratuit
`public/course-scripts/vanilla-options-quote.md` est public ; les cours payants
sont servis après authentification par l'API backend `/courses/{id}/script`.

**Risque :** corriger un cours ici n'a aucun effet visible. C'est le piège
principal de cette base (double frontend).

**Où corriger réellement la section cours :**
- contenu des cours → `Tools/pricinglibrary_rag_backend/pricinglibrary_rag/course_scripts/*.md` ;
- rendu/UI des cours → `src/claude/ClaudeFrontend.jsx`
  (`CourseDetailPage`, `parseCourseScript`, `CourseScript`).

**Décision en attente (à valider avec le propriétaire) :** soit remonter ces
pages proprement dans un routeur, soit les déplacer dans `src/legacy/`. Tant que
ce n'est pas tranché, ne pas supprimer (historique potentiellement utile) mais ne
pas investir d'effort produit ici.
