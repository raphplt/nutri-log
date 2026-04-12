import Constants from "expo-constants";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const USER_AGENT = `NutriLog/${APP_VERSION} (contact@nutrilog.app)`;
const DEFAULT_TIMEOUT_MS = 8000;
const RETRY_DELAYS_MS = [500, 1500];

export class HttpError extends Error {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

interface FetchOptions {
	signal?: AbortSignal;
	headers?: Record<string, string>;
	timeoutMs?: number;
}

function composeSignal(
	external: AbortSignal | undefined,
	timeoutMs: number,
): AbortSignal {
	const ctrl = new AbortController();
	const onAbort = () => ctrl.abort(external?.reason);
	if (external?.aborted) ctrl.abort(external.reason);
	else external?.addEventListener("abort", onAbort, { once: true });
	const timer = setTimeout(
		() => ctrl.abort(new DOMException("timeout", "TimeoutError")),
		timeoutMs,
	);
	ctrl.signal.addEventListener(
		"abort",
		() => {
			clearTimeout(timer);
			external?.removeEventListener("abort", onAbort);
		},
		{ once: true },
	);
	return ctrl.signal;
}

export async function fetchJson<T>(
	url: string,
	opts: FetchOptions = {},
): Promise<T> {
	const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	let lastErr: unknown;

	for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
		const signal = composeSignal(opts.signal, timeout);
		try {
			const res = await fetch(url, {
				headers: {
					"User-Agent": USER_AGENT,
					Accept: "application/json",
					...opts.headers,
				},
				signal,
			});

			if (!res.ok) {
				if (res.status >= 400 && res.status < 500) {
					throw new HttpError(res.status, `HTTP ${res.status}`);
				}
				throw new HttpError(res.status, `HTTP ${res.status}`);
			}

			return (await res.json()) as T;
		} catch (err) {
			lastErr = err;
			if (opts.signal?.aborted) throw err;
			if (err instanceof HttpError && err.status >= 400 && err.status < 500)
				throw err;
			if (attempt < RETRY_DELAYS_MS.length) {
				await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
				continue;
			}
			throw err;
		}
	}

	throw lastErr;
}
