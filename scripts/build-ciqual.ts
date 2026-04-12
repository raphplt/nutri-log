/**
 * One-shot build script: downloads CIQUAL XLS from data.gouv.fr,
 * parses it, and writes assets/ciqual.json.
 *
 * Run manually via: npx tsx scripts/build-ciqual.ts
 * Commit the generated assets/ciqual.json; do not bundle xlsx at runtime.
 *
 * Source: ANSES CIQUAL 2020, Licence Ouverte Etalab v2.0.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as XLSX from "xlsx";

const XLS_URL =
	"https://www.data.gouv.fr/api/1/datasets/r/bcdb7fec-875c-42aa-ba6e-460adf97aad3";

const COLS = {
	code: "alim_code",
	name: "alim_nom_fr",
	group: "alim_grp_code",
	kcal: "Energie, Règlement UE N° 1169/2011 (kcal/100 g)",
	protein: "Protéines, N x facteur de Jones (g/100 g)",
	carbs: "Glucides (g/100 g)",
	fat: "Lipides (g/100 g)",
	fiber: "Fibres alimentaires (g/100 g)",
	sodiumMg: "Sodium (mg/100 g)",
} as const;

interface CiqualEntry {
	code: number;
	name: string;
	group: string | null;
	kcal: number | null;
	protein: number | null;
	carbs: number | null;
	fat: number | null;
	fiber: number | null;
	sodiumMg: number | null;
}

function parseValue(raw: unknown): number | null {
	if (raw == null) return null;
	if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
	if (typeof raw !== "string") return null;

	const trimmed = raw.trim();
	if (trimmed === "" || trimmed === "-") return null;
	if (/^traces?$/i.test(trimmed)) return 0;

	const lessThan = trimmed.match(/^<\s*([\d,.]+)$/);
	if (lessThan) {
		const n = Number(lessThan[1].replace(",", "."));
		return Number.isFinite(n) ? n / 2 : null;
	}

	const normalized = trimmed.replace(/\s+/g, "").replace(",", ".");
	const n = Number(normalized);
	return Number.isFinite(n) ? n : null;
}

async function download(): Promise<string> {
	const path = join(tmpdir(), `ciqual-${Date.now()}.xls`);
	const res = await fetch(XLS_URL);
	if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(path, buf);
	return path;
}

async function main() {
	console.log("→ downloading CIQUAL XLS…");
	const path = await download();
	console.log(`→ reading ${path}`);

	const wb = XLSX.readFile(path);
	const sheet = wb.Sheets[wb.SheetNames[0]];
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

	const entries: CiqualEntry[] = [];
	let skipped = 0;
	for (const row of rows) {
		const kcal = parseValue(row[COLS.kcal]);
		if (kcal == null) {
			skipped++;
			continue;
		}
		const code = row[COLS.code];
		const name = row[COLS.name];
		if (typeof code !== "number" || typeof name !== "string" || !name.trim()) {
			skipped++;
			continue;
		}

		entries.push({
			code,
			name: name.trim(),
			group: typeof row[COLS.group] === "string" ? (row[COLS.group] as string) : null,
			kcal,
			protein: parseValue(row[COLS.protein]),
			carbs: parseValue(row[COLS.carbs]),
			fat: parseValue(row[COLS.fat]),
			fiber: parseValue(row[COLS.fiber]),
			sodiumMg: parseValue(row[COLS.sodiumMg]),
		});
	}

	const out = join(__dirname, "..", "assets", "ciqual.json");
	writeFileSync(out, JSON.stringify(entries));
	console.log(`→ wrote ${entries.length} entries (skipped ${skipped}) to ${out}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
