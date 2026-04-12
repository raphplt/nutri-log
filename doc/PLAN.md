# NutriLog -- Plan d'implémentation MVP (V1)

> Ce plan couvre l'implémentation complète du MVP tel que défini dans `readme.md`.
> Chaque phase est autonome et exécutable dans un contexte de chat séparé.

---

## Phase 0 : Documentation & APIs validées

### APIs confirmées (sources : docs officielles consultées le 2026-04-08)

**Expo / expo-router**
- `npx create-expo-app@latest --template tabs` pour le scaffolding
- `_layout.tsx` avec `<Stack>` et `<Tabs>` pour la navigation
- `<Redirect href="/onboarding" />` pour le redirect conditionnel
- `presentation: 'modal'` sur `Stack.Screen` pour les modales
- `tsconfig.json` : `"extends": "expo/tsconfig.base"` + `"strict": true`
- Typed routes : `{ "expo": { "experiments": { "typedRoutes": true } } }` dans `app.json`

**Drizzle ORM + expo-sqlite**
- Packages : `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, `babel-plugin-inline-import`
- Schema : `sqliteTable`, `text`, `integer`, `real` depuis `drizzle-orm/sqlite-core`
- Index : 3e argument de `sqliteTable` → callback retournant `[index(...), uniqueIndex(...)]`
- DB init : `const expo = openDatabaseSync("nutrilog.db"); const db = drizzle(expo);`
- Migrations : `drizzle.config.ts` avec `dialect: "sqlite"`, `driver: "expo"` → `npx drizzle-kit generate`
- Apply : `useMigrations(db, migrations)` depuis `drizzle-orm/expo-sqlite/migrator`
- Live queries : `openDatabaseSync("nutrilog.db", { enableChangeListener: true })` + `useLiveQuery`
- Metro config : ajouter `"sql"` à `config.resolver.sourceExts`
- Babel config : plugin `["inline-import", { extensions: [".sql"] }]`

**expo-camera (SDK 52+)**
- `CameraView` avec `onBarcodeScanned` callback (type `BarcodeScanningResult`)
- `barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}`
- `useCameraPermissions()` hook pour les permissions
- Pause scanning : `onBarcodeScanned={scanned ? undefined : handleScan}`

**Open Food Facts API v2**
- Barcode : `GET https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=product_name,brands,nutriments,image_front_small_url`
- Search : `GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={q}&search_simple=1&action=process&json=true&page_size=24&fields=code,product_name,brands,nutriments,image_front_small_url`
- Nutriments : `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`
- Réponse : `{ status: 1, product: { ... } }` (trouvé) / `{ status: 0 }` (pas trouvé)
- User-Agent requis : `NutriLog/1.0 (contact@email.com)`

**react-native-gifted-charts**
- `BarChart`, `LineChart`, `PieChart` depuis `react-native-gifted-charts`
- Data format : `[{ value: number, label?: string, frontColor?: string }]`
- Donut : `<PieChart donut innerRadius={50} centerLabelComponent={() => ...} />`
- Peers : `react-native-svg`, `expo-linear-gradient`

**react-native-reanimated**
- `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`
- Babel plugin : `react-native-reanimated/plugin` (v3) — doit être en DERNIER dans la liste des plugins

**expo-haptics**
- `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` — import `* as Haptics from 'expo-haptics'`

**expo-notifications**
- Trigger daily : `{ type: SchedulableTriggerInputTypes.DAILY, hour, minute }`
- Cancel : `Notifications.cancelAllScheduledNotificationsAsync()`
- Permissions : `Notifications.requestPermissionsAsync()`

### Anti-patterns à éviter

- Ne PAS utiliser `BarCodeScanner` (deprecated) → utiliser `CameraView`
- Ne PAS utiliser `SQLiteProvider` + `useMigrations` ensemble → choisir l'un ou l'autre (on prend `useMigrations`)
- Ne PAS accéder aux nutriments OFF en camelCase → ce sont des clés avec tirets (`energy-kcal_100g`)
- Ne PAS oublier `babel-plugin-inline-import` pour les migrations `.sql`
- Ne PAS mettre le plugin reanimated ailleurs qu'en dernière position dans babel

---

## Phase 1 : Project scaffolding & base technique

### Objectif
Projet Expo fonctionnel avec TypeScript strict, navigation file-based, DB initialisée avec Drizzle, et thème dark mode.

### Tâches

1. **Scaffolding**
   ```bash
   npx create-expo-app@latest nutrilog --template tabs
   cd nutrilog
   ```

2. **Dépendances**
   ```bash
   # Database
   npx expo install expo-sqlite
   npm install drizzle-orm
   npm install -D drizzle-kit babel-plugin-inline-import

   # Camera & scan
   npx expo install expo-camera

   # UI
   npx expo install react-native-reanimated react-native-gesture-handler expo-haptics
   npx expo install react-native-svg expo-linear-gradient
   npm install react-native-gifted-charts

   # Notifications
   npx expo install expo-notifications

   # Utils
   npm install nanoid
   ```

3. **Configuration TypeScript** — `tsconfig.json`
   ```json
   {
     "extends": "expo/tsconfig.base",
     "compilerOptions": {
       "strict": true,
       "paths": { "@/*": ["./*"] }
     },
     "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
   }
   ```

4. **Configuration Babel** — `babel.config.js`
   ```js
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['inline-import', { extensions: ['.sql'] }],
         'react-native-reanimated/plugin', // MUST BE LAST
       ],
     };
   };
   ```

5. **Configuration Metro** — `metro.config.js`
   ```js
   const { getDefaultConfig } = require('expo/metro-config');
   const config = getDefaultConfig(__dirname);
   config.resolver.sourceExts.push('sql');
   module.exports = config;
   ```

6. **Configuration app.json** — ajouter les plugins :
   ```json
   {
     "plugins": [
       ["expo-camera", {
         "cameraPermission": "Permet de scanner les codes-barres des produits alimentaires.",
         "recordAudioAndroid": false
       }],
       "expo-notifications"
     ],
     "experiments": { "typedRoutes": true }
   }
   ```

7. **Thème & design tokens** — créer `constants/theme.ts`
   - Colors dark mode (background `#0A0A0F`, surface `#16161F`, primary `#6366F1`, etc.)
   - Spacing, border radius, typography scale
   - Exporter un objet `theme` unique

