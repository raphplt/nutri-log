import { and, between, gte, lte, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import { db } from "@/db/client";
import { mealItems, meals, weightLog } from "@/db/schema";
import { fillDateRange, previousPeriod } from "@/lib/stats-period";
import type {
	DailyKcal,
	DailyMacros,
	MealTypeAvg,
	StreakInfo,
	WeightPoint,
} from "@/lib/stats-service";

export function useDailyKcalSeries(from: string, to: string): DailyKcal[] {
	const { data } = useLiveQuery(
		db
			.select({
				date: meals.date,
				kcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
			})
			.from(meals)
			.leftJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
			.where(and(gte(meals.date, from), lte(meals.date, to)))
			.groupBy(meals.date)
			.orderBy(meals.date),
		[from, to],
	);

	return fillDateRange(
		data.map((r) => ({ date: r.date, kcal: Math.round(r.kcal) })),
		from,
		to,
		(date) => ({ date, kcal: 0 }),
	);
}

export function useDailyMacrosSeries(from: string, to: string): DailyMacros[] {
	const { data } = useLiveQuery(
		db
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
			.orderBy(meals.date),
		[from, to],
	);

	return fillDateRange(
		data.map((r) => ({
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

export function useWeightSeries(from: string, to: string): WeightPoint[] {
	const { data } = useLiveQuery(
		db
			.select({ date: weightLog.date, weightKg: weightLog.weightKg })
			.from(weightLog)
			.where(between(weightLog.date, from, to))
			.orderBy(weightLog.date),
		[from, to],
	);
	return data;
}

export function usePeriodTotals(from: string, to: string) {
	const { data } = useLiveQuery(
		db
			.select({
				totalKcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
				totalProtein: sql<number>`coalesce(sum(${mealItems.protein}), 0)`,
				totalCarbs: sql<number>`coalesce(sum(${mealItems.carbs}), 0)`,
				totalFat: sql<number>`coalesce(sum(${mealItems.fat}), 0)`,
			})
			.from(mealItems)
			.innerJoin(meals, sql`${mealItems.mealId} = ${meals.id}`)
			.where(and(gte(meals.date, from), lte(meals.date, to))),
		[from, to],
	);

	const { data: distinct } = useLiveQuery(
		db
			.selectDistinct({ date: meals.date })
			.from(meals)
			.innerJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
			.where(and(gte(meals.date, from), lte(meals.date, to))),
		[from, to],
	);

	const row = data[0];
	return {
		totalKcal: Math.round(row?.totalKcal ?? 0),
		totalProtein: Math.round(row?.totalProtein ?? 0),
		totalCarbs: Math.round(row?.totalCarbs ?? 0),
		totalFat: Math.round(row?.totalFat ?? 0),
		loggedDays: distinct.length,
	};
}

export function useAverageByMealType(from: string, to: string): MealTypeAvg[] {
	const { data } = useLiveQuery(
		db
			.select({
				mealType: meals.mealType,
				totalKcal: sql<number>`coalesce(sum(${mealItems.kcal}), 0)`,
				mealId: meals.id,
			})
			.from(meals)
			.leftJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
			.where(and(gte(meals.date, from), lte(meals.date, to)))
			.groupBy(meals.id, meals.mealType),
		[from, to],
	);

	const buckets = new Map<string, { sum: number; count: number }>();
	for (const r of data) {
		const b = buckets.get(r.mealType) ?? { sum: 0, count: 0 };
		b.sum += r.totalKcal;
		b.count += 1;
		buckets.set(r.mealType, b);
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

export interface ComparedTotals {
	current: {
		avgKcal: number;
		loggedDays: number;
		totalKcal: number;
	};
	previous: {
		avgKcal: number;
		loggedDays: number;
		totalKcal: number;
	};
	deltaKcalPct: number;
	deltaLoggedDays: number;
}

export function useComparedTotals(from: string, to: string): ComparedTotals {
	const prev = previousPeriod({ kind: "custom", from, to });
	const current = usePeriodTotals(from, to);
	const previous = usePeriodTotals(prev.from, prev.to);

	const currentAvg =
		current.loggedDays > 0
			? Math.round(current.totalKcal / current.loggedDays)
			: 0;
	const prevAvg =
		previous.loggedDays > 0
			? Math.round(previous.totalKcal / previous.loggedDays)
			: 0;

	const deltaKcalPct =
		prevAvg > 0 ? Math.round(((currentAvg - prevAvg) / prevAvg) * 100) : 0;

	return {
		current: {
			avgKcal: currentAvg,
			loggedDays: current.loggedDays,
			totalKcal: current.totalKcal,
		},
		previous: {
			avgKcal: prevAvg,
			loggedDays: previous.loggedDays,
			totalKcal: previous.totalKcal,
		},
		deltaKcalPct,
		deltaLoggedDays: current.loggedDays - previous.loggedDays,
	};
}

export function useHeatmapData(from: string, to: string, kcalTarget: number) {
	const series = useDailyKcalSeries(from, to);
	return series.map((s) => ({
		date: s.date,
		pctOfTarget: kcalTarget > 0 ? Math.min(1.5, s.kcal / kcalTarget) : 0,
	}));
}

export function useStreakInfo(): StreakInfo {
	const { data } = useLiveQuery(
		db
			.selectDistinct({ date: meals.date })
			.from(meals)
			.innerJoin(mealItems, sql`${mealItems.mealId} = ${meals.id}`)
			.orderBy(meals.date),
	);

	return useMemo(() => computeStreakFromDates(data.map((d) => d.date)), [data]);
}

function computeStreakFromDates(dates: string[]): StreakInfo {
	if (dates.length === 0) return { current: 0, best: 0 };
	const loggedDates = new Set(dates);
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
