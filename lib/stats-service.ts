import { and, between, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { mealItems, meals, weightLog } from "@/db/schema";
import { fillDateRange, movingAverage } from "@/lib/stats-period";

export interface DailyKcal {
	date: string;
	kcal: number;
}

export interface DailyMacros {
	date: string;
	protein: number;
	carbs: number;
	fat: number;
}

export interface WeightPoint {
	date: string;
	weightKg: number;
}

export interface MealTypeAvg {
	mealType: string;
	avgKcal: number;
}

export interface StreakInfo {
	current: number;
	best: number;
}

export async function dailyKcalSeries(
	from: string,
	to: string,
): Promise<DailyKcal[]> {
	const rows = await db
		.select({
			date: meals.date,
			kcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
		})
		.from(meals)
		.leftJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
		.where(and(gte(meals.date, from), lte(meals.date, to)))
		.groupBy(meals.date)
		.orderBy(meals.date);

	return fillDateRange(
		rows.map((r) => ({ date: r.date, kcal: Math.round(r.kcal) })),
		from,
		to,
		(date) => ({ date, kcal: 0 }),
	);
}

export async function dailyMacrosSeries(
	from: string,
	to: string,
): Promise<DailyMacros[]> {
	const rows = await db
		.select({
			date: meals.date,
			protein: sql<number>`coalesce(sum(${mealItems.protein}), 0)`,
			carbs: sql<number>`coalesce(sum(${mealItems.carbs}), 0)`,
			fat: sql<number>`coalesce(sum(${mealItems.fat}), 0)`,
		})
		.from(meals)
		.leftJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
		.where(and(gte(meals.date, from), lte(meals.date, to)))
		.groupBy(meals.date)
		.orderBy(meals.date);

	return fillDateRange(
		rows.map((r) => ({
			date: r.date,
			protein: Math.round(r.protein),
			carbs: Math.round(r.carbs),
			fat: Math.round(r.fat),
		})),
		from,
		to,
		(date) => ({ date, protein: 0, carbs: 0, fat: 0 }),
	);
}

export async function averageByMealType(
	from: string,
	to: string,
): Promise<MealTypeAvg[]> {
	const rows = await db
		.select({
			mealType: meals.mealType,
			totalKcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
			mealId: meals.id,
		})
		.from(meals)
		.leftJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
		.where(and(gte(meals.date, from), lte(meals.date, to)))
		.groupBy(meals.id, meals.mealType);

	const buckets = new Map<string, { sum: number; count: number }>();
	for (const r of rows) {
		const bucket = buckets.get(r.mealType) ?? { sum: 0, count: 0 };
		bucket.sum += r.totalKcal;
		bucket.count += 1;
		buckets.set(r.mealType, bucket);
	}

	const order = ["breakfast", "lunch", "snack", "dinner"];
	return order
		.map((mealType) => ({ mealType, bucket: buckets.get(mealType) }))
		.filter(
			(x): x is { mealType: string; bucket: { sum: number; count: number } } =>
				x.bucket !== undefined,
		)
		.map(({ mealType, bucket }) => ({
			mealType,
			avgKcal: bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0,
		}));
}

export async function weightSeries(
	from: string,
	to: string,
): Promise<WeightPoint[]> {
	const rows = await db
		.select({ date: weightLog.date, weightKg: weightLog.weightKg })
		.from(weightLog)
		.where(between(weightLog.date, from, to))
		.orderBy(weightLog.date);
	return rows;
}

export async function totalsOverPeriod(
	from: string,
	to: string,
): Promise<{
	totalKcal: number;
	totalProtein: number;
	totalCarbs: number;
	totalFat: number;
	loggedDays: number;
}> {
	const totals = await db
		.select({
			totalKcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
			totalProtein: sql<number>`coalesce(sum(${mealItems.protein}), 0)`,
			totalCarbs: sql<number>`coalesce(sum(${mealItems.carbs}), 0)`,
			totalFat: sql<number>`coalesce(sum(${mealItems.fat}), 0)`,
		})
		.from(mealItems)
		.innerJoin(meals, sql`${mealItems.mealId} = ${meals.id}`)
		.where(and(gte(meals.date, from), lte(meals.date, to)));

	const days = await db
		.selectDistinct({ date: meals.date })
		.from(meals)
		.innerJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
		.where(and(gte(meals.date, from), lte(meals.date, to)));

	const row = totals[0];
	return {
		totalKcal: Math.round(row?.totalKcal ?? 0),
		totalProtein: Math.round(row?.totalProtein ?? 0),
		totalCarbs: Math.round(row?.totalCarbs ?? 0),
		totalFat: Math.round(row?.totalFat ?? 0),
		loggedDays: days.length,
	};
}

export async function streakInfo(): Promise<StreakInfo> {
	const rows = await db
		.selectDistinct({ date: meals.date })
		.from(meals)
		.innerJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
		.orderBy(meals.date);

	if (rows.length === 0) return { current: 0, best: 0 };

	const loggedDates = new Set(rows.map((r) => r.date));
	const sorted = [...loggedDates].sort();

	let best = 1;
	let run = 1;
	for (let i = 1; i < sorted.length; i++) {
		const prev = new Date(`${sorted[i - 1]}T00:00:00`);
		const curr = new Date(`${sorted[i]}T00:00:00`);
		const diff = (curr.getTime() - prev.getTime()) / 86400000;
		if (diff === 1) {
			run++;
			if (run > best) best = run;
		} else {
			run = 1;
		}
	}

	const today = new Date();
	let current = 0;
	for (let i = 0; i < sorted.length; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const iso = d.toISOString().slice(0, 10);
		if (loggedDates.has(iso)) current++;
		else break;
	}

	return { current, best };
}

export interface HeatmapCell {
	date: string;
	pctOfTarget: number;
}

export async function heatmapData(
	from: string,
	to: string,
	kcalTarget: number,
): Promise<HeatmapCell[]> {
	const series = await dailyKcalSeries(from, to);
	return series.map((s) => ({
		date: s.date,
		pctOfTarget: kcalTarget > 0 ? Math.min(1.5, s.kcal / kcalTarget) : 0,
	}));
}

export interface ComparePeriods {
	currentAvg: number;
	previousAvg: number;
	deltaPct: number;
}

export function computeMovingAverage(values: number[], window = 7): number[] {
	return movingAverage(values, window);
}

export function projectionToTarget(
	weightData: WeightPoint[],
	targetWeight: number,
): { weeksToTarget: number | null; slopePerWeek: number } {
	if (weightData.length < 2) return { weeksToTarget: null, slopePerWeek: 0 };
	const firstDate = new Date(`${weightData[0].date}T00:00:00`).getTime();
	const n = weightData.length;

	let sumX = 0;
	let sumY = 0;
	let sumXY = 0;
	let sumXX = 0;
	for (const p of weightData) {
		const t = new Date(`${p.date}T00:00:00`).getTime();
		const x = (t - firstDate) / 86400000;
		sumX += x;
		sumY += p.weightKg;
		sumXY += x * p.weightKg;
		sumXX += x * x;
	}
	const denom = n * sumXX - sumX * sumX;
	if (denom === 0) return { weeksToTarget: null, slopePerWeek: 0 };
	const slopePerDay = (n * sumXY - sumX * sumY) / denom;
	const slopePerWeek = slopePerDay * 7;

	const latest = weightData[weightData.length - 1].weightKg;
	const remaining = targetWeight - latest;
	if (slopePerDay === 0 || Math.sign(remaining) !== Math.sign(slopePerDay)) {
		return { weeksToTarget: null, slopePerWeek };
	}
	const weeks = remaining / slopePerWeek;
	return { weeksToTarget: weeks > 0 ? weeks : null, slopePerWeek };
}
