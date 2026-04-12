import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export type SupportedLanguage = "fr" | "en";
export type LanguagePreference = SupportedLanguage | "auto";

export function detectDeviceLanguage(): SupportedLanguage {
	const code = getLocales()[0]?.languageCode;
	return code === "en" ? "en" : "fr";
}

export function resolveLanguage(pref: LanguagePreference): SupportedLanguage {
	return pref === "auto" ? detectDeviceLanguage() : pref;
}

i18n.use(initReactI18next).init({
	resources: {
		fr: { translation: fr },
		en: { translation: en },
	},
	lng: detectDeviceLanguage(),
	fallbackLng: "fr",
	interpolation: { escapeValue: false },
	compatibilityJSON: "v4",
	returnNull: false,
});

export default i18n;
