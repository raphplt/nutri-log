import { Stack } from "expo-router";
import { colors } from "@/constants/theme";
import { OnboardingProvider } from "@/lib/onboarding-store";

export default function OnboardingLayout() {
	return (
		<OnboardingProvider>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: colors.background },
					animation: "slide_from_right",
				}}
			/>
		</OnboardingProvider>
	);
}
