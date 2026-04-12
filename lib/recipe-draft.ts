import { useEffect, useState } from "react";
import type { RecipeItemInput, RecipeKind } from "./recipe-service";

export interface RecipeDraft {
	id: string | null;
	name: string;
	kind: RecipeKind;
	totalWeightG: number | null;
	servingsDefault: number | null;
	imageUrl: string | null;
	notes: string | null;
	items: RecipeItemInput[];
}

let active: RecipeDraft | null = null;
const listeners = new Set<() => void>();

function notify() {
	for (const fn of listeners) fn();
}

export function getActiveDraft(): RecipeDraft | null {
	return active;
}

export function setActiveDraft(draft: RecipeDraft | null): void {
	active = draft;
	notify();
}

export function patchActiveDraft(patch: Partial<RecipeDraft>): void {
	if (!active) return;
	active = { ...active, ...patch };
	notify();
}

export function addIngredient(item: RecipeItemInput): void {
	if (!active) return;
	active = { ...active, items: [...active.items, item] };
	notify();
}

export function updateIngredient(index: number, item: RecipeItemInput): void {
	if (!active) return;
	const next = active.items.slice();
	next[index] = item;
	active = { ...active, items: next };
	notify();
}

export function removeIngredient(index: number): void {
	if (!active) return;
	active = {
		...active,
		items: active.items.filter((_, i) => i !== index),
	};
	notify();
}

export function clearActiveDraft(): void {
	active = null;
	notify();
}

export function useActiveDraft(): RecipeDraft | null {
	const [, setTick] = useState(0);
	useEffect(() => {
		const fn = () => setTick((t) => t + 1);
		listeners.add(fn);
		return () => {
			listeners.delete(fn);
		};
	}, []);
	return active;
}

export function emptyDraft(kind: RecipeKind = "recipe"): RecipeDraft {
	return {
		id: null,
		name: "",
		kind,
		totalWeightG: null,
		servingsDefault: null,
		imageUrl: null,
		notes: null,
		items: [],
	};
}
