# Plan — Repas composés & recettes

**Objectif** : permettre de sauvegarder un ensemble d'ingrédients comme un "repas" ou une "recette" réutilisable, et l'ajouter en un tap au journal.

**Distinction conceptuelle** :
- **Meal template** (repas type) — un repas récurrent (ex. "Mon petit-déj"), rapide à reloguer tel quel.
- **Recipe** (recette) — un plat composé avec portions, qui se comporte comme un aliment : on peut en ajouter 150 g au journal, et les macros sont dérivées de sa composition.

Les deux partagent l'essentiel du modèle mais diffèrent à l'usage : le template est un raccourci qui insère plusieurs `meal_items` d'un coup ; la recette est un food virtuel qui apparaît en recherche.

---

## 1. Schéma

```ts
// db/schema.ts

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // 'template' | 'recipe'
  totalWeightG: real("total_weight_g"), // recipe only: poids final cuit total
  servingsDefault: real("servings_default"), // recipe only (ex. 4 parts)
  imageUrl: text("image_url"),
  notes: text("notes"),
  useCount: integer("use_count").default(0),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const recipeItems = sqliteTable("recipe_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  foodId: text("food_id").references(() => foods.id), // null pour quick-add ingredient
  name: text("name").notNull(), // dénormalisé
  quantityG: real("quantity_g").notNull(),
  kcal: real("kcal").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  position: integer("position").notNull().default(0),
});
```

Index : `recipes(kind, useCount DESC)`, `recipe_items(recipe_id)`.

**Totaux dérivés**, pas stockés. Une vue mémoire `computeRecipeTotals(recipeId)` somme les `recipe_items`. Toujours recalculés à la lecture — évite désync quand un item change.

---

## 2. Flows UX

### 2.1 Créer un repas type depuis le dashboard
- Sur un `meal` existant (ex. ton dîner d'hier), option "Sauvegarder comme repas type" dans le header `meal/[id].tsx`.
- Ouvre une modale : nom, kind = `template`. Duplique les items en `recipe_items`.
- Aucune édition : c'est une photo instantanée.

### 2.2 Créer une recette à froid
- Nouvelle route `recipe/new.tsx` accessible depuis Settings ou un FAB "+" dans un écran "Mes recettes".
- Form : nom, image optionnelle (expo-image-picker), poids total cuit, servings default.
- Écran composition `recipe/[id]/edit.tsx` : liste éditable d'items, bouton "+ ingrédient" qui réutilise `app/add/search.tsx` en mode picker (param `mode=pick-for-recipe`, retourne un résultat au lieu de logger).
- Totaux calculés en bas (par 100 g + par part).

### 2.3 Ajouter une recette à un repas
- Dans `app/add/search.tsx`, les recettes apparaissent avec les autres foods (une section "Mes recettes" en haut quand il y a match).
- Tap → `confirm.tsx` s'ouvre en mode "recipe" : slider portion en **grammes** OU **parts** (toggle), macros recalculées depuis les totaux.
- À la validation : un seul `meal_items` inséré, `foodId = null`, `name = recipe.name`, macros scalées. Optionnel : `meal_items.recipeId` pour historiser (nouvelle col).

### 2.4 Ajouter un template au dashboard
- Section "Récents / Favoris" affiche aussi les templates top 5.
- Tap → insère `N` `meal_items` dans le meal actuel (bulk insert en transaction).
- Animation de succès + undo (toast 3s).

### 2.5 Gérer
- Écran `(tabs)` ou sous-section de settings : "Mes recettes / Repas types". Liste filtrable, swipe-to-delete, tap = édit.

---

## 3. Phases

### Phase 1 — Schéma + service backend
- Migration Drizzle : `recipes`, `recipe_items`.
- `lib/recipe-service.ts` : CRUD + `computeRecipeTotals`, `scaleToGrams`, `cloneMealAsTemplate`, `expandTemplateIntoMeal`.
- Aucune UI encore. `npm run tsc` + biome. (1-2h)

### Phase 2 — Création depuis un meal existant
- Bouton "Sauvegarder comme repas type" dans `meal/[id].tsx`.
- Modale nom → appelle `cloneMealAsTemplate(mealId, name)`.
- Validation : template visible après redémarrage. (1h)

### Phase 3 — Ré-utilisation template dans dashboard
- Section "Repas types" dans `app/add/index.tsx` (carrousel horizontal).
- Tap → `expandTemplateIntoMeal(templateId, today, mealType)` avec prompt mealType.
- Haptic + undo toast. (1-2h)

### Phase 4 — Recettes éditables
- `app/recipe/new.tsx` + `app/recipe/[id]/edit.tsx`.
- Réutilisation de `app/add/search.tsx` en mode picker (param `pickOnly=1` change le return flow).
- Totaux en temps réel via un hook dérivé `useRecipeTotals`.
- Écran liste `app/recipe/index.tsx`. (3-4h)

### Phase 5 — Recette en recherche + confirm
- `searchFoods` merge les recettes avec kind='recipe' dans les résultats (préfixe "👨‍🍳 " ou section dédiée).
- `confirm.tsx` détecte `foodId` qui est une recette → toggle grammes/parts.
- Insertion `meal_items` avec snapshot des macros scalées. (2h)

### Phase 6 — Polish
- Édit d'une recette existante propage pas rétroactivement : on stocke la photo macro dans `meal_items` au moment du log (déjà fait). Affiché clairement si la recette a été modifiée depuis ("version du DD/MM").
- Image optionnelle via `expo-image-picker` (à installer).
- Export CSV inclut les recettes. (1h)

---

## 4. Décisions à valider avant de coder

- **Recettes = foods virtuels ou table à part ?** → table à part. Évite de polluer `foods` et simplifie la logique FTS (on ne veut pas bm25 sur recette vs vrai aliment).
- **Scaling par portion ou grammes ?** → les deux. Slider toggle. Par défaut : grammes si `totalWeightG` connu, sinon portions.
- **Édition rétroactive** ? → NON. Le journal garde toujours les macros du moment du log. La recette est modifiable pour les usages futurs uniquement.
- **Meal template vs recipe** → une seule table avec `kind`. Permet de promouvoir template → recipe.

---

## 5. Dépendances à installer

- `expo-image-picker` (pour image optionnelle de recette). `npx expo install expo-image-picker`.

---

## 6. Points ouverts / extensions V2

- **Import recette depuis une URL** (parser JSON-LD `Recipe` schema.org).
- **Recettes de saison / suggestions** basées sur l'historique.
- **Partage de recette** (export JSON → QR code ou lien `nutrilog://recipe?data=...`).
