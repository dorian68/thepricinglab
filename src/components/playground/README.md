
# Notebook Playground

Cette fonctionnalité permet aux utilisateurs de rechercher, visualiser, forker et exécuter des notebooks GitHub traitant de pricing quantitatif, puis de tester la librairie TPL à l'intérieur.

## Structure des composants

- `NotebookList` : Affiche la liste des notebooks trouvés sur GitHub.
- `NotebookViewer` : Visualise le contenu d'un notebook (.ipynb).
- `NotebookRunner` : Lance l'exécution des cellules du notebook avec Pyodide.
- `NotebookFilters` : Filtres pour la recherche de notebooks.
- `NotebookSharing` : Fonctionnalités de partage (URL et GitHub Gist).

## Services

- `notebookService.ts` : API pour rechercher et manipuler des notebooks.

## Hooks

- `useNotebookSearch` : Recherche des notebooks sur GitHub.
- `useNotebook` : Charge et manipule un notebook spécifique.

## Pages

- `/community/playground` : Liste principale et visualisation de notebooks.
- `/community/playground/shared` : Affichage d'un notebook partagé via URL.

## Fonctionnalités techniques

1. **Recherche GitHub** : Utilise l'API GitHub pour chercher des notebooks Python.
2. **Visualisation** : Rendu simplifié des cellules markdown et code.
3. **Exécution** : Utilise Pyodide pour exécuter le code Python dans le navigateur.
4. **Remplacement d'imports** : Remplace automatiquement les imports connus par TPL.
5. **Partage** : Via URL (base64) ou GitHub Gist.

## Points d'amélioration potentiels

- Implémentation d'un rendu complet des notebooks avec nbviewer.js.
- Ajout de la persistance des notebooks modifiés.
- Support des graphiques matplotlib.
- Amélioration du timing des cellules de pricing.
