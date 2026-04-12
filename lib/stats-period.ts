import { shiftDate, todayString } from "@/lib/date";

export type PeriodKind = "week" | "month" | "3m" | "year" | "custom";

export interface Period {
	kind: PeriodKind;
	from: string;
	to: string;
}

export function computePeriod(
	kind: PeriodKind,
	customFrom?: string,
	customTo?: string,
): Period {
	const to = todayString();
	switch (kind) {
		case "week":
			return { kind, from: shiftDate(to, -6), to };
		case "month":
			return { kind, from: shiftDate(to, -29), to };
		case "3m":
			return { kind, from: shiftDate(to, -89), to };
		case "year":
			return { kind, from: shiftDate(to, -364), to };
		case "custom":
			return {
				kind,
				from: customFrom ?? shiftDate(to, -29),
				to: customTo ?? to,
			};
	}
}

export function daysBetween(from: string, to: string): number {
	const fromD = new Date(`${from}T00:00:00`);
	const toD = new Date(`${to}T00:00:00`);
	return Math.round((toD.getTime() - fromD.getTime()) / 86400000) + 1;
}

export function previousPeriod(period: Period): Period {
	const length = daysBetween(period.from, period.to);
	const prevTo = shiftDate(period.from, -1);
	const prevFrom = shiftDate(prevTo, -(length - 1));
	return { kind: period.kind, from: prevFrom, to: prevTo };
}

export function fillDateRange<T extends { date: string }>(
	rows: T[],
	from: string,
	to: string,
	fill: (date: string) => T,
): T[] {
	const map = new Map(rows.map((r) => [r.date, r]));
	const out: T[] = [];
	let cursor = from;
	while (cursor <= to) {
		out.push(map.get(cursor) ?? fill(cursor));
		cursor = shiftDate(cursor, 1);
	}
	return out;
}

export function movingAverage(values: number[], window: number): number[] {
	const out: number[] = new Array(values.length).fill(0);
	for (let i = 0; i < values.length; i++) {
		const start = Math.max(0, i - window + 1);
		let sum = 0;
		let count = 0;
		for (let j = start; j <= i; j++) {
			sum += values[j];
			count++;
		}
		out[i] = count > 0 ? sum / count : 0;
	}
	return out;
}
