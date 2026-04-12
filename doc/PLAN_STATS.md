# Plan — Page statistiques

**Objectif** : un onglet "Stats" avec des graphes pertinents, lisibles, et une sélection de période. L'utilisateur doit pouvoir détecter tendances et écarts en un coup d'œil.

**Stack déjà en place** : `react-native-gifted-charts` + `react-native-svg` (déjà dans package.json), `drizzle-orm` pour les requêtes.

---

## 1. Sélecteur de période

Component `PeriodSelector.tsx` — segmented horizontal :
- **7 j** (semaine glissante)
- **30 j** (mois glissant)
- **90 j** (trimestre)
- **1 an**
- **Custom** — ouvre un date-picker de début/fin

État global via un hook `useStatsPeriod()` (Context au niveau du layout de l'onglet) : `{ from: string, to: string, label: string }`. Persisté dans `app_meta.stats_period` pour réouverture.

**Helper** : `lib/stats-period.ts` — `computePeriod(kind: 'week' | 'month' | '3m' | 'year' | 'custom', customFrom?, customTo?)`.

---

## 2. Métriques & graphes

### 2.1 Vue "Calories"
- **KPI row** : moyenne kcal/jour (vs objectif, en %), total sur période, nombre de jours loggés (streak).
- **Bar chart** kcal/jour sur période (axe X = date, axe Y = kcal). Ligne horizontale = target.
- **Moyenne mobile 7j** superposée (ligne) pour lisser les pics.
- Tap sur une barre → détail du jour dans un bottom-sheet.

### 2.2 Vue "Macros"
- **Stacked bar** protéines / glucides / lipides par jour (en g).
- **Pie chart** répartition moyenne P/G/L sur période + comparaison au target (delta %).
- **KPI** : moyenne g/jour par macro, delta vs objectif.

### 2.3 Vue "Poids"
- **Line chart** weightLog sur période.
- **Moyenne mobile 7j** (ligne pointillée) pour gommer les variations journalières d'hydratation.
- **Delta** depuis début de période + projection linéaire vers objectif (si poids cible défini) : "à ce rythme, tu atteins X kg dans N semaines".

### 2.4 Vue "Habitudes"
- **Streak** : jours loggés consécutifs (gros chiffre), meilleur streak historique.
- **Heatmap** style GitHub sur 90j/1an : intensité = % de l'objectif atteint (0% rouge, 100% vert).
- **Histogramme par meal_type** : répartition kcal moyen déjeuner vs dîner vs etc. Détecte les habitudes de jet-lag.
- **Jour le plus / moins calorique** de la période + écart à la moyenne.

### 2.5 Comparaisons
- **Période actuelle vs précédente** : même durée, décalée. Delta en % sur chaque KPI. Flèche ↑/↓ couleur.

---

## 3. Navigation

```
app/
├── (tabs)/
│   ├── index.tsx           # Dashboard
│   ├── stats.tsx           # Nouveau : hub stats
│   └── settings.tsx
├── stats/
│   ├── calories.tsx        # Vue détaillée kcal
│   ├── macros.tsx          # Vue détaillée macros
│   ├── weight.tsx          # Vue détaillée poids
│   └── habits.tsx          # Vue détaillée habitudes
```

Le hub `stats.tsx` affiche un résumé condensé + cartes cliquables vers chaque vue détaillée. Le `PeriodSelector` est sticky en haut de chaque vue et synchronisé entre toutes via le Context.

---

## 4. Requêtes SQL

Centralisées dans `lib/stats-service.ts`. Toutes acceptent `{ from: string, to: string }` et retournent des tableaux typés prêts pour gifted-charts.

### 4.1 `dailyKcalSeries(from, to): { date: string; kcal: number }[]`
```sql
SELECT m.date, COALESCE(SUM(mi.kcal), 0) AS kcal
FROM meals m LEFT JOIN meal_items mi ON mi.meal_id = m.id
WHERE m.date BETWEEN ? AND ?
GROUP BY m.date
ORDER BY m.date;
```
Puis côté JS : fill missing days avec 0 pour avoir un axe X régulier (fonction `fillDateRange`).

### 4.2 `dailyMacrosSeries(from, to): { date, protein, carbs, fat }[]`
Même pattern, 4 `SUM`.

### 4.3 `averageByMealType(from, to): { mealType, avgKcal }[]`
```sql
SELECT m.meal_type, AVG(total) AS avg_kcal FROM (
  SELECT m.id, m.meal_type, SUM(mi.kcal) AS total
  FROM meals m JOIN meal_items mi ON mi.meal_id = m.id
  WHERE m.date BETWEEN ? AND ?
  GROUP BY m.id
) GROUP BY meal_type;
```

### 4.4 `weightSeries(from, to): { date, weightKg }[]`
Simple `SELECT * FROM weight_log WHERE date BETWEEN ? AND ?`.

### 4.5 `streakInfo(): { current, best }`
Itère depuis aujourd'hui à rebours tant qu'un meal existe pour la date. `best` nécessite un scan complet — cacher dans `app_meta` et invalider à chaque meal add/delete.

### 4.6 `heatmapData(from, to, target): { date, pctOfTarget }[]`
Rejoint `dailyKcalSeries` avec `userGoals.kcalTarget` pour calculer ratio.

### 4.7 `comparePeriods(from, to)`
Calcule `{ from_prev, to_prev }` de même durée, appelle `dailyKcalSeries` deux fois, retourne `{ current: avg, previous: avg, deltaPct }`.

---

## 5. Performances

- **Index existants suffisent** : `meals(date)` et `meal_items(meal_id)` déjà présents.
- **TanStack Query** non installé — on va utiliser `useLiveQuery` de drizzle quand possible. Pour les requêtes complexes (`db.all(sql\`...\`)`), les appeler dans `useEffect` avec invalidation à l'ajout d'un meal (via un bump dans un Context ou un event emitter léger).
- **Moyennes mobiles** : calculées côté JS sur les séries brutes (pas en SQL — plus simple à tester et la série fait < 366 points).
- **Virtualisation** : N/A, on plot des séries finies. Gifted-charts gère bien jusqu'à 365 points.

---

## 6. Phases

### Phase 1 — Infrastructure
- `lib/stats-period.ts` + `lib/stats-service.ts` (toutes les requêtes, pas encore d'UI).
- `hooks/useStatsPeriod.tsx` + Context.
- `components/PeriodSelector.tsx`.
- Tests visuels : `console.log` des résultats depuis un écran stub. (2-3h)

### Phase 2 — Hub stats + vue calories
- `app/(tabs)/stats.tsx` : hub avec 4 cards (Calories / Macros / Poids / Habitudes), KPI row en haut.
- `app/stats/calories.tsx` : bar chart + moving average, KPI detail, détail par tap. (3h)

### Phase 3 — Vues macros + poids
- `app/stats/macros.tsx` : stacked bar + pie. (2h)
- `app/stats/weight.tsx` : line chart + moyenne mobile + projection. (2h)

### Phase 4 — Vue habitudes
- `app/stats/habits.tsx` : streak KPI, heatmap (custom SVG composant ou grid React), histogramme par meal_type. (3h)

### Phase 5 — Comparaisons & export
- Badge "vs période précédente" sur chaque KPI du hub.
- Export CSV (Share API) depuis un menu du hub : tous les meal_items + weight_log de la période. (2h)

### Phase 6 — Polish & empty states
- Empty state si < 3 jours de données ("Log quelques jours pour voir tes stats").
- Skeleton loading (shimmer) pendant les requêtes.
- Animations d'entrée des graphes (fade/translate, reanimated). (1h)

---

## 7. Dépendances

Tout est déjà installé. Rien à rajouter pour V1.

V2 éventuelle : `react-native-share` pour l'export CSV (Share API natif RN suffit en V1).

---

## 8. Tests manuels

- Loguer 30 jours de data fictifs via un seed dev (script ponctuel `scripts/seed-dev-meals.ts`).
- Changer de période → tous les graphes se mettent à jour sans flicker.
- Supprimer un meal → stats se mettent à jour (via `useLiveQuery` ou refresh explicite).
- Pas de données → empty state propre.
- 365 jours de data → graphes fluides, pas de freeze à la sélection "1 an".
