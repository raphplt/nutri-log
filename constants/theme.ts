export const colors = {
	background: "#0A0A0F",
	surface: "#16161F",
	surfaceLight: "#1E1E2A",
	surfaceHover: "#252533",

	primary: "#3FA46A",
	primaryLight: "#5CC287",
	primaryDeep: "#2F8553",
	primaryGlow: "rgba(63, 164, 106, 0.16)",

	success: "#3FA46A",
	warning: "#F59E0B",
	danger: "#EF4444",
	info: "#60A5FA",

	text: "#F1F5F9",
	textMuted: "#94A3B8",
	textDim: "#64748B",
	textInverse: "#0A0A0F",

	border: "#2A2A3A",
	borderActive: "#3F3F52",

	macro: {
		protein: "#EF4444",
		carbs: "#F59E0B",
		fat: "#8B5CF6",
		fiber: "#3FA46A",
	},
} as const;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	hero: 48,
} as const;

export const radii = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	pill: 28,
	full: 9999,
} as const;

export const fontSize = {
	xs: 11,
	sm: 13,
	md: 15,
	lg: 17,
	xl: 20,
	heading: 18,
	title: 22,
	display: 32,
	xxl: 28,
	hero: 48,
} as const;

export const fontWeight = {
	regular: "400",
	medium: "500",
	semibold: "600",
	bold: "700",
} as const;

export const fonts = {
	regular: "Inter_400Regular",
	medium: "Inter_500Medium",
	semibold: "Inter_600SemiBold",
	bold: "Inter_700Bold",
} as const;

export const shadows = {
	fab: {
		shadowColor: "#3FA46A",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 16,
		elevation: 8,
	},
} as const;
