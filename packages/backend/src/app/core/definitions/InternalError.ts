/**
 * A custom error type that is thrown
 */
export class InternalError {
	type: InternalError.Types
	error?: any
	constructor(type: InternalError.Types, error?: any) {
		this.type = type
		this.error = error

		// TODO log error
	}
}

export namespace InternalError {
	/**
	 * The different errors the application can send
	 */
	export enum Types {
		userNotFound = 'user-not-found',
		comparableError = 'cannot-compare-the-objects',
		accountNumberNotFound = 'account-number-not-found',
		verificationNotFound = 'verification-not-found',
		invalidEntityState = 'invalid-entity-state',
		serviceNotReachable = 'service-not-reachable',
		tooFewElements = 'too-few-elements',
		exchangeRateNotSet = 'exchange-rate-not-set',
		currencyCodeNotFound = 'currency-code-not-found',
		notImplemented = 'not-implemented',
		readingFile = 'reading-file',
		fileNotFound = 'file-not-found',
		dbConnectionError = 'db-connection-error',
		dbError = 'db-error',
		stateInvalid = 'state-invalid',
		dbSearchReturnedEmpty = 'db-search-returned-empty',
		exchangeRateAccessError = 'exchange-rate-access-error',
		fileSave = 'file-save',
		unknown = 'internal-error',
	}
}
