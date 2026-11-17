# Back-office Rythmo

Application d'administration de Rythmo — React 19 + Vite + Tailwind 4 + TanStack Query, même identité
visuelle que l'application (jetons de couleur, Plus Jakarta Sans, thème clair/sombre). Elle ne fait
aucun calcul : tout vient de l'API (`/api/admin/*`).

```bash
npm run dev          # depuis la racine : tout l'environnement ; back-office sur http://localhost:5174
npm run seed:backoffice   # (facultatif) ~120 comptes de démonstration pour remplir les graphiques
```

Premier lancement : l'API crée un administrateur de test et écrit ses identifiants dans
`apps/api/test/admin-account.local.json` (ignoré par git). En production, définir `ADMIN_EMAIL` et
`ADMIN_PASSWORD` avant le premier démarrage.

## Écrans

| Écran | Droit requis | Contenu |
|---|---|---|
| Tableau de bord | `dashboard:read` | 8 indicateurs (comparés à la période précédente), 4 courbes (inscriptions, utilisateurs actifs, revenus, dépenses), répartition des formules, revenu par offre, catégories, dernières inscriptions, promotions les plus utilisées. Fenêtre 7 / 30 / 90 jours. |
| Utilisateurs | `users:read` | Liste **paginée**, recherche, filtres (formule, statut), tri ; fiche détaillée ; suspendre / réactiver, offrir ou retirer le Premium, gérer l'essai, renommer, supprimer (`users:write`, `users:delete`). |
| Offres et prix | `pricing:read` | Offres Premium (prix, période, devise, mise en vente), durée de l'essai, fonctions réservées au Premium — appliqués **immédiatement** à l'application. |
| Promotions | `promotions:read` | Codes promo : remise en %, remise en montant, jours d'essai offerts ; offres concernées, fenêtre de validité, plafond d'utilisations, pause. |
| Journal d'audit | `audit:read` | Qui a fait quoi, sur quoi, quand. |
| Administrateurs | `admins:manage` | Comptes du back-office et rôles. |

L'état des listes (page, recherche, filtres, tri) est porté par l'adresse : on peut la partager ou
recharger la page sans rien perdre.

## Organisation

```
src/
  lib/          api.ts (client HTTP), auth.tsx (session, droits), hooks.ts, format.ts, toast.tsx
  components/   ui/ (boutons, formulaires, tableau paginé, modales…), charts/ (SVG, sans bibliothèque), layout/
  features/     auth · dashboard · users · pricing · promotions · audit · admins · account
```

Les graphiques sont dessinés en SVG (aucune dépendance) : survol avec infobulle, table masquée pour les
lecteurs d'écran, couleurs doublées de libellés chiffrés.
