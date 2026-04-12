import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { drainScanQueue } from "@/lib/scan-queue";

/**
 * Listens for connectivity changes; when we go online, drains the offline
 * scan queue. Mount once at the root of the app.
 */
export function useScanQueueResolver(
	onResolved?: (count: number) => void,
): void {
	useEffect(() => {
		let active = true;
		const handle = async () => {
			if (!active) return;
			const count = await drainScanQueue();
			if (count > 0) onResolved?.(count);
		};

		const unsubscribe = NetInfo.addEventListener((state) => {
			if (state.isConnected) handle();
		});

		NetInfo.fetch().then((state) => {
			if (state.isConnected) handle();
		});

		return () => {
			active = false;
			unsubscribe();
		};
	}, [onResolved]);
}
