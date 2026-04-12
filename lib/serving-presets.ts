/**
 * Curated mapping of food names → typical unit servings. Used to seed
 * `food_servings` so that the confirm screen can show a clean integer stepper
 * ("2 œufs", "3 tranches") instead of a gram slider whenever it makes sense.
 *
 * Matching runs on a normalized name (lowercased, diacritics stripped). First
 * matching rule wins, so compound patterns (e.g. "pomme de terre") must come
 * before their simpler variants ("pomme").
 */

export interface ServingPresetServing {
	label: string;
	grams: number;
	isDefault?: boolean;
	isUnit?: boolean;
}

interface ServingPreset {
	match: RegExp;
	exclude?: RegExp;
	servings: ServingPresetServing[];
}

function normalize(name: string): string {
	return name
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

const PRESETS: ServingPreset[] = [
	// — Dairy, eggs —
	{
		match: /\byaourts?\b/,
		servings: [{ label: "1 pot", grams: 125, isDefault: true, isUnit: true }],
	},
	{
		match: /\bpetit[-\s]suisse\b/,
		servings: [
			{ label: "1 petit-suisse", grams: 60, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\boeufs?\b|\boeuf\b/,
		exclude: /\b(pate|gateau|cake|brioche|mayo|sauce|ramen|nouille|biscuit)\b/,
		servings: [
			{ label: "1 œuf (M)", grams: 60, isDefault: true, isUnit: true },
		],
	},

	// — Bakery —
	{
		match: /\bbaguette\b/,
		servings: [
			{ label: "1/4 baguette", grams: 62, isDefault: true, isUnit: true },
			{ label: "1 baguette", grams: 250, isUnit: true },
		],
	},
	{
		match: /\bbiscottes?\b/,
		servings: [
			{ label: "1 biscotte", grams: 8, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bcroissants?\b/,
		servings: [
			{ label: "1 croissant", grams: 60, isDefault: true, isUnit: true },
		],
	},
	{
		match: /pain au chocolat|chocolatine/,
		servings: [
			{
				label: "1 pain au chocolat",
				grams: 70,
				isDefault: true,
				isUnit: true,
			},
		],
	},
	{
		match: /\bbrioches?\b/,
		exclude: /\b(pate|feuilletee|tressee)\b/,
		servings: [
			{ label: "1 tranche", grams: 30, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bcrepes?\b/,
		servings: [{ label: "1 crêpe", grams: 70, isDefault: true, isUnit: true }],
	},
	{
		match: /\bgalettes?\b/,
		exclude: /\briz|saint[\s-]michel\b/,
		servings: [
			{ label: "1 galette", grams: 100, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bmuffins?\b/,
		servings: [{ label: "1 muffin", grams: 60, isDefault: true, isUnit: true }],
	},
	{
		match: /\bdonuts?\b|\bbeignets?\b/,
		servings: [
			{ label: "1 beignet", grams: 70, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bgaufres?\b/,
		servings: [{ label: "1 gaufre", grams: 80, isDefault: true, isUnit: true }],
	},
	{
		match: /pain de mie/,
		servings: [
			{ label: "1 tranche", grams: 30, isDefault: true, isUnit: true },
		],
	},
	{
		match: /tranche de pain/,
		servings: [
			{ label: "1 tranche", grams: 30, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bwrap\b|\btortillas?\b/,
		servings: [
			{ label: "1 tortilla", grams: 60, isDefault: true, isUnit: true },
		],
	},

	// — Starchy vegetables (compound first) —
	{
		match: /pomme de terre|\bpatates?\b/,
		exclude: /patate douce/,
		servings: [
			{
				label: "1 pomme de terre",
				grams: 150,
				isDefault: true,
				isUnit: true,
			},
		],
	},
	{
		match: /patate douce/,
		servings: [
			{ label: "1 patate douce", grams: 200, isDefault: true, isUnit: true },
		],
	},
	{
		match: /champignon de paris|champignons de paris/,
		servings: [
			{ label: "1 champignon", grams: 15, isDefault: true, isUnit: true },
		],
	},

	// — Fruits —
	{
		match: /\bpommes?\b/,
		exclude:
			/\b(compote|jus|sauce|tarte|chips|gateau|cake|pain|vinaigre|cidre|beurre|terre)\b/,
		servings: [{ label: "1 pomme", grams: 180, isDefault: true, isUnit: true }],
	},
	{
		match: /\bbananes?\b/,
		exclude: /\b(pain|chips|sec|seche|bread)\b/,
		servings: [
			{ label: "1 banane", grams: 120, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\boranges?\b/,
		exclude: /\b(jus|confiture|sirop|fleur)\b/,
		servings: [
			{ label: "1 orange", grams: 150, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bclementines?\b/,
		servings: [
			{ label: "1 clémentine", grams: 80, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bmandarines?\b/,
		servings: [
			{ label: "1 mandarine", grams: 70, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bkiwis?\b/,
		servings: [{ label: "1 kiwi", grams: 75, isDefault: true, isUnit: true }],
	},
	{
		match: /\bcitrons?\b/,
		exclude: /\b(jus|tarte|gateau|confit|confiture|crumble|meringue|sucre)\b/,
		servings: [
			{ label: "1 citron", grams: 100, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bpoires?\b/,
		exclude: /\b(compote|sirop|jus|tarte|conserve|belle helene)\b/,
		servings: [{ label: "1 poire", grams: 170, isDefault: true, isUnit: true }],
	},
	{
		match: /\bpeches?\b/,
		exclude: /\b(sirop|conserve|jus|melba|the)\b/,
		servings: [{ label: "1 pêche", grams: 150, isDefault: true, isUnit: true }],
	},
	{
		match: /\babricots?\b/,
		exclude: /\b(sec|seche|confiture|sirop)\b/,
		servings: [
			{ label: "1 abricot", grams: 45, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bprunes?\b/,
		exclude: /\bpruneaux?\b/,
		servings: [{ label: "1 prune", grams: 50, isDefault: true, isUnit: true }],
	},
	{
		match: /\bavocats?\b/,
		servings: [
			{ label: "1 avocat", grams: 180, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bmangues?\b/,
		exclude: /\b(jus|sec|chutney)\b/,
		servings: [
			{ label: "1 mangue", grams: 300, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bpamplemousses?\b/,
		exclude: /\bjus\b/,
		servings: [
			{ label: "1 pamplemousse", grams: 350, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bnectarines?\b/,
		servings: [
			{ label: "1 nectarine", grams: 140, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bfigues?\b/,
		exclude: /\b(sec|seche|confiture)\b/,
		servings: [{ label: "1 figue", grams: 50, isDefault: true, isUnit: true }],
	},
	{
		match: /\bkakis?\b/,
		servings: [{ label: "1 kaki", grams: 180, isDefault: true, isUnit: true }],
	},
	{
		match: /\bgrenades?\b/,
		exclude: /\bjus\b/,
		servings: [
			{ label: "1 grenade", grams: 250, isDefault: true, isUnit: true },
		],
	},

	// — Vegetables —
	{
		match: /\bcarottes?\b/,
		exclude: /\b(jus|rapee|rapees|puree)\b/,
		servings: [
			{ label: "1 carotte", grams: 80, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\btomates?\b/,
		exclude:
			/\b(cerise|sauce|coulis|concentre|pelee|pelees|pizza|ketchup|puree|sechee|seche|sechees|soupe)\b/,
		servings: [
			{ label: "1 tomate", grams: 120, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\boignons?\b/,
		exclude: /\b(jus|soupe|poudre|pickle|frit)\b/,
		servings: [
			{ label: "1 oignon", grams: 110, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bechalotes?\b/,
		servings: [
			{ label: "1 échalote", grams: 20, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bcourgettes?\b/,
		servings: [
			{ label: "1 courgette", grams: 200, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bpoivrons?\b/,
		servings: [
			{ label: "1 poivron", grams: 160, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\baubergines?\b/,
		servings: [
			{ label: "1 aubergine", grams: 300, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bconcombres?\b/,
		servings: [
			{ label: "1 concombre", grams: 400, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bendives?\b/,
		servings: [
			{ label: "1 endive", grams: 100, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bartichauts?\b/,
		servings: [
			{ label: "1 artichaut", grams: 380, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bpoireaux?\b/,
		servings: [
			{ label: "1 poireau", grams: 200, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bradis?\b/,
		servings: [{ label: "1 radis", grams: 10, isDefault: true, isUnit: true }],
	},

	// — Protein (compound first) —
	{
		match: /steak hache|steak haché/,
		servings: [
			{ label: "1 steak haché", grams: 100, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bsteaks?\b/,
		exclude: /\bhache\b/,
		servings: [{ label: "1 steak", grams: 150, isDefault: true, isUnit: true }],
	},
	{
		match: /escalope.*poulet|blanc.*poulet|poulet.*escalope|poulet.*blanc/,
		servings: [
			{ label: "1 escalope", grams: 120, isDefault: true, isUnit: true },
		],
	},
	{
		match: /cuisse.*poulet|poulet.*cuisse|pilon/,
		servings: [
			{ label: "1 cuisse", grams: 150, isDefault: true, isUnit: true },
		],
	},
	{
		match: /saucisse.*strasbourg|knacki|knack/,
		servings: [{ label: "1 knack", grams: 30, isDefault: true, isUnit: true }],
	},
	{
		match: /\bmerguez\b/,
		servings: [
			{ label: "1 merguez", grams: 50, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bsaucisses?\b/,
		exclude: /\b(strasbourg|knacki|knack|cocktail|merguez)\b/,
		servings: [
			{ label: "1 saucisse", grams: 70, isDefault: true, isUnit: true },
		],
	},
	{
		match: /jambon blanc|jambon cuit|tranche.*jambon|jambon.*tranche/,
		servings: [
			{ label: "1 tranche", grams: 30, isDefault: true, isUnit: true },
		],
	},
	{
		match:
			/filet.*poisson|pave.*saumon|filet.*saumon|filet.*cabillaud|filet.*merlu|filet.*sole/,
		servings: [{ label: "1 filet", grams: 150, isDefault: true, isUnit: true }],
	},

	// — Snacks —
	{
		match: /barre.*cereale|barre.*cereales/,
		servings: [{ label: "1 barre", grams: 25, isDefault: true, isUnit: true }],
	},
	{
		match: /\bcookies?\b/,
		servings: [{ label: "1 cookie", grams: 15, isDefault: true, isUnit: true }],
	},
	{
		match: /\bmadeleines?\b/,
		servings: [
			{ label: "1 madeleine", grams: 25, isDefault: true, isUnit: true },
		],
	},
	{
		match: /\bpancakes?\b/,
		servings: [
			{ label: "1 pancake", grams: 50, isDefault: true, isUnit: true },
		],
	},
];

export function findServingPreset(name: string): ServingPreset | null {
	const n = normalize(name);
	for (const p of PRESETS) {
		if (!p.match.test(n)) continue;
		if (p.exclude?.test(n)) continue;
		return p;
	}
	return null;
}