8. **Structure de navigation** — réorganiser `app/` selon le plan du readme :
   ```
   app/
   ├── _layout.tsx              # Root Stack (tabs + modales)
   ├── (tabs)/
   │   ├── _layout.tsx          # Tab bar (dashboard, settings)
   │   ├── index.tsx            # Dashboard
   │   └── settings.tsx         # Settings
   ├── add/                     # Stack group pour ajout
   ├── meal/[id].tsx
   ├── weight/index.tsx
   ├── profile/index.tsx
   └── onboarding/              # 6 écrans
   ```

9. **Redirect onboarding** — dans `app/(tabs)/index.tsx` :
   - Vérifier si `userProfile` existe en DB
   - Si non → `<Redirect href="/onboarding" />`

### Vérification
- [ ] `npx expo start` démarre sans erreur
- [ ] Navigation entre les tabs fonctionne
- [ ] TypeScript strict pass (`npx tsc --noEmit`)
- [ ] Le redirect onboarding se déclenche (profil inexistant)

---

## Phase 2 : Schéma DB & migrations Drizzle

### Objectif
Schéma complet en place avec migrations, DB initialisée au boot.

### Tâches

1. **Schéma** — créer `db/schema.ts`
   - Tables : `foods`, `meals`, `mealItems`, `userProfile`, `weightLog`, `userGoals`, `reminderSettings`
   - Copier le schéma exact du readme (section 3.1)
   - Ajouter les index dans le 3e argument de chaque `sqliteTable` :
     - `foods` : `index` sur `barcode`, `index` sur `use_count DESC`
     - `meals` : `index` sur `date`
     - `mealItems` : `index` sur `meal_id`
     - `weightLog` : `uniqueIndex` sur `date`

