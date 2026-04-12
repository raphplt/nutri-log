/**
 * Map a food name to a representative emoji. Used as a visual fallback when no
 * image is available (all CIQUAL entries, plus OFF products without a photo).
 */
const RULES: [RegExp, string][] = [
	[/\b(poulet|dinde|volaille)/i, "🍗"],
	[/\b(boeuf|bœuf|veau|agneau|mouton|cheval)/i, "🥩"],
	[/\b(porc|jambon|lard|bacon|saucisse|cochon|charcut)/i, "🥓"],
	[
		/\b(poisson|saumon|thon|cabillaud|sardine|maquereau|morue|merlu|dorade|bar)/i,
		"🐟",
	],
	[
		/\b(crevette|langoustine|crabe|homard|moule|coquillage|huître|huitre|calamar)/i,
		"🦐",
	],
	[/\b(oeuf|œuf|omelette)/i, "🥚"],
	[
		/\b(lait|yaourt|crème|creme|fromage|beurre|cottage|camembert|brie|parmesan|feta|mozzarella|comté|emmental|gruyère)/i,
		"🧀",
	],
	[/\b(pomme de terre|patate)/i, "🥔"],
	[/\b(carotte)/i, "🥕"],
	[/\b(tomate)/i, "🍅"],
	[/\b(oignon|échalote|echalote|ail)/i, "🧅"],
	[
		/\b(salade|laitue|roquette|mâche|mache|cresson|endive|épinard|epinard)/i,
		"🥬",
	],
	[/\b(brocoli|chou)/i, "🥦"],
	[/\b(concombre|courgette|cornichon)/i, "🥒"],
	[/\b(poivron|piment)/i, "🫑"],
	[/\b(champignon|cèpe|cepe|girolle|morille|truffe)/i, "🍄"],
	[/\b(pomme|compote)/i, "🍎"],
	[/\b(banane)/i, "🍌"],
	[/\b(orange|clémentine|clementine|mandarine)/i, "🍊"],
	[/\b(citron)/i, "🍋"],
	[/\b(fraise|framboise|mûre|mure|myrtille|cassis|groseille)/i, "🍓"],
	[/\b(raisin)/i, "🍇"],
	[/\b(pêche|peche|nectarine|abricot)/i, "🍑"],
	[/\b(poire)/i, "🍐"],
	[/\b(ananas)/i, "🍍"],
	[/\b(avocat)/i, "🥑"],
	[/\b(pain|baguette|brioche|biscotte)/i, "🍞"],
	[/\b(croissant|viennois)/i, "🥐"],
	[/\b(pâte|pate|spaghetti|pasta|tagliatelle|penne|macaroni)/i, "🍝"],
	[/\b(riz)/i, "🍚"],
	[/\b(céréale|cereal|avoine|muesli|granola|flocons)/i, "🥣"],
	[/\b(pizza)/i, "🍕"],
	[/\b(burger|hamburger|cheeseburger)/i, "🍔"],
	[/\b(sandwich)/i, "🥪"],
	[/\b(frite)/i, "🍟"],
	[/\b(soupe|bouillon|velouté|veloute)/i, "🥣"],
	[/\b(salade composée|composee)/i, "🥗"],
	[
		/\b(gâteau|gateau|cake|tarte|mousse|brownie|cookie|madeleine|éclair|eclair|macaron|pâtisserie|patisserie)/i,
		"🍰",
	],
	[/\b(chocolat)/i, "🍫"],
	[/\b(glace|sorbet|crème glacée|creme glacee)/i, "🍨"],
	[/\b(bonbon|sucre|confiserie|confiture|miel)/i, "🍬"],
	[/\b(café|cafe|expresso|espresso)/i, "☕"],
	[/\b(thé|the|infusion)/i, "🍵"],
	[/\b(jus)/i, "🧃"],
	[/\b(eau|boisson)/i, "💧"],
	[/\b(vin)/i, "🍷"],
	[/\b(bière|biere|cidre)/i, "🍺"],
	[
		/\b(noix|amande|noisette|pistache|cacahuète|cacahuete|arachide|graine)/i,
		"🥜",
	],
	[/\b(haricot|lentille|pois chiche|fève|feve|soja)/i, "🫘"],
	[/\b(légume|legume)/i, "🥗"],
	[/\b(fruit)/i, "🍎"],
	[/\b(boulgour|couscous|quinoa|semoule)/i, "🍚"],
];

export function foodEmoji(name: string): string {
	for (const [re, emoji] of RULES) {
		if (re.test(name)) return emoji;
	}
	return "🍽️";
}
