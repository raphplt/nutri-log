import i18n from "@/lib/i18n";

export function todayString(): string {
	return new Date().toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr: string): string {
	const today = todayString();
	if (dateStr === today) return i18n.t("common.today");

	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	if (dateStr === yesterday.toISOString().slice(0, 10))
		return i18n.t("common.yesterday");

	const locale = i18n.language === "en" ? "en-US" : "fr-FR";
	const d = new Date(`${dateStr}T00:00:00`);
	return d.toLocaleDateString(locale, {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}

export function shiftDate(dateStr: string, days: number): string {
	const d = new Date(`${dateStr}T00:00:00`);
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}