2. **Drizzle config** — créer `drizzle.config.ts`
   ```ts
   import { defineConfig } from 'drizzle-kit';
   export default defineConfig({
     dialect: 'sqlite',
     driver: 'expo',
     schema: './db/schema.ts',
     out: './drizzle',
   });
   ```

3. **Générer les migrations**
   ```bash
   npx drizzle-kit generate
   ```

4. **DB provider** — créer `db/client.ts`
   ```ts
   import { openDatabaseSync } from 'expo-sqlite';
   import { drizzle } from 'drizzle-orm/expo-sqlite';

   const expo = openDatabaseSync('nutrilog.db', { enableChangeListener: true });
   export const db = drizzle(expo);
   ```

5. **Migrations au boot** — dans `app/_layout.tsx` :
   - Importer `useMigrations` et `migrations`
   - Afficher un splash/loading pendant la migration
   - Une fois `success === true`, rendre les children

6. **Helper nanoid** — créer `lib/nanoid.ts`
   - Générer des IDs compacts pour les primary keys

### Vérification
- [ ] `npx drizzle-kit generate` produit des fichiers SQL dans `./drizzle/`
- [ ] L'app démarre et les migrations s'appliquent (pas d'erreur)
- [ ] Les tables existent (vérifiable via Drizzle Studio ou un `SELECT` de test)

---

## Phase 3 : Onboarding (6 écrans)

### Objectif
Flow complet d'onboarding qui collecte les données utilisateur et calcule les objectifs caloriques.

### Tâches

1. **Layout onboarding** — `app/onboarding/_layout.tsx`
   - Stack sans header, avec animation de transition
   - Progress bar partagée (composant custom basé sur l'index de l'écran)

2. **State management onboarding** — créer `lib/onboarding-store.ts`
   - React Context ou simple state lifting avec `useState` dans le layout
   - Stocker les données collectées à chaque étape
   - Type : `OnboardingData { goal, goalRate, sex, birthDate, heightCm, weightKg, activityLevel, trainingDaysPerWeek, macroPreset, kcalTarget, reminderSettings }`

3. **Écran 1 : Objectif** — `app/onboarding/goal.tsx`
   - 3 cards sélectionnables (lose / maintain / gain)
   - Si lose/gain → sous-sélection du rythme en kg/sem
   - Bouton "Suivant" → navigate vers `body`

4. **Écran 2 : Infos physiques** — `app/onboarding/body.tsx`
   - Toggle sexe (Homme/Femme)
   - Date picker pour date de naissance
   - Input taille (cm)
   - Input poids (kg)

5. **Écran 3 : Activité** — `app/onboarding/activity.tsx`
   - 5 cards avec multiplicateur et description
   - Sélection unique

6. **Écran 4 : Training** — `app/onboarding/training.tsx`
   - Stepper 0-7 jours

7. **Écran 5 : Récap & objectifs** — `app/onboarding/summary.tsx`
   - Implémenter les fonctions de calcul dans `lib/tdee.ts` :
     - `calculateBMR(sex, weightKg, heightCm, age)` — Mifflin-St Jeor
     - `calculateTDEE(bmr, activityLevel)` — BMR × multiplicateur
     - `calculateTargetKcal(tdee, goalRateKgPerWeek)` — TDEE + (rate × 1100)
     - `macrosFromPercentages(kcalTarget, pPct, cPct, fPct)` — grammes P/G/L
   - Afficher BMR, TDEE, objectif kcal
   - 4 presets macros sélectionnables (balanced, high protein, low carb, custom)
   - Bouton "Ajuster" pour override kcal
   - Afficher les grammes P/G/L calculés

8. **Écran 6 : Rappels** — `app/onboarding/reminders.tsx`
   - 4 toggles avec heure configurable (petit-déj 8h, déjeuner 12h30, goûter 16h, dîner 20h)
   - Demande de permission notification au tap "Activer"
   - Option "Pas maintenant"

9. **Finalisation** — au tap "Terminer" sur l'écran 6 :
   - INSERT `userProfile`
   - INSERT `weightLog` (premier point avec le poids saisi)
   - INSERT `userGoals` (calculé)
   - INSERT `reminderSettings`
   - Schedule les notifications locales
   - `router.replace('/(tabs)')` → dashboard

### Composants UI à créer
- `components/SelectCard.tsx` — card sélectionnable avec titre + description
- `components/ProgressBar.tsx` — barre de progression onboarding
- `components/NumericInput.tsx` — input numérique stylisé
- `components/StepperInput.tsx` — stepper +/- pour les jours

### Vérification
- [ ] Le flow complet fonctionne de bout en bout
- [ ] Les données sont correctement insérées en DB
- [ ] Le calcul TDEE produit des résultats cohérents (test : homme 80kg 180cm 30ans modéré → BMR ~1759, TDEE ~2727)
- [ ] Après onboarding, le dashboard s'affiche (plus de redirect)
- [ ] Le retour arrière fonctionne sur chaque écran

---

## Phase 4 : Dashboard quotidien

### Objectif
Écran principal affichant les calories restantes, les macros, et la timeline des repas du jour.

### Tâches

1. **Hooks de données** — créer `hooks/useDailyTotals.ts`
   - Query : `SUM(kcal, protein, carbs, fat)` sur `mealItems` JOIN `meals` WHERE `date = today`
   - Utiliser `useLiveQuery` pour la réactivité
   - Retourner `{ totalKcal, totalProtein, totalCarbs, totalFat, remaining, meals }`

2. **Hook objectifs** — créer `hooks/useGoals.ts`
   - Query `userGoals` pour les targets
   - Retourner `{ kcalTarget, proteinTargetG, carbsTargetG, fatTargetG }`

3. **Remaining kcal** — composant central
   - Gros chiffre : `kcalTarget - totalKcal`
   - Couleur dynamique : vert si > 0, rouge si dépassé

4. **Macro rings** — composant `components/MacroRings.tsx`
   - 3 anneaux de progression (P, G, L) avec `PieChart` donut de gifted-charts
   - Ou custom avec `react-native-svg` Circle + animation reanimated
   - Afficher grammes consommés / target sous chaque ring

5. **Timeline repas** — composant `components/MealTimeline.tsx`
   - Liste des meals du jour groupés par `mealType`
   - Chaque meal : header (type + total kcal) + liste items (expandable)
   - Chaque item : nom, quantité, kcal
   - Swipe-to-delete optionnel (V2, mais préparer la structure)

6. **FAB "+"** — bouton flottant en bas à droite
   - Au tap → ouvre le bottom sheet des 4 modes d'ajout
   - Haptic feedback light au tap

7. **Mini graphe poids** — sparkline des 30 derniers jours
   - `LineChart` compact (hauteur ~60px)
   - Données de `weightLog` ORDER BY date DESC LIMIT 30

8. **Date navigation** — sélecteur de date en haut du dashboard
   - Swipe gauche/droite ou flèches pour changer de jour
   - Afficher "Aujourd'hui" / "Hier" / date formatée

### Vérification
- [ ] Le dashboard affiche 0/target quand aucun repas n'est loggé
- [ ] Les données se mettent à jour en temps réel après ajout d'un repas (live query)
- [ ] Le FAB ouvre le bottom sheet
- [ ] La navigation par date fonctionne

---

## Phase 5 : Les 4 modes d'ajout

### Objectif
Implémenter les 4 flows d'ajout de repas : scan, recherche, quick add, récents.

### Tâches

1. **Bottom sheet d'ajout** — `app/add/index.tsx`
   - 4 boutons : Scanner, Rechercher, Quick Add, (Récents en carrousel en haut)
   - Sélecteur de `mealType` (breakfast/lunch/dinner/snack) — pré-sélectionné selon l'heure

2. **Service OFF** — créer `lib/off-api.ts`
   - `fetchProductByBarcode(barcode: string): Promise<Food | null>`
   - `searchProducts(query: string, page?: number): Promise<Food[]>`
   - Parser les réponses OFF → format `Food` interne
   - Gérer les cas où les nutriments sont manquants (null safety)
   - User-Agent header : `NutriLog/1.0`

3. **Service food** — créer `lib/food-service.ts`
   - `getOrFetchByBarcode(barcode)` : lookup local → si absent, fetch OFF → insert → return
   - `searchFoods(query)` : local (triés par `useCount` DESC) + OFF en fallback
   - `incrementUseCount(foodId)`

4. **Mode Scan** — `app/add/scan.tsx`
   - `CameraView` avec `onBarcodeScanned`
   - Pause scanning après premier scan (state `scanned`)
   - Haptic light au scan
   - Lookup via `getOrFetchByBarcode`
   - Si trouvé → navigate vers `confirm` avec les données food
   - Si non trouvé (OFF status 0) → afficher message + proposer Quick Add

5. **Mode Recherche** — `app/add/search.tsx`
   - Input texte avec debounce 300ms
   - Résultats hybrides : local d'abord (par `useCount`), puis OFF
   - AbortController sur chaque nouvelle frappe
   - Tap sur un résultat → navigate vers `confirm`

6. **Mode Quick Add** — `app/add/quick.tsx`
   - 4 champs : kcal, protéines (g), glucides (g), lipides (g)
   - Nom optionnel
   - Validation : kcal requis, le reste optionnel (default 0)
   - Au submit → INSERT direct dans `mealItems` (sans `foodId`)

7. **Écran de confirmation** — `app/add/confirm.tsx`
   - Reçoit les données food via params ou state
   - Affiche : nom, image (si dispo), macros pour 100g
   - Slider quantité (default : `defaultServingG` ou 100g)
   - Macros recalculées en temps réel : `(value_per_100g × quantityG) / 100`
   - Sélecteur `mealType` si pas déjà choisi
   - Bouton "Ajouter" → INSERT meal (si besoin) + INSERT mealItem + UPDATE useCount
   - Haptic success + retour dashboard

8. **Récents / Favoris** — carrousel horizontal dans le bottom sheet
   - Query `foods` ORDER BY `useCount` DESC LIMIT 10
   - Tap = ajout direct avec la dernière quantité utilisée
   - Haptic light

### Vérification
- [ ] Scan : un produit connu (ex: Nutella 3017620422003) affiche les bonnes macros
- [ ] Recherche : taper "pâtes" retourne des résultats OFF
- [ ] Quick Add : ajouter 500 kcal apparaît dans le dashboard
- [ ] Récents : après 2-3 ajouts, le carrousel se peuple
- [ ] Les macros du dashboard se mettent à jour après chaque ajout
- [ ] Le cache fonctionne : un 2e scan du même produit n'appelle pas l'API

---

## Phase 6 : Suivi du poids & rappels

### Objectif
Écran de pesée, mini-graphe poids, et notifications locales fonctionnelles.

### Tâches

1. **Écran pesée** — `app/weight/index.tsx`
   - Input poids (kg) + sélecteur date (défaut : aujourd'hui)
   - UPSERT sur la date (un seul enregistrement par jour) :
     ```ts
     db.insert(weightLog).values({ ... }).onConflictDoUpdate({
       target: weightLog.date,
       set: { weightKg, createdAt }
     })
     ```
   - Historique : liste des 30 dernières pesées
   - Mini graphe `LineChart` courbe

2. **Prompt recalcul** — dans le dashboard :
   - Comparer le poids le plus récent au poids utilisé pour le calcul TDEE
   - Si delta ≥ 2kg → afficher un banner discret : "Ton poids a changé de X kg. Recalculer tes objectifs ?"
   - Au tap → recalculer BMR/TDEE/targets et UPDATE `userGoals`

3. **Service rappels** — créer `lib/reminders.ts`
   - `scheduleAllReminders(settings: ReminderSetting[])` :
     - Cancel all → re-schedule les enabled
     - Trigger type : `SchedulableTriggerInputTypes.DAILY`
   - `requestNotificationPermissions()` : wrapper autour de `requestPermissionsAsync`

4. **Settings rappels** — dans `app/(tabs)/settings.tsx`
   - Section rappels : 4 toggles + time pickers
   - Au changement → UPDATE `reminderSettings` + re-schedule

5. **Settings profil** — lien vers `app/profile/index.tsx`
   - Réutiliser les composants d'onboarding pour édition
   - Au save → UPDATE `userProfile` + recalcul `userGoals`

6. **Notification récap** — notification quotidienne à 21h30
   - Vérifier si le total du jour < 80% de l'objectif
   - (Note : la logique de contenu dynamique n'est pas possible avec des notifications locales planifiées. Alternative : planifier la notif systématiquement avec un message générique "As-tu loggé tous tes repas aujourd'hui ?")

### Vérification
- [ ] Ajouter une pesée → apparaît dans l'historique et le mini-graphe
- [ ] UPSERT : modifier le poids du jour remplace la valeur, pas de doublon
- [ ] Les rappels se déclenchent aux heures configurées (tester avec une heure proche)
- [ ] Désactiver un rappel → il ne se déclenche plus
- [ ] Modifier le profil recalcule les objectifs

---

## Phase 7 : Polish & finalisation MVP

### Objectif
Peaufiner l'UX, gérer les edge cases, et préparer la release.

### Tâches

1. **Animations**
   - Transition fluide entre les écrans d'onboarding
   - Animation d'apparition des macro rings au chargement du dashboard
   - Animation du compteur "remaining kcal" avec `withTiming`
   - Haptic feedback cohérent sur toutes les interactions

2. **Edge cases**
   - Pas de connexion réseau → message gracieux sur scan/recherche, app reste fonctionnelle
   - Produit OFF sans nutriments complets → afficher "données incomplètes" + permettre l'édition manuelle
   - Division par zéro si target = 0
   - Date de naissance invalide / âge < 10 ans ou > 120 ans

3. **Performance**
   - Activer WAL mode sur SQLite : `db.run(sql'PRAGMA journal_mode=WAL')`
   - FlashList pour les longues listes (historique repas, résultats recherche)
   - Debounce 300ms sur la recherche + AbortController

4. **Splash screen**
   - Garder le splash Expo pendant la migration DB
   - `SplashScreen.preventAutoHideAsync()` → hide après migration success

5. **App icon & metadata**
   - Configurer `app.json` : name, slug, version, icon, splash, iOS/Android config

6. **Test manuel end-to-end**
   - Onboarding complet → dashboard → scan → recherche → quick add → pesée → settings
   - Vérifier la cohérence des données à chaque étape

### Vérification finale
- [ ] L'app fonctionne 100% offline après le premier lancement
- [ ] Pas de crash sur aucun flow
- [ ] Les calculs TDEE sont corrects
- [ ] Les données persistent entre les relances de l'app
- [ ] Le thème dark est cohérent sur tous les écrans
- [ ] Les haptics se déclenchent correctement
- [ ] TypeScript : 0 erreurs (`npx tsc --noEmit`)

---

## Ordre d'exécution recommandé

```
Phase 1 (scaffolding)     ████░░░░░░  ~2h
Phase 2 (DB + migrations) ███░░░░░░░  ~1.5h
Phase 3 (onboarding)      ██████░░░░  ~4h
Phase 4 (dashboard)       █████░░░░░  ~3h
Phase 5 (4 modes ajout)   ████████░░  ~5h
Phase 6 (poids + rappels) ████░░░░░░  ~2.5h
Phase 7 (polish)          ████░░░░░░  ~2h
```

Phases 1-2 sont des prérequis pour tout le reste.
Phases 3, 4, 5 peuvent être partiellement parallélisées (3 d'abord car le dashboard a besoin de données).
Phase 6 est indépendante après la phase 2.
Phase 7 est la dernière.
