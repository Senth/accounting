import { Immutable } from './Immutable'

/**
 * A custom type of error that is solely for sending error messages as an output.
 */
export class OutputError {
	readonly errors: Immutable<OutputError.Info[]>
	constructor(errors: OutputError.Info[]) {
		// Remove duplicates
		this.errors = errors.reduce((array, item) => {
			const exists = !!array.find((object) => object.type === item.type && object.data === item.data)
			if (!exists) {
				array.push(item)
			}
			return array
		}, new Array<OutputError.Info>())
	}

	static create(type: OutputError.Types, data?: string): OutputError {
		return new OutputError([{ type: type, data: data }])
	}
}

export namespace OutputError {
	export interface Info {
		type: Types
		data?: string
	}

	export enum Types {
		idIsEmpty = 'id-is-empty',
		dateCreatedTooEarly = 'date-created-too-early',
		dateCreatedInTheFuture = 'date-created-in-the-future',
		dateCreatedMissing = 'date-created-missing',
		dateModifiedRequiresDateCreated = 'date-modified-requires-date-created',
		dateModifiedInTheFuture = 'date-modified-in-the-future',
		dateModifiedBeforeCreated = 'date-modified-before-created',
		dateDeletedNotSameAsModified = 'date-deleted-not-same-as-modified',
		dateDeletedRequiresDateModified = 'date-deleted-requires-date-modified',
		accountNumberOutOfRange = 'account-number-out-of-range',
		accountNumberInvalidFormat = 'account-number-invalid-format',
		accountNumberNotFound = 'account-number-not-found',
		accountVatAccountNotSet = 'account-vat-account-not-set',
		accountVatPercentageNotSet = 'account-vat-percentage-not-set',
		accountReverseVatAccountNotSet = 'account-reverse-vat-account-not-set',
		amountIsZero = 'amount-is-zero',
		currenciesNotComparable = 'currencies-not-comparable',
		currencyCodeInvalid = 'currency-code-invalid',
		currencyCodeLocalInvalid = 'currency-code-local-invalid',
		currencyCodeLocalNotSet = 'currency-code-local-not-set',
		currencyCodesAreSame = 'currency-codes-are-same',
		exchangeRateNotSet = 'exchange-rate-not-set',
		exchangeRateZero = 'exchange-rate-zero',
		userIdIsEmpty = 'user-id-is-empty',
		nameTooShort = 'name-too-short',
		internalNameTooShort = 'internal-name-too-short',
		verificationTypeMissing = 'verification-type-missing',
		verificationMissing = 'verification-missing',
		verificationNotFound = 'verification-not-found',
		verificationNumberInvalid = 'verification-number-invalid',
		verificationNumberMissing = 'verification-number-missing',
		verificationDateFiledMissing = 'verification-date-filed-missing',
		verificationDateFiledBeforeCreated = 'verification-date-filed-before-created',
		verificationInvoiceIdIsEmpty = 'verification-invoice-id-is-empty',
		verificationPaymentIdIsEmpty = 'verification-payment-id-is-empty',
		verificationAmountDoesNotMatchAnyTransaction = 'verification-amount-does-not-match-any-transaction',
		verificationTypeInvalid = 'verification-type-invalid',
		verificationFiscalYearIdIsEmpty = 'verification-fiscal-year-id-is-empty',
		transactionSumIsNotZero = 'transaction-sum-is-not-zero',
		transactionsMissing = 'transactions-missing',
		transactionNotFound = 'transaction-not-found',
		transactionsCurrencyCodeLocalMismatch = 'transactions-currency-code-local-mismatch',
		transactionInvoiceAccountNotFound = 'transaction-invoice-account-not-found',
		transactionWithAccountNumberExists = 'transaction-with-account-number-exists',
		parserPatternNotFound = 'parser-pattern-not-found',
		parserNotFound = 'parser-not-found',
		parserMatcherInvalid = 'parser-matcher-invalid',
		parserMatcherFindMissing = 'parser-matcher-find-missing',
		parserMatcherReplacementMissing = 'parser-matcher-replacement-missing',
		parserMatcherReplaceMissing = 'parser-matcher-replace-missing',
		parserDateInputInvalid = 'parser-date-input-invalid',
		parserCurrencyCodeInvalid = 'parser-currency-code-invalid',
		parserMatcherGroupMissing = 'parser-matcher-group-missing',
		parserLineMatchersOrGenericRequired = 'parser-line-matcher-or-generic-required',
		userNotFound = 'user-not-found',
		internalError = 'internal-error',
		dateFormatInvalid = 'date-format-invalid',
		fiscalYearToBeforeFrom = 'fiscal-year-to-before-from',
		fiscalYearNotFound = 'fiscal-year-not-found',
		invoiceAlreadyBound = 'invoice-already-bound',
		paymentAlreadyBound = 'payment-already-bound',
		invoiceNotValidType = 'invoice-not-valid-type',
		paymentNotValidType = 'payment-not-valid-type',
		invoicePaymentTypeMismatch = 'invoice-payment-type-mismatch',
		invoiceOutBindNotImplemented = 'invoice-out-bound-not-implemented',
		apiKeyMissing = 'api-key-missing',
		nameMissing = 'name-missing',
		dateMissing = 'date-missing',
		amountMissing = 'amount-missing',
		accountFromMissing = 'account-from-missing',
		accountToMissing = 'account-to-missing',
		currencyCodeMissing = 'currency-code-missing',
		accountNumberMissing = 'account-number-missing',
		userIdMissing = 'user-id-missing',
		descriptionInvalidFormat = 'description-invalid-format',
	}
}
