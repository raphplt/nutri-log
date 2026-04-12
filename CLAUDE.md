# NutriLog

App Expo / React Native de tracking calorique, local-first, zero pub. Voir `readme.md` pour le contexte produit et `DESIGN..md` / `PLAN.md` pour la vision UI et le plan d'implémentation.

## Stack

- **Expo SDK 54** (managed) + **expo-router** (file-based, dossier `app/`)
- **TypeScript strict** — paths `@/*` mappés sur la racine
- **expo-sqlite** + **Drizzle ORM** (`db/schema.ts`, migrations dans `drizzle/`)
- **Biome** pour lint + format (tabs, double quotes, organize imports)
- **react-native-gifted-charts** pour la dataviz
- **Open Food Facts API v2** pour le scan produits (`lib/off-api.ts`)

## Structure

- `app/` — routes expo-router (`(tabs)/`, `onboarding/`, `meal/`, `add/`, `weight/`, `profile/`)
- `components/` — composants partagés
- `db/` — `schema.ts` Drizzle + `client.ts`
- `drizzle/` — migrations générées (ne pas éditer à la main)
- `lib/` — services métier (`food-service`, `meal-service`, `tdee`, `off-api`, etc.)
- `constants/theme.ts` — tokens design
- `hooks/` — hooks custom

## Commandes

```bash
npm start              # Expo dev server (dev-client Android prioritaire)
npm run android        # Lance sur device/émulateur Android
npm run tsc            # Typecheck (à lancer après toute modif TS)
npm run db:generate    # Génère une migration Drizzle depuis db/schema.ts
npx biome check --write .    # Lint + format + organize imports
```

Après toute modif TS : lancer `npm run tsc`.
Après toute modif de `db/schema.ts` : lancer `npm run db:generate` et committer la migration générée.
Avant de conclure une tâche : lancer `npx biome check --write` sur les fichiers touchés.

## Conventions de code

- **Pas de `any`** — jamais. Utiliser `unknown` + narrowing, ou typer correctement.
- **Imports absolus** via `@/` (ex: `import { theme } from "@/constants/theme"`). Pas de `../../..`.
- **Pas de commentaires** sauf si le *pourquoi* est non-évident (contrainte cachée, workaround). Ne jamais commenter le *quoi*.
- **Tabs** pour l'indentation, **double quotes** en JS/TS (géré par Biome).
- Composants React en `.tsx`, services/utils en `.ts`.
- Pas de sur-ingénierie : pas d'abstraction spéculative, pas d'error handling défensif pour des cas impossibles, pas de backwards-compat inutile.
- Respecter les bonnes pratiques React Native : `StyleSheet.create`, pas de styles inline lourds, `memo` / `useCallback` là où ça compte réellement (listes, renders fréquents).

## i18n

- Tous les textes UI doivent passer par l'i18n — **FR + EN** uniquement pour l'instant.
- FR reste la langue par défaut.
- Ne jamais hardcoder de string UI en dur dans un composant.

## Base de données

- Le schéma vit dans `db/schema.ts`. Toute modification → `npm run db:generate`.
- Les migrations dans `drizzle/` sont générées, jamais éditées manuellement.
- Produits fetchés depuis OFF sont cachés dans la table `foods` (`source = 'off'`, barcode indexé). Pas de refetch si déjà en base.

## Plateforme

- **Android + dev-client** est la cible prioritaire de dev. iOS secondaire.
- Pas besoin de vérifier le web/Expo Go.

## Tests

- **Ne pas ajouter de tests** sur le projet, sauf demande explicite.
- Le dossier `components/__tests__` existant est legacy.

## Communication

- Réponses et messages de commit en **français**.
- Direct, concis, pas de résumés verbeux en fin de réponse.
