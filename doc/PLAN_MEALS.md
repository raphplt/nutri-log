# Plan — Enregistrement des repas (niveau production)

**Objectif** : Passer les 3 modes (scan QR / recherche BDD locale / manuel) en qualité app pro, utilisable au quotidien. OSS/gratuit exclusivement. La recherche BDD locale **doit fonctionner 100% offline**.

**Stack figée** : Expo SDK 54.0.33, expo-router 6, TS strict, Drizzle 0.45 + expo-sqlite 16, Biome, RN 0.81.5, React 19.

---

## Phase 0 — Documentation discovery (DONE)

### APIs & contraintes vérifiées

**expo-sqlite 16 / FTS5** :
- FTS5 natif activé par défaut (option `enableFTS` du config plugin → default `true`).
- Tokenizer `unicode61 remove_diacritics 2` dispo (SQLite ≥ 3.27, bundlé sur iOS/Android).
- Syntaxe officielle (`sqlite.org/fts5.html`) :
  ```sql
  CREATE VIRTUAL TABLE foods_fts USING fts5(
    name, brand,
    content='foods', content_rowid='id',
    tokenize = "unicode61 remove_diacritics 2"
  );
  ```
- Scoring `bm25(foods_fts, w1, w2)` — tri ASC (plus petit = meilleur).
- Exécution SQL brut via Drizzle : `db.run(sql\`...\`)`, `db.all(sql\`...\`)`.

