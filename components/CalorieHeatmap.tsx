import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import type { HeatmapCell } from "@/lib/stats-service";

interface Props {
	data: HeatmapCell[];
}

const CELL_SIZE = 12;
const CELL_GAP = 3;

export function CalorieHeatmap({ data }: Props) {
	const columns = useMemo(() => buildColumns(data), [data]);

	return (
		<View style={styles.wrapper}>
			<View style={styles.grid}>
				{columns.map((col, idx) => {
					const colKey = col.find((c) => c)?.date ?? `col-${idx}`;
					return (
						<View key={colKey} style={styles.col}>
							{col.map((cell, i) => (
								<View
									key={cell?.date ?? `empty-${colKey}-${i}`}
									style={[
										styles.cell,
										{ backgroundColor: cellColor(cell?.pctOfTarget) },
									]}
								/>
							))}
						</View>
					);
				})}
			</View>
		</View>
	);
}

function buildColumns(cells: HeatmapCell[]): (HeatmapCell | null)[][] {
	if (cells.length === 0) return [];
	const firstDate = new Date(`${cells[0].date}T00:00:00`);
	// shift so Monday = 0
	const firstDow = (firstDate.getDay() + 6) % 7;
	const columns: (HeatmapCell | null)[][] = [];
	let current: (HeatmapCell | null)[] = new Array(firstDow).fill(null);

	for (const cell of cells) {
		current.push(cell);
		if (current.length === 7) {
			columns.push(current);
			current = [];
		}
	}
	if (current.length > 0) {
		while (current.length < 7) current.push(null);
		columns.push(current);
	}
	return columns;
}

function cellColor(pct: number | undefined): string {
	if (pct === undefined || pct <= 0) return colors.surfaceLight;
	if (pct > 1.2) return colors.warning;
	if (pct >= 0.9) return colors.success;
	if (pct >= 0.6) return `${colors.primary}aa`;
	if (pct >= 0.3) return `${colors.primary}66`;
	return `${colors.primary}33`;
}

const styles = StyleSheet.create({
	wrapper: {
		marginVertical: spacing.sm,
	},
	grid: {
		flexDirection: "row",
		gap: CELL_GAP,
	},
	col: {
		gap: CELL_GAP,
	},
	cell: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		borderRadius: radii.sm / 3,
	},
});
