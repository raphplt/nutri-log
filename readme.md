# NutriLog -- Calorie Tracker App

> Side project personnel. Alternative à MyFitnessPal, pensée pour le speed de logging et la richesse des stats.
> Local-first, zero pub, zero limitation.

---

## 1. Problème à résoudre

MyFitnessPal et les apps similaires souffrent de trois frictions majeures :

1. **Logging trop lent** -- trop d'étapes pour ajouter un repas, UI surchargée.
2. **Monétisation agressive** -- pubs, paywall sur les macros, dark patterns.
3. **Stats pauvres** -- le dashboard se limite au jour en cours, pas de tendances, pas de moyennes glissantes.

L'objectif est une app où **ajouter un repas prend moins de 15 secondes**, avec des statistiques dignes d'un tableau de bord analytique, le tout 100% local sur le device.

---

## 2. Stack technique

### 2.1 Framework & runtime

| Couche | Choix | Justification |
|---|---|---|
| Framework | **Expo (managed workflow)** | CNG, OTA updates, écosystème riche |
| Navigation | **expo-router** (file-based) | Convention over configuration, deep links natifs |
| Langage | **TypeScript** (strict) | Cohérence avec le reste de la stack perso |

### 2.2 Base de données locale

| Couche | Choix | Justification |
|---|---|---|
| Engine | **expo-sqlite** | Maintenu par Expo, zero config dans managed workflow, support SQLCipher, Suspense-ready via `SQLiteProvider` |
| ORM | **Drizzle ORM** (`drizzle-orm/expo-sqlite`) | Type-safe queries, migrations déclaratives, Drizzle Studio via dev tools plugin pour debug, zéro overhead runtime |
| Migrations | **Drizzle Kit** | Génération SQL depuis le schéma TS, hook `useMigrations` pour apply au boot |

**Pourquoi pas WatermelonDB ?** Le projet a des issues de compatibilité non résolues avec React Native 0.76+ (JSI adapter cassé). Les issues GitHub s'accumulent sans réponse du mainteneur. `expo-sqlite` + Drizzle est le combo recommandé par Expo eux-mêmes et offre le même résultat (lazy loading, réactivité via `enableChangeListener`) sans dette technique.

### 2.3 Scan code-barres

| Couche | Choix | Justification |
|---|---|---|
| Camera + scan | **expo-camera** (`CameraView` + `onBarcodeScanned`) | Intégré nativement depuis SDK 52, remplace `expo-barcode-scanner` (deprecated/removed). Supporte EAN-13, EAN-8, UPC-A, UPC-E, Code 128. Utilise `DataScannerViewController` sur iOS 16+ et Google Code Scanner sur Android. |

**Config app.json :**

```json
{
  "plugins": [
    ["expo-camera", {
      "cameraPermission": "Permet de scanner les codes-barres des produits alimentaires.",
      "barcodeScannerEnabled": true,
      "recordAudioAndroid": false
    }]
  ]
}
```

### 2.4 API nutritionnelle

| Source | Usage | Endpoint |
|---|---|---|
| **Open Food Facts** (API v2) | Scan code-barres + recherche texte | `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=product_name,nutriments,nutrition_grades,image_front_small_url` |
| **Base locale custom** | Plats maison, recettes perso | Table `foods` dans SQLite |
| **Quick add** | Saisie manuelle kcal/P/G/L | Pas d'API, insertion directe |

**Stratégie de cache :** tout produit fetché depuis OFF est inséré dans la table `foods` avec `source = 'off'` et le barcode. Un produit déjà en base ne refait jamais de requête réseau. Le champ `use_count` est incrémenté à chaque utilisation pour le ranking de recherche.

**User-Agent requis par OFF :**

```
NutriLog/1.0 (contact@email.com)
```

### 2.5 Charts & data viz

| Choix | Justification |
|---|---|
| **react-native-gifted-charts** | Le plus complet out-of-the-box pour RN : bar, line, area, pie, donut. Rendu beau par défaut, compatible Expo, activement maintenu (dernière release mars 2026). Dépendances : `react-native-svg` + `expo-linear-gradient`. |