**Drizzle ORM + virtual tables** :
- **Pas de support natif** (issue drizzle-team/drizzle-orm#2046, toujours ouverte).
- Pattern : `npx drizzle-kit generate --custom --name=fts_foods` → fichier `.sql` vide éditable, inclus au journal, non écrasé au regen.

**CIQUAL ANSES (recherche locale)** :
- Licence Ouverte Etalab v2.0 (attribution ANSES requise).
- URL XLS FR stable : `https://www.data.gouv.fr/api/1/datasets/r/bcdb7fec-875c-42aa-ba6e-460adf97aad3`
- URL XML FR : `https://www.data.gouv.fr/api/1/datasets/r/e31dd87c-8ad0-43e4-bdaa-af84ad243dc6`
- ~3185 aliments × 67 constituants. Valeurs spéciales à parser : `traces`, `-`, `<X`.
- Champs clés : `alim_code`, `alim_nom_fr`, `alim_nom_eng`, `alim_grp_code`, `Energie, Règlement UE N° 1169/2011 (kcal/100 g)`, `Protéines, N x facteur de Jones (g/100 g)`, `Glucides (g/100 g)`, `Lipides (g/100 g)`, `Fibres alimentaires (g/100 g)`, `Sodium (mg/100 g)`.
- **Gap** : noms exacts colonnes à geler en ouvrant le XLS 2020 réel (phase 4 commence par ça).

**expo-camera 17 (SDK 54)** :
- `<CameraView enableTorch={boolean} facing="back" barcodeScannerSettings={{ barcodeTypes }} onBarcodeScanned={...} />`.
- `BarcodeScanningResult = { bounds, cornerPoints, data: string, type: string, extra? }`.
- Formats dispo : `aztec|ean13|ean8|qr|pdf417|upc_e|datamatrix|code39|code93|itf14|codabar|code128|upc_a`.

**expo-haptics 15** (déjà installé, déjà utilisé).

**expo-localization (SDK 54)** — non installé :
- API : `getLocales(): Locale[]`, `useLocales()` (réactif). `Localization.locale` absent de l'API officielle → utiliser `getLocales()[0].languageCode`.

**expo-image (SDK 54)** — non installé :
- `<Image source cachePolicy="memory-disk" contentFit="cover" transition={200} />`.
- `cachePolicy: 'none' | 'disk' | 'memory' | 'memory-disk'` (default `disk`).

**Open Food Facts** :
- User-Agent format officiel : `AppName/Version (ContactEmail)` — déjà conforme dans `lib/off-api.ts`.
- Rate limits : **100 req/min** pour `/api/v2/product`, **10 req/min** pour search endpoints.
- **ETag/If-None-Match** : non documenté officiellement → stratégie = TTL local 7 jours + refetch si modif user.
- Search-a-licious : `GET https://search.openfoodfacts.org/search` avec params `q, langs, page, page_size, fields, sort_by, facets`. Réponse `{ hits, count, page, page_count, page_size, is_count_exact, facets }`.

**État repo** :
- `expo-localization`, `expo-image`, `i18next`, `react-i18next` NON installés.
- Pattern migrations : `useMigrations` hook dans `app/_layout.tsx:23`, bloque splash tant que `success=false` → bon point d'insertion pour créer FTS5 + seed CIQUAL.
- Table `foods` actuelle : `id, source, barcode, name, brand, imageUrl, kcalPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g, defaultServingG, useCount, lastUsedAt, createdAt`.

### Anti-patterns à éviter

- ❌ Définir les virtual tables dans `db/schema.ts` (Drizzle n'a pas de helper → ça casse).
- ❌ Éditer `drizzle/migrations.js` à la main (écrasé au regen).
- ❌ Dupliquer CIQUAL en runtime : utiliser FTS5 `content='foods'` (external content) pour éviter la double occupation disque.
- ❌ Charger CIQUAL à chaque boot : seed idempotente, flag `ciqual_seeded` dans table `app_meta`.
- ❌ Hardcoder la langue en dur (CLAUDE.md exige i18n).
- ❌ Inventer un support ETag OFF non documenté.
- ❌ Utiliser `Localization.locale` (absent API SDK 54).

---

## Phase 1 — Fondations i18n (FR + EN)

**Priorité** : 🔴 Haute — bloque tous les textes UI des phases suivantes.
**Dépendances** : aucune.
**Indépendance** : exécutable seule.

### À faire

1. `npx expo install expo-localization` et `npm install i18next react-i18next`.
2. Créer `lib/i18n.ts` :
   ```ts
   import i18n from "i18next";
   import { initReactI18next } from "react-i18next";
   import { getLocales } from "expo-localization";
   import fr from "@/locales/fr.json";
   import en from "@/locales/en.json";

   const deviceLang = getLocales()[0]?.languageCode ?? "fr";

   i18n.use(initReactI18next).init({
     resources: { fr: { translation: fr }, en: { translation: en } },
     lng: deviceLang === "en" ? "en" : "fr",
     fallbackLng: "fr",
     interpolation: { escapeValue: false },
     compatibilityJSON: "v4",
   });

   export default i18n;
   ```
3. Créer `locales/fr.json` + `locales/en.json` avec namespaces plats : `common.*`, `meal.*`, `scan.*`, `search.*`, `confirm.*`, `add.*`, `weight.*`, `profile.*`, `dashboard.*`, `onboarding.*`.
4. Importer `@/lib/i18n` une seule fois en tête de `app/_layout.tsx` (side-effect init).
5. Passer en revue TOUS les fichiers ayant des strings FR hardcodées et remplacer par `useTranslation() → t("clé")`. Partir de :
   - `app/add/*.tsx`, `app/meal/*.tsx`, `app/weight/*.tsx`, `app/profile/*.tsx`, `app/(tabs)/*.tsx`, `app/onboarding/*.tsx`, `components/**`.
6. Ajouter un paramètre `language` dans `app/profile/settings.tsx` (ou équivalent) : segmented control FR / EN / Auto, persisté en SQLite (table `app_meta` à créer si absente).

### Vérification

- `npm run tsc` passe.
- `npx biome check --write .` passe.
- Grep `/"[éèàçù]/i` dans `app/` et `components/` ne retourne plus de strings UI hardcodées.
- Changer la langue système → textes en EN au boot.

### Anti-patterns

- ❌ Fichiers par namespace (complexité inutile à notre échelle — 1 JSON par langue suffit).
- ❌ Lazy loading des ressources (Metro bundle les JSON au build, inutile en RN).

---

## Phase 2 — Wrapper HTTP OFF + Search-a-licious

**Priorité** : 🟠 Moyenne-haute — robustesse réseau.
**Dépendances** : Phase 1 pour messages d'erreur i18n (peut aussi être fait avec strings anglaises puis i18n'd après).
**Indépendance** : oui.

### À faire

1. Créer `lib/http.ts` — un wrapper fetch générique :
   - Timeout 8s via `AbortController` composé avec l'AbortSignal externe.
   - Retry exponential backoff (2 tentatives), délais `500ms, 1500ms` sauf sur status 4xx (non-retryable).
   - Signature : `fetchJson<T>(url: string, opts?: { signal?, headers? }): Promise<T>`.
   - Header `User-Agent: NutriLog/<version du package.json> (contact@nutrilog.app)` injecté automatiquement.
2. Refactor `lib/off-api.ts` :
   - Utiliser `fetchJson` pour `fetchProductByBarcode`.
   - Remplacer `searchProducts` (qui utilise `/cgi/search.pl`) par un appel à **Search-a-licious** : `GET https://search.openfoodfacts.org/search?q=<q>&langs=fr,en&page_size=20&fields=code,product_name,brands,image_small_url,nutriments,serving_size,serving_quantity,nutriscore_grade,nova_group`.
   - Parser `hits[]` de la réponse, mapper vers le type interne `OffProduct`.
   - Garder la fonction `searchProductsLegacy` en fallback silencieux pendant 1 sprint ? Non → YAGNI, switch direct.
3. Throttle client : limiter à 1 req search / 250ms (debounce côté appelant + file simple interne).
4. Cache TTL produit : table `foods.lastOffFetchAt` ajoutée via migration ; si `< 7 jours`, pas de refetch.

### Vérification

- `npm run tsc` + biome.
- Test manuel : chercher "nutella", "poulet", "yaourt nature" → résultats cohérents depuis Search-a-licious.
- Scan barcode connu → produit retourné, `lastOffFetchAt` renseigné.
- Couper le wifi puis refaire un scan du même barcode → récupéré depuis le cache local (pas d'erreur).

### Anti-patterns

- ❌ ETag `If-None-Match` — non documenté par OFF, ne pas inventer.
- ❌ Retry sur 4xx (produit inexistant = 404, inutile de réessayer).

---

## Phase 3 — FTS5 + ranking recherche locale

**Priorité** : 🔴 Haute — cœur de la recherche offline.
**Dépendances** : aucune (indépendante des phases 1/2).
**Indépendance** : oui.

### À faire

1. Générer migration custom Drizzle :
   ```bash
   npx drizzle-kit generate --custom --name=fts_foods
   ```
2. Éditer le fichier `.sql` généré pour créer :
   ```sql
   CREATE VIRTUAL TABLE foods_fts USING fts5(
     name, brand,
     content='foods', content_rowid='id',
     tokenize = "unicode61 remove_diacritics 2"
   );

   -- Triggers de synchro external content
   CREATE TRIGGER foods_ai AFTER INSERT ON foods BEGIN
     INSERT INTO foods_fts(rowid, name, brand) VALUES (new.id, new.name, new.brand);
   END;
   CREATE TRIGGER foods_ad AFTER DELETE ON foods BEGIN
     INSERT INTO foods_fts(foods_fts, rowid, name, brand) VALUES('delete', old.id, old.name, old.brand);
   END;
   CREATE TRIGGER foods_au AFTER UPDATE ON foods BEGIN
     INSERT INTO foods_fts(foods_fts, rowid, name, brand) VALUES('delete', old.id, old.name, old.brand);
     INSERT INTO foods_fts(rowid, name, brand) VALUES (new.id, new.name, new.brand);
   END;

   -- Rebuild pour ingérer les lignes existantes au moment de la migration
   INSERT INTO foods_fts(foods_fts) VALUES('rebuild');

   -- Historique des recherches
   CREATE TABLE search_history (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     query TEXT NOT NULL,
     created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
   );
   CREATE INDEX search_history_created_at_idx ON search_history(created_at DESC);
   ```
3. Créer `lib/search-service.ts` :
   - `searchLocal(query: string, { signal }): Promise<SearchResult[]>` — tokenize la query, préfixe `*` sur chaque token (`"poulet roti*"` → `poulet* roti*`), appelle :
     ```sql
     SELECT f.*, bm25(foods_fts, 10.0, 3.0) AS bm25
     FROM foods_fts
     JOIN foods f ON f.id = foods_fts.rowid
     WHERE foods_fts MATCH ?
     LIMIT 40;
     ```
   - Scoring composite en JS : `score = bm25 / (1 + log(1 + useCount)) / recencyBoost(lastUsedAt)`.
   - Tri ASC par score, tronqué à 20.
   - Ajouter à `search_history` si query ≥ 3 chars (dedup sur 24h).
4. Refactor `lib/food-service.ts` :
   - `searchFoods(q)` : appelle d'abord `searchLocal` (retour instantané), puis **si online** lance en parallèle Search-a-licious (via Phase 2) et merge stream les nouveaux résultats dédupliqués par barcode / (name+brand).
   - Stale-while-revalidate pattern.
5. Refactor `app/add/search.tsx` :
   - Debounce 250ms + `AbortController` annulé à chaque keystroke.
   - Afficher section "Récents" (top 5 `search_history`) quand input vide.
   - Afficher section "Fréquents" (top 8 foods par `useCount`) en dessous.

### Vérification

- Migration passe sans erreur (`useMigrations` hook success=true).
- Chercher "poulet" avec accent absent → matches "poulet rôti", "salade poulet".
- Chercher "POULET" majuscules → mêmes matches.
- Couper le réseau → recherche locale toujours fonctionnelle.
- Historique peuplé après quelques recherches.

### Anti-patterns

- ❌ Recréer FTS5 à chaque boot (la migration s'en charge une seule fois).
- ❌ Requête FTS5 sans `*` en suffixe (empêche la recherche par préfixe).
- ❌ Indexer autre chose que `name, brand` au début (YAGNI — on ajoutera categories/tags si besoin).

---

## Phase 4 — Seed CIQUAL bundlée

**Priorité** : 🔴 Haute — sans données offline, la recherche locale est vide.
**Dépendances** : Phase 3 (FTS5 prêt pour indexer).
**Indépendance** : oui une fois Phase 3 mergée.

### À faire

1. **Pré-processing offline** (script Node dans `scripts/build-ciqual.ts`, exécuté à la main, pas au runtime) :
   - Télécharger XLS depuis `https://www.data.gouv.fr/api/1/datasets/r/bcdb7fec-875c-42aa-ba6e-460adf97aad3`.
   - Parser avec `xlsx` (npm, MIT) — dep dev uniquement.
   - Extraire uniquement les colonnes utiles : `alim_code, alim_nom_fr, alim_nom_eng, alim_grp_code, Energie kcal/100g, Protéines N×Jones g/100g, Glucides g/100g, Lipides g/100g, Fibres alimentaires g/100g, Sodium mg/100g`.
   - Normaliser les valeurs spéciales : `traces` → `0`, `-` → `null`, `<X` → `X/2` (convention).
   - Écrire `assets/ciqual.json` (array d'objets compact, ~400-600 KB gzippé par Metro).
   - Commit le JSON (pas le script dans le bundle runtime, juste un outil de build).
2. Créer `lib/ciqual-seed.ts` :
   - Fonction `seedCiqualIfNeeded(db)` :
     - Check `SELECT value FROM app_meta WHERE key='ciqual_seeded_v1'` → si présent, return.
     - Lire `assets/ciqual.json` (import statique).
     - Batch insert dans `foods` avec `source='ciqual'`, `barcode=NULL`, champs nutritionnels.
     - `INSERT INTO app_meta VALUES ('ciqual_seeded_v1', <timestamp>)`.
     - Tout dans une transaction unique (sinon 3000 inserts = lent).
3. Créer table `app_meta` si pas déjà présente : schema `{ key TEXT PK, value TEXT }`.
4. Appeler `seedCiqualIfNeeded` dans `app/_layout.tsx` après `useMigrations` success=true, avant de lever le splash — avec un indicateur de progression (texte "Préparation des aliments…" i18n'd).
5. Étendre `source` dans `db/schema.ts` pour accepter `'ciqual'`.
6. Afficher un badge discret "🥕 Aliment brut" (via i18n) dans les résultats de recherche pour les items `source='ciqual'`.

### Vérification

- Premier boot sur device propre : splash bloque ~2-5s, puis home s'affiche.
- `SELECT COUNT(*) FROM foods WHERE source='ciqual'` ≈ 3185.
- Deuxième boot : pas de re-seed (flag vérifié).
- Recherche "pomme" offline → trouve "Pomme, crue", "Pomme cuite au four", etc.
- Attribution ANSES visible dans page "À propos" (mention légale obligatoire Licence Ouverte).

### Anti-patterns

- ❌ Bundler le XLS brut (200KB+ et parsing runtime coûteux).
- ❌ Re-seeder à chaque boot.
- ❌ Oublier la mention d'attribution ANSES (violation licence).
- ❌ Mettre le script build en prod dep (dev-only).

---

## Phase 5 — Portions multiples

**Priorité** : 🟠 Moyenne — gros gain UX, mais pas bloquant.
**Dépendances** : aucune côté schéma ; Phase 1 pour i18n des labels.
**Indépendance** : oui.

### À faire

1. Migration Drizzle standard (via `db/schema.ts`) :
   ```ts
   export const foodServings = sqliteTable("food_servings", {
     id: integer("id").primaryKey({ autoIncrement: true }),
     foodId: integer("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
     label: text("label").notNull(), // i18n key OU texte brut parsé
     grams: real("grams").notNull(),
     isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
   }, (t) => ({
     foodIdIdx: index("food_servings_food_id_idx").on(t.foodId),
   }));
   ```
   Puis `npm run db:generate`, commit la migration.
2. Étendre `lib/off-api.ts` pour parser `serving_size` ("30 g (1 biscuit)", "1 yaourt (125 g)") :
   - Regex simple : `/(\d+(?:[.,]\d+)?)\s*g/` pour extraire grammes + label textuel résiduel.
   - Si `serving_quantity` présent : source primaire ; sinon fallback regex.
   - Créer 1-2 entries dans `food_servings` à l'insertion.
3. Toujours ajouter une entrée "100 g" par défaut pour permettre la saisie libre.
4. Refactor `app/add/confirm.tsx` :
   - Ajouter un segmented control (horizontal scroll si > 3 items) au-dessus du slider : liste des `food_servings` + option "Personnalisé".
   - Sélection d'une portion → `quantityG = portion.grams × multiplier` (multiplier par défaut 1). Slider multiplier 0.25 → 5 par pas de 0.25.
   - Si "Personnalisé" : slider en grammes comme aujourd'hui.
   - Preview macro calculé en conséquence.
5. `lib/meal-service.ts` : ajouter `servingId` optionnel à `mealItems` pour historiser (migration `add column`). `quantityG` reste la valeur canonique.

### Vérification

- Ajouter un produit OFF avec `serving_size: "125 g"` → portion "125 g" listée et sélectionnable.
- Aliment CIQUAL sans portion spécifique → seul "100 g" dispo → fallback slider.
- Macro preview cohérent entre portion×multiplier et slider libre.

### Anti-patterns

- ❌ Stocker `label` dans `i18n` (les labels OFF sont en langue source du produit — trop hétérogène ; texte brut OK).
- ❌ Rendre `servingId` obligatoire (casse les meal items legacy).

---

## Phase 6 — Scan QR code production-grade

**Priorité** : 🟠 Moyenne — le scan actuel marche, c'est du polish critique.
**Dépendances** : Phase 1 (i18n messages), Phase 2 (queue offline réutilise wrapper HTTP).
**Indépendance** : après Phases 1+2.

### À faire

1. Refactor `app/add/scan.tsx` :
   - **Overlay viseur** : vue centrée 280×180 avec 4 coins arrondis, fond semi-opaque autour (`rgba(0,0,0,0.55)` + window), ligne de scan animée verticale via `react-native-reanimated` (boucle infinie 1.5s).
   - **Torch toggle** : bouton en haut-droite ; state `torchOn`, prop `enableTorch={torchOn}`.
   - **Haptic feedback** : `Haptics.notificationAsync(Success)` au scan réussi, `Error` sur check digit invalide.
   - **Validation EAN-13 check digit** : `lib/barcode.ts` avec `isValidEan13(code: string): boolean`. Algorithme : somme pondérée 1,3,1,3,… des 12 premiers chiffres ; 13e = (10 - sum%10) % 10.
   - **Dedup < 2s** : `lastScannedRef = { code, at }` ; ignorer si même code dans les 2000 ms.
   - **Fallback saisie manuelle** : bouton "Saisir le code manuellement" sous la caméra → modal avec `TextInput numeric`, 13 chiffres, validation check digit, navigate confirm si OK.
2. Créer `lib/scan-queue.ts` :
   - Détection réseau via `@react-native-community/netinfo` (non installé → `npx expo install`).
   - Si scan offline → insert dans table `scan_queue (id, barcode, created_at, resolved_at NULL)`.
   - Hook `useScanQueueResolver` monté dans `app/_layout.tsx` : écoute `NetInfo.addEventListener`, quand `isConnected=true` dépile la queue (1 par 700ms, respect rate limit 100/min).
   - Chaque résolution → `food-service.getFoodByBarcode(code)` → insert dans `foods` ; marque résolu.
3. Migration Drizzle : ajouter table `scan_queue` + flag sur `foods.pendingSync` (optionnel, utile pour UI "scan en attente").
4. UI : badge discret "N scans en attente" dans l'écran add si `scan_queue` non vide.

### Vérification

- Scanner un EAN-13 valide → haptic success + navigation confirm.
- Scanner un code invalide (bidouiller 1 chiffre) → haptic error + toast "Code-barres invalide".
- Mode avion → scan → retour online → produit auto-résolu et toast "1 produit synchronisé".
- Torche s'allume/éteint proprement.
- 5 scans rapides du même code → 1 seule requête OFF.

### Anti-patterns

- ❌ Utiliser `setInterval` pour la ligne animée (reanimated + `withRepeat` est l'idiome RN propre).
- ❌ Queue offline avec `AsyncStorage` (on a déjà SQLite, source de vérité).
- ❌ Valider EAN-8 avec le même algo (pondération différente — hors scope si on n'en veut pas).

---

## Phase 7 — Images + badges + édition données incomplètes

**Priorité** : 🟢 Basse-moyenne — polish visuel final.
**Dépendances** : Phase 2 (HTTP wrapper), Phase 1 (i18n).
**Indépendance** : oui après 1+2.

### À faire

1. `npx expo install expo-image`.
2. Remplacer tous les `<Image>` RN par `<Image>` expo-image dans les écrans où on affiche `imageUrl` produit (au moins `search.tsx`, `confirm.tsx`, `index.tsx`). Props : `cachePolicy="memory-disk"`, `contentFit="cover"`, `transition={180}`, `recyclingKey={food.id}` dans les listes.
3. Affichage badges dans `confirm.tsx` + `search.tsx` (results cards) :
   - Nutri-Score : pastille avec lettre (A-E) + couleur (`#038141, #85BB2F, #FECB02, #EE8100, #E63E11`). Si absent → ne rien afficher.
   - NOVA : badge numérique 1-4 avec tooltip i18n court ("Aliment peu transformé" … "Ultra-transformé").
4. Composant `components/FoodQualityBadges.tsx` réutilisable.
5. Détection données incomplètes :
   - Dans `food-service.ts`, flag `isIncomplete = kcalPer100g == null || proteinPer100g == null || carbsPer100g == null || fatPer100g == null`.
   - Dans `confirm.tsx`, si `isIncomplete` → bandeau orange "Données incomplètes, à compléter" + bouton "Modifier".
   - Écran édition `app/food/[id]/edit.tsx` : formulaire kcal/protéines/glucides/lipides/fibres/portion ; sauvegarde locale (update `foods`), `source` passe à `'off-edited'` pour traçabilité. Pas de contrib upstream pour l'instant.

### Vérification

- Premier affichage produit avec image → fade-in, ensuite instantané (cache disk).
- Scroll dans la liste résultats → pas de re-download images.
- Nutella : badge Nutri-score E rouge + NOVA 4.
- Produit OFF incomplet → bandeau édition → sauvegarde → kcal affiché après retour.

### Anti-patterns

- ❌ `cachePolicy="memory"` uniquement (perdu au redémarrage app).
- ❌ Éditer directement OFF (hors scope, nécessite auth contributor).

---

## Phase 8 — Vérification finale

**Priorité** : 🔴 Obligatoire.

### À faire

- `npm run tsc` → 0 erreur.
- `npx biome check --write .` → clean.
- Grep anti-patterns :
  - `grep -rn "Localization.locale" app/ lib/ components/` → vide.
  - `grep -rn "cgi/search.pl" lib/` → vide (remplacé par Search-a-licious).
  - `grep -rn "from \"react-native\"" components/ app/ | grep "Image"` → `Image` RN ne doit plus être utilisé pour les photos produits (autorisé ailleurs).
  - `grep -rn "any" lib/ app/ --include="*.ts" --include="*.tsx"` → aucune occurrence (CLAUDE.md rule).
- Check manuel mode avion total : boot cold + recherche locale "yaourt", "poulet", "riz" → résultats cohérents, pas d'erreur réseau visible pour l'utilisateur.
- Check manuel online : scan barcode Nutella → produit + badges + image.
- Check changement langue système FR ↔ EN au reboot → tous textes traduits.
- Vérifier attribution ANSES dans page "À propos" / settings.
- Vérifier taille bundle (Metro) n'explose pas (CIQUAL JSON devrait ajouter ~500 KB).

---

## Ordre d'exécution recommandé

```
Phase 1 (i18n) ──────────┬──► Phase 6 (scan UX)
                         ├──► Phase 7 (images + badges)
Phase 2 (HTTP + SaL) ────┤
                         │
Phase 3 (FTS5) ──► Phase 4 (seed CIQUAL)
                                │
Phase 5 (portions) ─────────────┤
                                ▼
                          Phase 8 (verif)
```

Phases 1, 2, 3, 5 peuvent démarrer en parallèle (si plusieurs sessions). Phase 4 bloque sur 3. Phases 6 et 7 bloquent sur 1+2.
