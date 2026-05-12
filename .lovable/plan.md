## Audit UI — instabilités détectées

J'ai parcouru `Home`, `AppShell`, `ModernNavbar`, `NewsletterBanner`, `SplashScreen`, `index.css` et `index.html`. Le site est solide sur le fond ; les "sauts" perçus viennent surtout de **layout shifts au chargement** et de **doubles couches de styling** (tokens sémantiques vs classes `finance-*` codées en dur). Voici ce que je propose de corriger, **sans aucune régression fonctionnelle, ni changement de routes, d'auth, de pricing, de SEO ou de contenu**.

### 1. Bandeau Newsletter — saut de ~120 px à l'ouverture
Le banner est rendu via `useEffect` → `setIsVisible(true)` après le premier paint. Le contenu de la page se positionne d'abord SANS le banner, puis se décale vers le bas dès qu'il apparaît.

**Fix** : initialiser `isVisible` directement depuis `localStorage` dans `useState(() => …)`, comme le fait déjà `SplashScreen`. Plus aucun saut au mount.

### 2. SplashScreen — z-index trop bas + chevauchement navbar
- Le splash est en `z-50`, **identique** à la navbar sticky (`z-50`). Au moment du fade-out, la navbar peut transparaître/disparaître par-dessus.
- Le splash est rendu **en dehors** de `HelmetProvider` ; pendant son affichage les polices Google n'ont pas fini de charger → quand il disparaît, les titres `JetBrains Mono` se redessinent (FOUT) et créent un sursaut.

**Fix** :
- Passer le splash en `z-[9999]`.
- Ajouter `pointer-events-none` après le début du fade pour ne pas bloquer les clics.
- Donner un `aria-hidden` propre.

### 3. Polices — FOUT visible sur tous les titres
`index.html` charge Inter + JetBrains Mono via `media="print" onload=…` (non-bloquant) sans fallback ajusté. Tous les `h1-h6` (`JetBrains Mono`) et le corps (`Inter`) sautent en largeur quand les polices arrivent.

**Fix** : ajouter dans `index.css` deux `@font-face` "fallback ajustés" avec `size-adjust`, `ascent-override`, `descent-override` (technique standard Vercel/Next), et les utiliser en première position dans `font-family`. Aucun changement visuel final, juste suppression du saut de layout.

### 4. AppShell — fond en double (couleur dupliquée)
`body` est en `hsl(220 12% 10%)` (`--background`) ; AppShell impose `bg-finance-dark` = `#141720` qui n'est pas exactement la même teinte. Sur écrans précis, on voit une mince bande de seam au-dessus de la navbar et au footer.

**Fix** : remplacer `bg-finance-dark text-finance-offwhite` par `bg-background text-foreground` dans `AppShell.tsx` (le seul fichier touché côté shell). Les classes `finance-*` restent disponibles pour `MobileNav` (pas régressé).

### 5. Home — double `min-h-screen`
`AppShell` impose déjà `min-h-screen` au conteneur principal ; `Home.tsx` ajoute un second `min-h-screen` sur sa div racine → la page peut dépasser la hauteur viewport et pousser le footer trop bas (scrollbar parfois inutile).

**Fix** : retirer `min-h-screen` de la div racine de `Home.tsx`. Le layout reste identique visuellement.

### 6. NewsletterBanner — hover qui "tremble"
Le bouton "Je m'inscris" a `hover:scale-105` ; sur un bouton large dans une grille flex avec voisins serrés, on voit un micro-décalage des éléments adjacents au survol.

**Fix** : remplacer `hover:scale-105` par un effet d'ombre/luminosité (`hover:shadow-md hover:bg-primary` ou `hover:brightness-110`) qui ne change pas la box.

### 7. Spinner du bouton newsletter — couleur codée en dur
`border-white` au lieu de `border-primary-foreground` → casse le contraste si jamais le thème évolue.

**Fix** : `border-b-2 border-primary-foreground`.

### 8. Hero — image Unsplash sans `loading="lazy"`/dimension
L'image fond du hero est en `bg-[url(...)]` sans préchargement ; le bloc `aspect-[4/3]` est correct (pas de CLS), mais l'image peut "flasher" au load.

**Fix léger** : ajouter une couche de fond `bg-card` + un très léger gradient qui reste visible avant arrivée de l'image. Aucune nouvelle dépendance.

---

### Fichiers modifiés (6, tous front-end)
- `src/components/NewsletterBanner.tsx` — init state synchronisé + retrait du `scale` + spinner token
- `src/components/SplashScreen.tsx` — `z-[9999]` + `pointer-events-none` après fade
- `src/components/AppShell.tsx` — remplacement classes `finance-*` par tokens sémantiques (1 ligne)
- `src/pages/Home.tsx` — retrait `min-h-screen` racine + fond du bloc image
- `src/index.css` — ajout 2 `@font-face` fallback (Inter Fallback, JetBrains Fallback) + mise à jour `font-family` body/headings
- `src/main.tsx` — *non touché*

### Hors scope (à proposer plus tard si tu veux)
- Migration des rôles `profile.role` → table `user_roles` (sécurité)
- Suppression des fichiers `_deprecated_` et `Exercises` vs `Exercices`
- Lazy loading généralisé des routes secondaires
- Unification i18n complète FR/EN

### Critères d'acceptation
- Aucune régression visuelle : mêmes couleurs, même typographie, mêmes contenus.
- Le bandeau newsletter n'occasionne plus de saut au chargement.
- Plus de FOUT visible (les titres ne "grossissent" plus quand JetBrains Mono arrive).
- Le splash disparaît proprement, sans clignotement de la navbar.
- La home n'a plus de scrollbar parasite due au double `min-h-screen`.
- Les boutons hover ne déplacent plus leurs voisins.
