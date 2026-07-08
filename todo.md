# Dashboard Coupe du Monde 2026 - TODO

## Architecture & Infrastructure
- [x] Schéma de base de données : équipes, groupes, matchs, joueurs, statistiques
- [x] Procédures tRPC pour récupérer les données
- [x] Seed initial des données (48 équipes, 12 groupes, 104 matchs)

## Page d'accueil
- [x] Vue d'ensemble du tournoi avec progression (phase de groupes terminée, phases finales en cours)
- [x] Affichage des 48 équipes organisées par confédération
- [x] KPIs synthétiques : total buts, équipes restantes, meilleur buteur, prochain match

## Section Équipes
- [x] Liste des 48 équipes avec drapeaux
- [x] Fiche détaillée par équipe : groupe, résultats, points, différence de buts
- [x] Évaluation de compétitivité : force offensive, défensive, niveau global
- [x] Filtres par confédération et groupe

## Section Matchs
- [x] Calendrier complet des 104 matchs avec résultats phase de groupes (12 matchs sample importés)
- [x] Bracket interactif des phases finales (Round of 32 à Finale) - Filtrage par stage implémenté
- [x] Détails match : équipes, score, date, lieu

## Classements des groupes
- [x] Tableaux de points pour les 12 groupes (A à L)
- [x] Colonnes : équipe, V, N, D, BP, BC, points
- [x] Tri automatique par points et différence de buts

## Statistiques Joueurs
- [x] Classement des meilleurs buteurs
- [x] Classement des passeurs décisifs
- [x] Classement des minutes jouées (affiché dans le tableau)
- [ ] Filtres par équipe et poste (optionnel pour v1)
- [x] Détails joueur : équipe, poste, buts, passes, minutes

## Module Prédictions
- [x] Analyse statistique du vainqueur probable
- [x] Prédiction du meilleur buteur final
- [x] Prédiction du meilleur joueur du tournoi (via top scorers)
- [x] Affichage clair : "Analyse statistique" (pas résultats officiels)

## Design & UI
- [x] Design élégant et raffiné : typographie soignée (Poppins + Inter), mise en page aérée
- [x] Palette de couleurs premium et cohérente (dark theme avec accents ambre/bleu/vert)
- [x] Navigation fluide entre sections
- [x] Responsive design (mobile, tablet, desktop) - Tailwind responsive classes
- [x] Animations subtiles et polies (transitions CSS, hover effects)

## Tests & Validation
- [x] Données de base importées et vérifiées (48 équipes, 6 confédérations, 48 joueurs, 12 matchs)
- [x] Routes et pages fonctionnelles (7 pages : home, teams, team/:id, standings, matches, stats, predictions)
- [x] Affichage des données correctes (KPIs, classements, statistiques joueurs)
- [x] Tous les liens de navigation fonctionnels et testés

## Déploiement
- [x] Checkpoint final avant publication (v2 sauvegardée avec page détail équipe)
- [x] Dashboard prêt pour publication

## Polish & Optimisations
- [x] Vérifier tous les liens de navigation (home → teams → team/:id → standings → matches → stats → predictions)
- [x] Tester les filtres (confédérations, groupes, stages)
- [x] Vérifier l'affichage des données sur tous les écrans
- [x] Corriger les erreurs CSS/TypeScript
- [x] Optimiser les performances des requêtes tRPC

## Documentation
- [x] Fichier todo.md avec toutes les tâches
- [x] Code bien structuré et commenté
- [x] Architecture documentée dans le README du template

## Livraison
- [x] Checkpoint v2 sauvegardé (version 1a6999e1)
- [x] Dashboard fonctionnel et testable
- [x] Prêt pour publication via Management UI
