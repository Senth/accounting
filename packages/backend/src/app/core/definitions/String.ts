export {}

declare global {
	interface String {
		/**
		 * @return true if this string represents an ISO date (YYYY-MM-DD)
		 */
		isValidIsoDate(): boolean
	}
}

const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|3[0-1])$/

String.prototype.isValidIsoDate = function (): boolean {
	if (ISO_DATE_REGEX.test(String(this))) {
		// Check so the date is actually valide
		const parsedDate = Date.parse(String(this))
		if (parsedDate === NaN) {
			return false
		}
		// Special case for February 29
		else if (new Date(parsedDate).toISOString().substr(0, 10) != this) {
			return false
		}
	} else {
		return false
	}
	return true
}
