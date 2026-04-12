import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { getMeta, setMeta } from "@/lib/app-meta";
import {
	computePeriod,
	type Period,
	type PeriodKind,
} from "@/lib/stats-period";

interface StatsPeriodContextValue {
	period: Period;
	setPeriod: (kind: PeriodKind, customFrom?: string, customTo?: string) => void;
}

const StatsPeriodContext = createContext<StatsPeriodContextValue | null>(null);

const META_KEY = "stats_period";

interface StoredPeriod {
	kind: PeriodKind;
	customFrom?: string;
	customTo?: string;
}

export function StatsPeriodProvider({ children }: { children: ReactNode }) {
	const [period, setPeriodState] = useState<Period>(() =>
		computePeriod("week"),
	);

	useEffect(() => {
		getMeta(META_KEY).then((raw) => {
			if (!raw) return;
			try {
				const parsed = JSON.parse(raw) as StoredPeriod;
				setPeriodState(
					computePeriod(parsed.kind, parsed.customFrom, parsed.customTo),
				);
			} catch {
				// ignore
			}
		});
	}, []);

	const setPeriod = useCallback(
		(kind: PeriodKind, customFrom?: string, customTo?: string) => {
			const next = computePeriod(kind, customFrom, customTo);
			setPeriodState(next);
			const stored: StoredPeriod = { kind, customFrom, customTo };
			setMeta(META_KEY, JSON.stringify(stored));
		},
		[],
	);

	const value = useMemo(() => ({ period, setPeriod }), [period, setPeriod]);

	return (
		<StatsPeriodContext.Provider value={value}>
			{children}
		</StatsPeriodContext.Provider>
	);
}

export function useStatsPeriod(): StatsPeriodContextValue {
	const ctx = useContext(StatsPeriodContext);
	if (!ctx) {
		throw new Error("useStatsPeriod must be used within StatsPeriodProvider");
	}
	return ctx;
}
