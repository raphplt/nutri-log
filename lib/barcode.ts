/**
 * Validate an EAN-13 barcode's check digit.
 * Algorithm: weighted sum 1,3,1,3… on the first 12 digits, then (10 − sum%10) % 10.
 */
export function isValidEan13(code: string): boolean {
	if (!/^\d{13}$/.test(code)) return false;
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = Number(code.charCodeAt(i) - 48);
		sum += i % 2 === 0 ? digit : digit * 3;
	}
	const check = (10 - (sum % 10)) % 10;
	return check === Number(code.charCodeAt(12) - 48);
}

export function isLikelyBarcode(code: string): boolean {
	return /^\d{8,14}$/.test(code);
}