Pas besoin de Victory Native (overkill, nécessite Skia + Reanimated + Gesture Handler en deps) ni de Skia (trop bas niveau pour ce use case).

### 2.6 Animations & UX

| Lib | Usage |
|---|---|
| **react-native-reanimated** | Animations fluides (transitions d'écran, swipe-to-delete, progress rings) |
| **expo-haptics** | Feedback haptique sur les actions clés (ajout repas, validation scan, suppression) |
| **expo-notifications** | Rappels locaux pluri-journaliers |

### 2.7 Résumé des dépendances

```
# Core
expo
expo-router
typescript

# Database
expo-sqlite
drizzle-orm
drizzle-kit

# Camera & scan
expo-camera

# UI & animations
react-native-reanimated
react-native-gesture-handler
expo-haptics
nativewind (ou StyleSheet classique)

# Charts
react-native-gifted-charts
react-native-svg
expo-linear-gradient

# Notifications
expo-notifications

# HTTP (pour OFF API)
ky (ou fetch natif)
```

---

## 3. Architecture de données

### 3.1 Schéma Drizzle

```typescript
// db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const foods = sqliteTable('foods', {
  id: text('id').primaryKey(), // nanoid
  source: text('source').notNull(), // 'off' | 'manual' | 'barcode'
  barcode: text('barcode'),
  name: text('name').notNull(),
  brand: text('brand'),
  imageUrl: text('image_url'),
  kcalPer100g: real('kcal_per_100g').notNull(),
  proteinPer100g: real('protein_per_100g').notNull(),
  carbsPer100g: real('carbs_per_100g').notNull(),
  fatPer100g: real('fat_per_100g').notNull(),
  fiberPer100g: real('fiber_per_100g'),
  defaultServingG: real('default_serving_g').default(100),
  useCount: integer('use_count').default(0),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').notNull(),
});

export const meals = sqliteTable('meals', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  mealType: text('meal_type').notNull(), // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  createdAt: text('created_at').notNull(),
});

export const mealItems = sqliteTable('meal_items', {
  id: text('id').primaryKey(),
  mealId: text('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  foodId: text('food_id').references(() => foods.id),
  name: text('name').notNull(), // dénormalisé pour quick add sans food
  quantityG: real('quantity_g').notNull(),
  kcal: real('kcal').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fat: real('fat').notNull(),
  fiber: real('fiber'),
  createdAt: text('created_at').notNull(),
});

export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey(), // toujours 'default' (un seul profil)
  sex: text('sex').notNull(), // 'male' | 'female'
  birthDate: text('birth_date').notNull(), // YYYY-MM-DD
  heightCm: real('height_cm').notNull(),
  activityLevel: text('activity_level').notNull(), // 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  trainingDaysPerWeek: integer('training_days_per_week').notNull().default(0), // 0-7
  goal: text('goal').notNull(), // 'lose' | 'maintain' | 'gain'
  goalRate: real('goal_rate').default(0), // kg/semaine : -1, -0.75, -0.5, -0.25, 0, +0.25, +0.5
  updatedAt: text('updated_at').notNull(),
});

export const weightLog = sqliteTable('weight_log', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  weightKg: real('weight_kg').notNull(),
  createdAt: text('created_at').notNull(),
});

export const userGoals = sqliteTable('user_goals', {
  id: text('id').primaryKey(),
  kcalTarget: integer('kcal_target').notNull(),
  proteinTargetG: integer('protein_target_g'),
  carbsTargetG: integer('carbs_target_g'),
  fatTargetG: integer('fat_target_g'),
  macroPreset: text('macro_preset').notNull().default('balanced'), // 'balanced' | 'high_protein' | 'low_carb' | 'custom'
  updatedAt: text('updated_at').notNull(),
});

export const reminderSettings = sqliteTable('reminder_settings', {
  id: text('id').primaryKey(),
  mealType: text('meal_type').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  hour: integer('hour').notNull(),
  minute: integer('minute').notNull(),
});
```

### 3.2 Index recommandés

```sql
CREATE INDEX idx_foods_barcode ON foods(barcode);
CREATE INDEX idx_foods_use_count ON foods(use_count DESC);
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);
CREATE UNIQUE INDEX idx_weight_log_date ON weight_log(date);
```

### 3.3 Requêtes clés

**Totaux du jour :**

```typescript
const dailyTotals = await db
  .select({
    totalKcal: sql<number>`SUM(${mealItems.kcal})`,
    totalProtein: sql<number>`SUM(${mealItems.protein})`,
    totalCarbs: sql<number>`SUM(${mealItems.carbs})`,
    totalFat: sql<number>`SUM(${mealItems.fat})`,
  })
  .from(mealItems)
  .innerJoin(meals, eq(mealItems.mealId, meals.id))
  .where(eq(meals.date, '2026-04-08'));
```

**Moyenne glissante 7 jours :**

```typescript
const weeklyAvg = await db
  .select({
    avgKcal: sql<number>`AVG(daily_kcal)`,
  })
  .from(
    db
      .select({
        daily_kcal: sql<number>`SUM(${mealItems.kcal})`.as('daily_kcal'),
      })
      .from(mealItems)
      .innerJoin(meals, eq(mealItems.mealId, meals.id))
      .where(gte(meals.date, '2026-04-01'))
      .groupBy(meals.date)
      .as('daily')
  );
```

**Top 10 aliments récents (pour le carrousel) :**

```typescript
const frequentFoods = await db
  .select()
  .from(foods)
  .orderBy(desc(foods.useCount))
  .limit(10);
```

---

## 4. Fonctionnalités

### 4.1 V1 -- MVP quotidien

#### 4.1.1 Les 4 modes d'ajout

| Mode | Flow | Temps cible |
|---|---|---|
| **Scan** | Caméra → barcode → OFF API → affiche macros → slider quantité → valider | < 10s |
| **Recherche** | 2-3 lettres → résultats hybrides (custom foods triés par `use_count` DESC en priorité, puis OFF en fallback) → tap → slider quantité → valider | < 15s |
| **Quick Add** | Tap → champs kcal / P / G / L → nom optionnel → valider | < 10s |
| **Récents / favoris** | Carrousel horizontal en haut de l'écran de logging → tap = ajouté avec la dernière quantité utilisée | < 5s |

#### 4.1.2 Dashboard quotidien

- **Remaining kcal** en gros au centre (kcal target - kcal consommées)
- **Macro rings** animés : protéines, glucides, lipides (progress circulaire)
- **Timeline repas** : liste des meals du jour avec total par meal, expandable pour voir les items
- **Bouton "+" flottant** pour ajouter (ouvre un bottom sheet avec les 4 modes)

#### 4.1.3 Rappels locaux

- `expo-notifications` en mode local
- Configurables par `meal_type` :
  - Petit-déjeuner : 8h00
  - Déjeuner : 12h30
  - Goûter : 16h00
  - Dîner : 20h00
- Notification de récap le soir (21h30) : "Il te reste X kcal à logger aujourd'hui" si le total est < 80% de l'objectif
- Toutes les heures et l'activation par créneau sont modifiables dans les settings

#### 4.1.4 Onboarding (style MFP)

Flow en 6 étapes, une info par écran pour garder le rythme. Progress bar en haut. Bouton "Retour" sur chaque écran. Pas de skip possible (toutes les infos sont nécessaires au calcul).

**Écran 1 -- Objectif**
- Question : "Quel est ton objectif ?"
- 3 choix illustrés (cards) : Perdre du poids | Maintenir | Prendre du poids
- Si lose/gain → sous-question : rythme par semaine
  - Perte : -0.25 / -0.5 / -0.75 / -1.0 kg/sem (avec label "lent" → "agressif")
  - Prise : +0.25 / +0.5 kg/sem (avec label "lean bulk" → "bulk")

**Écran 2 -- Infos physiques**
- Sexe : toggle Homme / Femme
- Date de naissance : date picker (calcul de l'âge automatique)
- Taille : slider ou input numérique (cm)
- Poids actuel : input numérique (kg) → sert aussi de premier point dans `weight_log`

**Écran 3 -- Niveau d'activité**
- Question : "Comment décrirais-tu ton quotidien ?"
- 5 niveaux en cards avec description concrète :
  - **Sédentaire** (x1.2) -- Bureau, peu de marche
  - **Légèrement actif** (x1.375) -- Marche quotidienne ou debout au travail
  - **Modérément actif** (x1.55) -- Actif au quotidien, un peu de sport
  - **Actif** (x1.725) -- Travail physique ou sport régulier
  - **Très actif** (x1.9) -- Travail très physique + sport intense

**Écran 4 -- Jours d'entraînement**
- Question : "Combien de jours par semaine tu t'entraînes ?"
- Selector 0-7 (style stepper ou row de boutons)
- Note : ce champ est informatif pour V1, servira en V2 pour différencier objectifs jour training vs jour rest

**Écran 5 -- Récap & objectifs calculés**
- Résumé du profil (sexe, âge, taille, poids, activité, objectif)
- **Calcul affiché :**
  - BMR (Mifflin-St Jeor) :
    - Homme : `10 × poids(kg) + 6.25 × taille(cm) - 5 × âge - 161 + 166`
    - Femme : `10 × poids(kg) + 6.25 × taille(cm) - 5 × âge - 161`
  - TDEE : `BMR × activity_multiplier`
  - Objectif kcal : `TDEE + (goal_rate × 1100)` (1 kg graisse ≈ 7700 kcal → 7700/7 ≈ 1100 kcal/jour)
- **Répartition macros** : 4 presets au choix
  - **Équilibré** : 30% P / 40% G / 30% L
  - **High protein** : 40% P / 35% G / 25% L
  - **Low carb** : 35% P / 25% G / 40% L
  - **Custom** : sliders manuels (contraint à 100%)
- Les grammes sont calculés automatiquement depuis les % et l'objectif kcal
- Bouton "Ajuster" pour override manuel de l'objectif kcal (power users)

**Écran 6 -- Rappels**
- Horaires pré-remplis par meal_type (toggle on/off par créneau)
  - Petit-déjeuner : 8h00
  - Déjeuner : 12h30
  - Goûter : 16h00
  - Dîner : 20h00
- Permission notification demandée au tap "Activer les rappels"
- Option "Pas maintenant" (peut activer plus tard dans settings)

**Après onboarding :**
- `userProfile` inséré en base
- Premier point `weightLog` créé avec le poids saisi
- `userGoals` calculé et inséré
- `reminderSettings` sauvegardés
- Redirect vers le dashboard

#### 4.1.5 Suivi du poids

- **Pesée** : écran accessible depuis le dashboard (bouton discret) ou depuis settings
- Input poids + date (défaut : aujourd'hui)
- Un seul enregistrement par jour (UPSERT sur la date)
- **Mini graphe** sur le dashboard : courbe de poids sur les 30 derniers jours (sparkline)
- Le poids le plus récent est utilisé pour recalculer le TDEE si l'utilisateur le souhaite (prompt après -2kg ou +2kg de variation)
- Historique complet dans l'onglet stats (V2)

### 4.2 V2 -- Stats & polish

- **Dashboard stats** :
  - Moyennes glissantes 7 / 14 / 30 jours (kcal, P, G, L)
  - Graphe en barres : kcal par jour sur les 30 derniers jours
  - Graphe en ligne : tendance calorique lissée
  - Répartition macros en % (pie chart)
  - Comparaison semaine N vs semaine N-1
  - Streak de jours loggés consécutifs
  - Jour le plus / moins calorique de la semaine
- **Courbe de poids** : graphe complet weight_log avec moyenne lissée, delta depuis le début, projection vers le poids cible
- **Objectifs jour training vs jour rest** : possibilité de définir 2 sets de macros selon si c'est un jour d'entraînement ou non (exploite `trainingDaysPerWeek` du profil)
- **Export CSV** de toutes les données (meals + items + weight_log)
- **Objectifs hebdo** en plus du daily
- **Swipe-to-delete** sur les meal items avec haptic feedback
- **Thème** : dark mode cohérent, accent color configurable

### 4.3 V3 -- Évolutions possibles

- **Photo → estimation macros** : envoi photo via API Claude (BYOK) → retourne estimation kcal/P/G/L → validation manuelle
- **Suggestions de repas** basées sur l'historique et les macros restantes
- **Recettes composées** : combiner plusieurs foods en un plat réutilisable
- **Widget iOS/Android** affichant les kcal restantes
- **Sync cloud optionnelle** (Supabase ou Turso pour backup)
- **Import depuis MyFitnessPal** (export CSV → parser)

---

## 5. UX / UI Guidelines

### 5.1 Principes

1. **Speed over features** -- chaque écran a un seul objectif, pas de menus imbriqués
2. **Progressive disclosure** -- le dashboard montre l'essentiel, les détails sont à un tap
3. **Muscle memory** -- les actions fréquentes sont toujours au même endroit
4. **Feedback immédiat** -- haptic + animation sur chaque interaction

### 5.2 Navigation (expo-router)

```
app/
├── (tabs)/
│   ├── index.tsx          # Dashboard quotidien
│   ├── stats.tsx          # Stats & graphes (V2)
│   └── settings.tsx       # Profil, objectifs, rappels, export
├── add/
│   ├── index.tsx          # Bottom sheet : choix du mode
│   ├── scan.tsx           # Scanner code-barres
│   ├── search.tsx         # Recherche aliment
│   ├── quick.tsx          # Quick add
│   └── confirm.tsx        # Confirmation avec slider quantité
├── meal/
│   └── [id].tsx           # Détail d'un repas
├── weight/
│   └── index.tsx          # Saisie pesée + historique
├── profile/
│   └── index.tsx          # Édition profil (reprend les écrans onboarding)
└── onboarding/
    ├── index.tsx          # Router onboarding (redirige si déjà complété)
    ├── goal.tsx           # Écran 1 : objectif
    ├── body.tsx           # Écran 2 : infos physiques
    ├── activity.tsx       # Écran 3 : niveau d'activité
    ├── training.tsx       # Écran 4 : jours d'entraînement
    ├── summary.tsx        # Écran 5 : récap + macros
    └── reminders.tsx      # Écran 6 : rappels
```

### 5.3 Design tokens

- **Font** : System font (SF Pro / Roboto) pour la cohérence native
- **Colors** : dark theme par défaut
  - Background : `#0A0A0F`
  - Surface : `#16161F`
  - Primary : `#6366F1` (indigo)
  - Success : `#22C55E`
  - Warning : `#F59E0B`
  - Danger : `#EF4444`
  - Text : `#F1F5F9`
  - Text muted : `#94A3B8`
- **Spacing** : 4px base grid
- **Border radius** : 12px cards, 8px inputs, 9999px pills
- **Haptics** : `Haptics.impactAsync(ImpactFeedbackStyle.Light)` sur ajout, `Medium` sur suppression

---

## 6. Calcul TDEE & objectifs

### 6.1 Formule Mifflin-St Jeor

```typescript
function calculateBMR(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}
```

### 6.2 Multiplicateurs d'activité

| Niveau | Multiplicateur | Description |
|---|---|---|
| Sédentaire | 1.2 | Bureau, peu de déplacement |
| Légèrement actif | 1.375 | Marche quotidienne, debout au travail |
| Modérément actif | 1.55 | Actif au quotidien + sport léger |
| Actif | 1.725 | Travail physique ou sport régulier |
| Très actif | 1.9 | Travail physique + sport intense |

### 6.3 Calcul de l'objectif calorique

```typescript
function calculateTargetKcal(bmr: number, activityMultiplier: number, goalRateKgPerWeek: number): number {
  const tdee = Math.round(bmr * activityMultiplier);
  // 1 kg de graisse ≈ 7700 kcal → 7700/7 ≈ 1100 kcal/jour
  const dailyDelta = Math.round(goalRateKgPerWeek * 1100);
  return tdee + dailyDelta;
}
```

### 6.4 Presets macros

| Preset | Protéines | Glucides | Lipides |
|---|---|---|---|
| Équilibré | 30% | 40% | 30% |
| High protein | 40% | 35% | 25% |
| Low carb | 35% | 25% | 40% |
| Custom | libre | libre | libre |

```typescript
function macrosFromPercentages(kcalTarget: number, pPct: number, cPct: number, fPct: number) {
  return {
    proteinG: Math.round((kcalTarget * pPct) / 400),  // 1g protéine = 4 kcal
    carbsG: Math.round((kcalTarget * cPct) / 400),    // 1g glucide = 4 kcal
    fatG: Math.round((kcalTarget * fPct) / 900),      // 1g lipide = 9 kcal
  };
}
```

### 6.5 Recalcul automatique

- Si le poids varie de ±2 kg par rapport au poids utilisé pour le dernier calcul → prompt discret sur le dashboard : "Ton poids a changé, veux-tu recalculer tes objectifs ?"
- L'utilisateur peut aussi recalculer manuellement depuis Settings > Profil
- Historique des objectifs non conservé (seul le dernier compte), mais les `meal_items` gardent les valeurs absolues donc les stats passées restent cohérentes

---

## 7. Flow technique détaillé : scan

```
[User tap "+" FAB]
    → Bottom sheet s'ouvre (4 modes)
    → Tap "Scanner"

[expo-camera CameraView]
    → onBarcodeScanned({ type: 'ean13', data: '3017624010701' })
    → Haptic feedback light

[Lookup local]
    → SELECT * FROM foods WHERE barcode = '3017624010701'
    → Si trouvé → skip API, go to confirm
    → Si pas trouvé → fetch OFF API

[Fetch OFF]
    → GET https://world.openfoodfacts.org/api/v2/product/3017624010701.json
      ?fields=product_name,nutriments,nutrition_grades,image_front_small_url,brands
    → Parse : kcal_100g, proteins_100g, carbohydrates_100g, fat_100g, fiber_100g
    → INSERT INTO foods (source='off', barcode, name, kcalPer100g, ...)
    → Haptic feedback

[Confirm screen]
    → Affiche : nom, image, macros pour 100g
    → Slider quantité (default: defaultServingG ou 100g)
    → Macros recalculées en temps réel
    → Sélection meal_type (breakfast/lunch/dinner/snack)
    → Bouton "Ajouter"

[Insert]
    → INSERT INTO meals (si pas encore de meal pour ce type + date)
    → INSERT INTO meal_items (kcal calculé, protein calculé, ...)
    → UPDATE foods SET use_count = use_count + 1, last_used_at = now
    → Haptic success
    → Retour dashboard avec animation
```

---

## 8. Rappels : implémentation

```typescript
import * as Notifications from 'expo-notifications';

// Au boot de l'app ou après modif settings
async function scheduleReminders(settings: ReminderSetting[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const s of settings) {
    if (!s.enabled) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${mealTypeLabel(s.mealType)}`,
        body: `N'oublie pas de logger ton ${mealTypeLabel(s.mealType).toLowerCase()} !`,
      },
      trigger: {
        type: 'daily',
        hour: s.hour,
        minute: s.minute,
      },
    });
  }
}
```

---

## 9. Performance & bonnes pratiques

- **WAL mode** activé sur SQLite (lectures/écritures simultanées)
- **Drizzle + TanStack Query** optionnel : cache des queries, invalidation sur mutation, évite les re-renders inutiles
- **Images OFF** : ne stocker que l'URL `image_front_small_url` (< 200px), pas de blob en base
- **Recherche OFF** : debounce 300ms, abort controller sur chaque nouvelle frappe
- **Listes virtualisées** : `FlashList` pour les longs historiques
- **Pas de network au boot** : l'app est 100% fonctionnelle offline, les calls OFF sont opportunistes

---

## 10. Métriques de succès (pour soi-même)

- **Logging time** : un repas ajouté en < 15s via scan ou récents
- **Streak** : 30 jours consécutifs de logging complet
- **Adoption quotidienne** : l'app remplace MFP dans la routine
- **Plaisir d'utilisation** : pas de friction, pas de "flemme d'ouvrir l'app"

---

## 11. Getting started

```bash
# Init
npx create-expo-app nutrilog --template tabs
cd nutrilog

# Deps
npx expo install expo-sqlite expo-camera expo-notifications expo-haptics
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-gifted-charts react-native-svg expo-linear-gradient
npm install drizzle-orm
npm install -D drizzle-kit

# Dev
npx expo start
```

---

*Ce document est la source de vérité du projet. Il sera mis à jour au fil du développement.*