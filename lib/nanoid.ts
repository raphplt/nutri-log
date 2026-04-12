import { nanoid } from "nanoid/non-secure";

export function createId(): string {
	return nanoid(12);
}
