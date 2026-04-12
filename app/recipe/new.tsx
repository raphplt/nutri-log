import { useEffect } from "react";
import { RecipeEditor } from "@/components/RecipeEditor";
import { emptyDraft, getActiveDraft, setActiveDraft } from "@/lib/recipe-draft";

export default function NewRecipeScreen() {
	useEffect(() => {
		const draft = getActiveDraft();
		if (!draft || draft.id !== null) {
			setActiveDraft(emptyDraft("recipe"));
		}
	}, []);

	return <RecipeEditor mode="new" />;
}
